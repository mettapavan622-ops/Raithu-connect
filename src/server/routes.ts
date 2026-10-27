import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { MarketplaceService, marketplaceService } from './services.ts';
import { generateListingDraft } from './ai.ts';
import {
  registerSchema,
  loginSchema,
  adminLoginSchema,
  productCreateSchema,
  stockAdjustmentSchema,
  checkoutSchema,
  orderStatusUpdateSchema,
  listingReportSchema,
  moderationActionSchema,
  aiDraftSchema,
} from '../shared/schemas.ts';
import type { User } from '../shared/types.ts';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function createApiRouter(service: MarketplaceService = marketplaceService) {
  const router = express.Router();

  // Helper to set session cookie & CSRF cookie
  const setAuthCookies = (res: Response, token: string) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const csrfToken = crypto.randomBytes(24).toString('hex');

    res.cookie('rc_session', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.cookie('XSRF-TOKEN', csrfToken, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return csrfToken;
  };

  // Auth Middleware
  const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const sessionToken = req.cookies?.rc_session || (req.headers['authorization']?.replace('Bearer ', ''));
    if (!sessionToken) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    const user = service.getSessionUser(sessionToken);
    if (!user) {
      return res.status(401).json({ error: 'SESSION_EXPIRED', message: 'Session expired or invalid' });
    }

    req.user = user;
    next();
  };

  // CSRF protection for state-changing requests when authenticated via cookie
  const verifyCsrf = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    // If authorization header is used (e.g. tests or direct API calls), skip cookie csrf check
    if (req.headers['authorization']) {
      return next();
    }
    const cookieToken = req.cookies?.['XSRF-TOKEN'];
    const headerToken = req.headers['x-csrf-token'];
    if (cookieToken && (!headerToken || headerToken !== cookieToken)) {
      return res.status(403).json({ error: 'CSRF_INVALID', message: 'Invalid or missing CSRF token' });
    }
    next();
  };

  // Role Guard
  const requireRole = (allowedRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`,
        });
      }
      next();
    };
  };

  // Rate limiting map for login
  const loginAttempts = new Map<string, { count: number; resetAt: number }>();
  const checkRateLimit = (key: string): boolean => {
    const now = Date.now();
    const record = loginAttempts.get(key);
    if (!record || now > record.resetAt) {
      loginAttempts.set(key, { count: 1, resetAt: now + 60_000 });
      return true;
    }
    if (record.count >= 10) {
      return false;
    }
    record.count += 1;
    return true;
  };
  const resetRateLimit = (key: string) => {
    loginAttempts.delete(key);
  };

  // Apply CSRF check
  router.use(verifyCsrf);

  // --- Auth Endpoints ---

  // Register (Farmers or Buyers only - Admin registration strictly prohibited)
  router.post('/auth/register', (req, res) => {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Invalid registration input',
        details: parseResult.error.flatten(),
      });
    }

    const {
      email,
      password,
      role,
      fullName,
      phone,
      preferredLanguage,
      locality,
      buyerType,
      businessName,
      ...farmerDetails
    } = parseResult.data;

    // Guard: Admin accounts cannot be registered publicly
    if ((role as string) === 'admin') {
      return res.status(403).json({
        error: 'ADMIN_REGISTRATION_FORBIDDEN',
        message: 'Administrator accounts cannot be created via public registration.',
      });
    }

    try {
      const user = service.createUser({
        email,
        password,
        role: role as 'farmer' | 'buyer',
        fullName,
        phone,
        preferredLanguage: preferredLanguage || 'en',
        locality: locality || farmerDetails.villageMandal || 'Hyderabad',
        buyerType: buyerType || 'household',
        businessName: businessName || '',
        farmerDetails: role === 'farmer' ? {
          ...farmerDetails,
          villageMandal: farmerDetails.villageMandal || locality,
        } : undefined,
      });

      const { token } = service.createSession(user.id);
      const csrfToken = setAuthCookies(res, token);

      let farmerProfile = null;
      if (user.role === 'farmer') {
        farmerProfile = service.getFarmerProfileByUserId(user.id);
      }

      return res.status(201).json({
        user,
        farmerProfile,
        csrfToken,
        message: 'Registration successful! Welcome to RaithuConnect.',
      });
    } catch (err: any) {
      return res.status(400).json({ error: 'REGISTRATION_FAILED', message: err.message });
    }
  });

  // Login (Buyer & Farmer portal with role mismatch verification)
  router.post('/auth/login', (req, res) => {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Valid email and password required' });
    }

    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const rateKey = `${clientIp}_${parseResult.data.email.toLowerCase()}`;
    if (!checkRateLimit(rateKey)) {
      return res.status(429).json({
        error: 'TOO_MANY_ATTEMPTS',
        message: 'Too many failed login attempts. Please wait 1 minute before trying again.',
      });
    }

    const userWithHash = service.getUserByEmail(parseResult.data.email);
    if (!userWithHash) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    const match = bcrypt.compareSync(parseResult.data.password, userWithHash.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    // Role verification & mismatch handling
    const expectedRole = parseResult.data.expectedRole;

    // Admin account trying to sign in through public login
    if (userWithHash.role === 'admin') {
      return res.status(403).json({
        error: 'ACCOUNT_ROLE_MISMATCH',
        message: 'This account possesses platform administrative privileges. Please log in through the official Admin Portal.',
        actualRole: 'admin',
        expectedRole,
      });
    }

    // Mismatch between selected login tab and actual account role
    if (expectedRole && userWithHash.role !== expectedRole) {
      return res.status(409).json({
        error: 'ACCOUNT_ROLE_MISMATCH',
        message: `This account is registered as a ${userWithHash.role === 'farmer' ? 'Farmer' : 'Buyer'} account, but you selected ${expectedRole === 'farmer' ? 'Farmer' : 'Buyer'} sign-in.`,
        actualRole: userWithHash.role,
        expectedRole,
      });
    }

    resetRateLimit(rateKey);

    const { token } = service.createSession(userWithHash.id);
    const csrfToken = setAuthCookies(res, token);

    const user = service.getUserById(userWithHash.id)!;

    let farmerProfile = null;
    if (user.role === 'farmer') {
      farmerProfile = service.getFarmerProfileByUserId(user.id);
    }

    return res.json({ user, farmerProfile, csrfToken });
  });

  // Dedicated Admin Login (/admin/login)
  router.post('/admin/login', (req, res) => {
    const parseResult = adminLoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Valid administrator email and password required' });
    }

    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const rateKey = `admin_${clientIp}_${parseResult.data.email.toLowerCase()}`;
    if (!checkRateLimit(rateKey)) {
      return res.status(429).json({
        error: 'TOO_MANY_ATTEMPTS',
        message: 'Too many attempts. Administrative portal locked for 1 minute.',
      });
    }

    const userWithHash = service.getUserByEmail(parseResult.data.email);
    if (!userWithHash) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid administrator credentials' });
    }

    const match = bcrypt.compareSync(parseResult.data.password, userWithHash.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid administrator credentials' });
    }

    if (userWithHash.role !== 'admin') {
      return res.status(403).json({
        error: 'ADMIN_ACCESS_REQUIRED',
        message: 'Access Denied: This portal is strictly restricted to authorized platform administrators.',
        actualRole: userWithHash.role,
      });
    }

    resetRateLimit(rateKey);

    const { token } = service.createSession(userWithHash.id);
    const csrfToken = setAuthCookies(res, token);
    const user = service.getUserById(userWithHash.id)!;

    return res.json({ user, farmerProfile: null, csrfToken });
  });

  // Demo Login (Explicit backend authentication for seeded accounts)
  router.post('/auth/demo-login', (req, res) => {
    const { role, email } = req.body;
    let targetEmail = email;

    if (!targetEmail) {
      if (role === 'farmer') targetEmail = 'mallikarjun.farmer@raithu.in';
      else if (role === 'buyer') targetEmail = 'priya.buyer@hyd.in';
      else if (role === 'admin') targetEmail = 'admin@raithuconnect.telangana.gov';
      else {
        return res.status(400).json({ error: 'INVALID_DEMO_ROLE', message: 'Specify a valid demo role or email' });
      }
    }

    const userWithHash = service.getUserByEmail(targetEmail);
    if (!userWithHash) {
      return res.status(404).json({ error: 'DEMO_ACCOUNT_NOT_FOUND', message: `Demo account ${targetEmail} not found. Please seed the database.` });
    }

    const { token } = service.createSession(userWithHash.id);
    const csrfToken = setAuthCookies(res, token);

    const user = service.getUserById(userWithHash.id)!;

    let farmerProfile = null;
    if (user.role === 'farmer') {
      farmerProfile = service.getFarmerProfileByUserId(user.id);
    }

    return res.json({ user, farmerProfile, csrfToken });
  });

  // Get current user & CSRF
  router.get('/auth/me', (req: AuthenticatedRequest, res) => {
    const sessionToken = req.cookies?.rc_session || (req.headers['authorization']?.replace('Bearer ', ''));
    if (!sessionToken) {
      return res.json({ user: null, farmerProfile: null });
    }

    const user = service.getSessionUser(sessionToken);
    if (!user) {
      return res.json({ user: null, farmerProfile: null });
    }

    let farmerProfile = null;
    if (user.role === 'farmer') {
      farmerProfile = service.getFarmerProfileByUserId(user.id);
    }

    const csrfToken = req.cookies?.['XSRF-TOKEN'] || setAuthCookies(res, sessionToken);
    return res.json({ user, farmerProfile, csrfToken });
  });

  // Update authenticated user profile and language preference
  router.put('/auth/profile', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const updated = service.updateUserProfile(req.user!.id, {
        fullName: req.body.fullName,
        phone: req.body.phone,
        preferredLanguage: req.body.preferredLanguage,
        locality: req.body.locality,
        buyerType: req.body.buyerType,
        businessName: req.body.businessName,
      });

      let farmerProfile = null;
      if (updated.role === 'farmer') {
        farmerProfile = service.getFarmerProfileByUserId(updated.id);
      }

      return res.json({ user: updated, farmerProfile, message: 'Profile updated successfully' });
    } catch (err: any) {
      return res.status(400).json({ error: 'PROFILE_UPDATE_FAILED', message: err.message });
    }
  });

  // Update farmer farm details
  router.put('/farmer/profile', requireAuth, requireRole(['farmer']), (req: AuthenticatedRequest, res) => {
    try {
      const updatedProfile = service.updateFarmerProfile(req.user!.id, {
        farmName: req.body.farmName,
        villageMandal: req.body.villageMandal,
        district: req.body.district,
        bio: req.body.bio,
        upiId: req.body.upiId,
        phone: req.body.phone,
        address: req.body.address,
        mainCategories: req.body.mainCategories,
      });

      return res.json({ farmerProfile: updatedProfile, message: 'Farm profile updated successfully' });
    } catch (err: any) {
      return res.status(400).json({ error: 'FARM_PROFILE_UPDATE_FAILED', message: err.message });
    }
  });

  // Farmer Sales Analytics (Strictly scoped to authenticated farmer)
  router.get('/farmer/sales', requireAuth, requireRole(['farmer']), (req: AuthenticatedRequest, res) => {
    try {
      const sales = service.getFarmerSalesSummary(req.user!.id);
      return res.json({ sales });
    } catch (err: any) {
      return res.status(500).json({ error: 'SALES_FETCH_FAILED', message: err.message });
    }
  });

  // Logout
  router.post('/auth/logout', (req: AuthenticatedRequest, res) => {
    const sessionToken = req.cookies?.rc_session || (req.headers['authorization']?.replace('Bearer ', ''));
    if (sessionToken) {
      service.deleteSession(sessionToken);
    }
    res.clearCookie('rc_session', { path: '/' });
    res.clearCookie('XSRF-TOKEN', { path: '/' });
    return res.json({ success: true, message: 'Logged out successfully' });
  });

  // --- Listings / Products Endpoints ---

  // Public Marketplace listing search & filters
  router.get('/products', (req, res) => {
    try {
      const { search, category, locality, minPrice, maxPrice, inStock, surplus, farmerId } = req.query;

      const products = service.getProducts({
        search: typeof search === 'string' ? search : undefined,
        category: typeof category === 'string' ? category : undefined,
        locality: typeof locality === 'string' ? locality : undefined,
        minPriceRupees: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPriceRupees: maxPrice ? parseFloat(maxPrice as string) : undefined,
        inStockOnly: inStock === 'true',
        surplusOnly: surplus === 'true',
        farmerId: typeof farmerId === 'string' ? farmerId : undefined,
        includeHidden: false,
      });

      return res.json({ products });
    } catch (err: any) {
      return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
    }
  });

  // Product details & Harvest Passport
  router.get('/products/:id', (req, res) => {
    const product = service.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found' });
    }
    return res.json({ product });
  });

  // Farmer's own listings (includes hidden listings for management)
  router.get('/farmer/products', requireAuth, requireRole(['farmer']), (req: AuthenticatedRequest, res) => {
    try {
      const products = service.getProducts({
        farmerId: req.user!.id,
        includeHidden: true,
      });
      return res.json({ products });
    } catch (err: any) {
      return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
    }
  });

  // Create Product Listing
  router.post('/farmer/products', requireAuth, requireRole(['farmer']), (req: AuthenticatedRequest, res) => {
    const parseResult = productCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Invalid product data',
        details: parseResult.error.flatten(),
      });
    }

    try {
      const product = service.createProduct(req.user!.id, parseResult.data);
      return res.status(201).json({ product });
    } catch (err: any) {
      return res.status(400).json({ error: 'CREATION_FAILED', message: err.message });
    }
  });

  // Adjust on-hand stock (enforcing on_hand >= reserved)
  router.patch('/farmer/products/:id/stock', requireAuth, requireRole(['farmer']), (req: AuthenticatedRequest, res) => {
    const parseResult = stockAdjustmentSchema.safeParse({
      productId: req.params.id,
      newOnHandQuantity: req.body.newOnHandQuantity,
    });

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Invalid stock quantity',
      });
    }

    try {
      const updated = service.adjustProductStock(
        req.user!.id,
        parseResult.data.productId,
        parseResult.data.newOnHandQuantity
      );
      return res.json({ product: updated });
    } catch (err: any) {
      return res.status(400).json({ error: 'STOCK_ADJUSTMENT_FAILED', message: err.message });
    }
  });

  // Farmer metrics dashboard
  router.get('/farmer/dashboard', requireAuth, requireRole(['farmer']), (req: AuthenticatedRequest, res) => {
    try {
      const metrics = service.getFarmerDashboardMetrics(req.user!.id);
      return res.json(metrics);
    } catch (err: any) {
      return res.status(500).json({ error: 'DASHBOARD_ERROR', message: err.message });
    }
  });

  // Farmer public profile
  router.get('/farmers/:id/profile', (req, res) => {
    const user = service.getUserById(req.params.id);
    if (!user || user.role !== 'farmer') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Farmer profile not found' });
    }

    const profile = service.getFarmerProfileByUserId(user.id);
    const activeProducts = service.getProducts({ farmerId: user.id, includeHidden: false });

    return res.json({
      farmer: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        createdAt: user.createdAt,
      },
      profile,
      products: activeProducts,
    });
  });

  // --- Orders & Checkout Endpoints ---

  // Atomic Cart Checkout
  router.post('/orders/checkout', requireAuth, requireRole(['buyer']), (req: AuthenticatedRequest, res) => {
    const parseResult = checkoutSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Invalid checkout payload',
        details: parseResult.error.flatten(),
      });
    }

    try {
      const orders = service.checkout({
        buyerId: req.user!.id,
        items: parseResult.data.items,
        paymentMode: parseResult.data.paymentMode,
        idempotencyKey: parseResult.data.idempotencyKey,
      });

      return res.status(201).json({
        orders,
        message: 'Order requests submitted successfully. Produce reserved for pickup.',
        logisticsNotice: 'Demo only — delivery is not arranged by this app. Please arrange pickup directly with the farmer.',
      });
    } catch (err: any) {
      return res.status(400).json({
        error: 'CHECKOUT_FAILED',
        message: err.message,
      });
    }
  });

  // Buyer order history
  router.get('/buyer/orders', requireAuth, requireRole(['buyer']), (req: AuthenticatedRequest, res) => {
    try {
      const orders = service.getOrdersForBuyer(req.user!.id);
      return res.json({ orders });
    } catch (err: any) {
      return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
    }
  });

  // Farmer incoming orders
  router.get('/farmer/orders', requireAuth, requireRole(['farmer']), (req: AuthenticatedRequest, res) => {
    try {
      const orders = service.getOrdersForFarmer(req.user!.id);
      return res.json({ orders });
    } catch (err: any) {
      return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
    }
  });

  // Get single order details
  router.get('/orders/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const order = service.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found' });
    }

    // Role security: only buyer owner, farmer owner, or admin can view order
    const isBuyerOwner = req.user!.id === order.buyerId;
    const isFarmerOwner = req.user!.id === order.farmerId;
    const isAdmin = req.user!.role === 'admin';

    if (!isBuyerOwner && !isFarmerOwner && !isAdmin) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied to this order' });
    }

    return res.json({ order });
  });

  // Update order status (accept, mark_ready, complete, cancel)
  router.post('/orders/:id/status', requireAuth, (req: AuthenticatedRequest, res) => {
    const parseResult = orderStatusUpdateSchema.safeParse({
      orderId: req.params.id,
      action: req.body.action,
      cancelReason: req.body.cancelReason,
    });

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Invalid status transition input',
      });
    }

    try {
      const updated = service.updateOrderStatus({
        orderId: parseResult.data.orderId,
        action: parseResult.data.action,
        actorUserId: req.user!.id,
        cancelReason: parseResult.data.cancelReason,
      });

      return res.json({ order: updated });
    } catch (err: any) {
      return res.status(400).json({ error: 'TRANSITION_FAILED', message: err.message });
    }
  });

  // --- Surplus Corner Endpoints ---
  router.get('/surplus', (req, res) => {
    try {
      const products = service.getSurplusListings();
      const stats = service.getSurplusSavingsStats();
      return res.json({ products, stats });
    } catch (err: any) {
      return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
    }
  });

  // --- Listing Reports & Moderation ---

  // Report a listing (any authenticated user)
  router.post('/reports', requireAuth, (req: AuthenticatedRequest, res) => {
    const parseResult = listingReportSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Invalid report payload',
      });
    }

    try {
      const report = service.createListingReport({
        productId: parseResult.data.productId,
        reporterUserId: req.user!.id,
        reason: parseResult.data.reason,
        details: parseResult.data.details,
      });

      return res.status(201).json({ report, message: 'Report submitted for admin review.' });
    } catch (err: any) {
      return res.status(400).json({ error: 'REPORT_FAILED', message: err.message });
    }
  });

  // Admin moderation endpoints (admin role only)
  router.get('/admin/moderation/reports', requireAuth, requireRole(['admin']), (req, res) => {
    try {
      const reports = service.getReports();
      return res.json({ reports });
    } catch (err: any) {
      return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
    }
  });

  router.get('/admin/moderation/duplicates', requireAuth, requireRole(['admin']), (req, res) => {
    try {
      const duplicates = service.getPotentialDuplicates();
      return res.json({ duplicates });
    } catch (err: any) {
      return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
    }
  });

  router.get('/admin/moderation/audit', requireAuth, requireRole(['admin']), (req, res) => {
    try {
      const auditTrail = service.getModerationAuditTrail();
      return res.json({ auditTrail });
    } catch (err: any) {
      return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
    }
  });

  router.get('/admin/stats', requireAuth, requireRole(['admin']), (req, res) => {
    try {
      const stats = service.getAdminPlatformStats();
      return res.json({ stats });
    } catch (err: any) {
      return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
    }
  });

  router.get('/admin/users', requireAuth, requireRole(['admin']), (req, res) => {
    try {
      const roleFilter = req.query.role as string | undefined;
      const search = req.query.search as string | undefined;
      const users = service.getAdminUsersList({ role: roleFilter, search });
      return res.json({ users });
    } catch (err: any) {
      return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
    }
  });

  router.get('/admin/activity', requireAuth, requireRole(['admin']), (req, res) => {
    try {
      const activities = service.getAdminActivityLogs();
      return res.json({ activities });
    } catch (err: any) {
      return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
    }
  });

  router.get('/admin/listings', requireAuth, requireRole(['admin']), (req, res) => {
    try {
      const statusFilter = req.query.status as string | undefined;
      let products = service.getProducts({ includeHidden: true });
      if (statusFilter && ['active', 'hidden', 'rejected'].includes(statusFilter)) {
        products = products.filter(p => p.status === statusFilter);
      }
      return res.json({ products });
    } catch (err: any) {
      return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
    }
  });

  router.post('/admin/moderation/action', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res) => {
    const parseResult = moderationActionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Invalid moderation action',
      });
    }

    try {
      const updatedProduct = service.moderateListing({
        productId: parseResult.data.productId,
        adminUserId: req.user!.id,
        action: parseResult.data.action,
        reason: parseResult.data.reason,
      });

      return res.json({
        product: updatedProduct,
        message: `Listing status updated to ${updatedProduct.status}`,
      });
    } catch (err: any) {
      return res.status(400).json({ error: 'MODERATION_FAILED', message: err.message });
    }
  });

  // --- AI Listing Assistant Endpoint ---
  router.post('/ai/draft-listing', requireAuth, requireRole(['farmer']), async (req: AuthenticatedRequest, res) => {
    const parseResult = aiDraftSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Input text is required',
      });
    }

    try {
      const profile = service.getFarmerProfileByUserId(req.user!.id);
      const farmerLocality = req.body.farmerLocality || profile?.villageMandal || 'Hyderabad Rural';

      const draft = await generateListingDraft(parseResult.data.input, farmerLocality);
      return res.json({ draft });
    } catch (err: any) {
      const isMissingKey = err.message?.includes('GEMINI_API_KEY is not configured');
      return res.status(isMissingKey ? 503 : 500).json({
        error: isMissingKey ? 'AI_UNAVAILABLE' : 'AI_GENERATION_FAILED',
        message: err.message || 'Could not generate draft from input',
      });
    }
  });

  return router;
}
