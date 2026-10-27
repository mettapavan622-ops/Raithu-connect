import type { Database as BetterSqliteDatabase } from 'better-sqlite3';
import { db as defaultDb } from './db.ts';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import type {
  User,
  FarmerProfile,
  Product,
  Order,
  OrderItem,
  OrderStatus,
  OrderEvent,
  ListingReport,
  ModerationAction,
  ProduceCategory,
  ProduceUnit,
  ProductStatus,
} from '../shared/types.ts';

export class MarketplaceService {
  private db: BetterSqliteDatabase;

  constructor(db: BetterSqliteDatabase = defaultDb) {
    this.db = db;
  }

  // --- Auth & Users ---
  getUserByEmail(email: string): (User & { password_hash: string }) | null {
    const row = this.db.prepare(`
      SELECT id, email, password_hash, role, full_name as fullName, phone, created_at as createdAt
      FROM users WHERE lower(email) = lower(?)
    `).get(email) as any;
    return row || null;
  }

  getUserById(id: string): User | null {
    const row = this.db.prepare(`
      SELECT id, email, role, full_name as fullName, phone, created_at as createdAt
      FROM users WHERE id = ?
    `).get(id) as any;
    return row || null;
  }

  getFarmerProfileByUserId(userId: string): FarmerProfile | null {
    const row = this.db.prepare(`
      SELECT id, user_id as userId, farm_name as farmName, village_mandal as villageMandal,
             district, bio, upi_id as upiId, phone, address, created_at as createdAt
      FROM farmer_profiles WHERE user_id = ?
    `).get(userId) as any;
    return row || null;
  }

  createUser(params: {
    email: string;
    password: string;
    role: 'farmer' | 'buyer';
    fullName: string;
    phone: string;
    farmerDetails?: {
      farmName?: string;
      villageMandal?: string;
      district?: string;
      bio?: string;
      upiId?: string;
      address?: string;
    };
  }): User {
    const existing = this.getUserByEmail(params.email);
    if (existing) {
      throw new Error('An account with this email already exists');
    }

    const userId = 'usr_' + crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(params.password, 10);
    const now = new Date().toISOString();

    const insertUser = this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO users (id, email, password_hash, role, full_name, phone, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(userId, params.email.toLowerCase(), passwordHash, params.role, params.fullName, params.phone, now);

      if (params.role === 'farmer') {
        const profileId = 'fp_' + crypto.randomUUID();
        const details = params.farmerDetails || {};
        this.db.prepare(`
          INSERT INTO farmer_profiles (id, user_id, farm_name, village_mandal, district, bio, upi_id, phone, address, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          profileId,
          userId,
          details.farmName || `${params.fullName}'s Natural Farm`,
          details.villageMandal || 'Chevella Mandal',
          details.district || 'Ranga Reddy',
          details.bio || 'Local grower committed to fresh harvest.',
          details.upiId || `${params.phone}@upi`,
          params.phone,
          details.address || details.villageMandal || 'Hyderabad Rural',
          now
        );
      }
    });

    insertUser();

    return {
      id: userId,
      email: params.email.toLowerCase(),
      role: params.role,
      fullName: params.fullName,
      phone: params.phone,
      createdAt: now,
    };
  }

  createSession(userId: string): { token: string; expiresAt: string } {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO sessions (token, user_id, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `).run(token, userId, expiresAt, now);

    return { token, expiresAt };
  }

  getSessionUser(token: string): User | null {
    if (!token) return null;
    const row = this.db.prepare(`
      SELECT u.id, u.email, u.role, u.full_name as fullName, u.phone, u.created_at as createdAt, s.expires_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ?
    `).get(token) as any;

    if (!row) return null;
    if (new Date(row.expires_at) < new Date()) {
      this.db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
      return null;
    }
    return {
      id: row.id,
      email: row.email,
      role: row.role,
      fullName: row.fullName,
      phone: row.phone,
      createdAt: row.createdAt,
    };
  }

  deleteSession(token: string) {
    this.db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
  }

  // --- Listings / Products ---
  createProduct(farmerId: string, data: {
    name: string;
    category: ProduceCategory;
    unit: ProduceUnit;
    pricePerUnitRupees: number;
    onHandQuantity: number;
    harvestDate: string;
    availabilityDate: string;
    pickupLocality: string;
    pickupNotes?: string;
    description?: string;
    isSurplus?: boolean;
    surplusDiscountPct?: number;
    surplusDeadline?: string | null;
    imageUrl: string;
    lotNumber?: string;
    harvestTimestamp?: string;
    fieldLocation?: string;
    harvestNotes?: string;
  }): Product {
    const user = this.getUserById(farmerId);
    if (!user || user.role !== 'farmer') {
      throw new Error('Only farmers can create listings');
    }

    // Validate quantities based on unit
    if (data.onHandQuantity <= 0) {
      throw new Error('On-hand quantity must be greater than zero');
    }
    if ((data.unit === 'piece' || data.unit === 'bunch') && !Number.isInteger(data.onHandQuantity)) {
      throw new Error('Pieces and bunches must be whole integer quantities');
    }

    const id = 'prod_' + crypto.randomUUID();
    const now = new Date().toISOString();
    const pricePerUnitPaise = Math.round(data.pricePerUnitRupees * 100);

    const tx = this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO products (
          id, farmer_id, name, category, unit, price_per_unit_paise,
          on_hand_quantity, reserved_quantity, harvest_date, availability_date,
          pickup_locality, pickup_notes, description, is_surplus,
          surplus_discount_pct, surplus_deadline, status, image_url,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
      `).run(
        id,
        farmerId,
        data.name.trim(),
        data.category,
        data.unit,
        pricePerUnitPaise,
        data.onHandQuantity,
        data.harvestDate,
        data.availabilityDate,
        data.pickupLocality.trim(),
        data.pickupNotes || '',
        data.description || '',
        data.isSurplus ? 1 : 0,
        data.surplusDiscountPct || 0,
        data.surplusDeadline || null,
        data.imageUrl,
        now,
        now
      );

      // Seed photo in product_photos
      this.db.prepare(`
        INSERT INTO product_photos (id, product_id, photo_url, is_primary)
        VALUES (?, ?, ?, 1)
      `).run('pho_' + crypto.randomUUID(), id, data.imageUrl);

      // Lot info for Harvest Passport
      const lotNumber = data.lotNumber || `LOT-${new Date(data.harvestDate).getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      this.db.prepare(`
        INSERT INTO produce_lots (id, product_id, lot_number, harvest_timestamp, field_location, harvest_notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        'lot_' + crypto.randomUUID(),
        id,
        lotNumber,
        data.harvestTimestamp || `${data.harvestDate}T06:30:00.000Z`,
        data.fieldLocation || data.pickupLocality,
        data.harvestNotes || 'Harvested early morning at peak maturity.',
        now
      );
    });

    tx();
    return this.getProductById(id)!;
  }

  getProductById(id: string): Product | null {
    const row = this.db.prepare(`
      SELECT p.*,
             u.full_name as farmer_name, u.phone as farmer_phone,
             fp.farm_name, fp.village_mandal as farmer_locality,
             l.lot_number, l.harvest_timestamp, l.field_location, l.harvest_notes
      FROM products p
      JOIN users u ON p.farmer_id = u.id
      LEFT JOIN farmer_profiles fp ON u.id = fp.user_id
      LEFT JOIN produce_lots l ON p.id = l.product_id
      WHERE p.id = ?
    `).get(id) as any;

    if (!row) return null;
    return this.mapProductRow(row);
  }

  getProducts(filters: {
    search?: string;
    category?: string;
    locality?: string;
    minPriceRupees?: number;
    maxPriceRupees?: number;
    inStockOnly?: boolean;
    surplusOnly?: boolean;
    farmerId?: string;
    includeHidden?: boolean;
  } = {}): Product[] {
    let sql = `
      SELECT p.*,
             u.full_name as farmer_name, u.phone as farmer_phone,
             fp.farm_name, fp.village_mandal as farmer_locality,
             l.lot_number, l.harvest_timestamp, l.field_location, l.harvest_notes
      FROM products p
      JOIN users u ON p.farmer_id = u.id
      LEFT JOIN farmer_profiles fp ON u.id = fp.user_id
      LEFT JOIN produce_lots l ON p.id = l.product_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (!filters.includeHidden) {
      sql += ` AND p.status = 'active'`;
    }

    if (filters.farmerId) {
      sql += ` AND p.farmer_id = ?`;
      params.push(filters.farmerId);
    }

    if (filters.category) {
      sql += ` AND p.category = ?`;
      params.push(filters.category);
    }

    if (filters.locality) {
      sql += ` AND lower(p.pickup_locality) LIKE lower(?)`;
      params.push(`%${filters.locality}%`);
    }

    if (filters.search) {
      sql += ` AND (lower(p.name) LIKE lower(?) OR lower(p.description) LIKE lower(?) OR lower(u.full_name) LIKE lower(?))`;
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }

    if (filters.minPriceRupees !== undefined && filters.minPriceRupees >= 0) {
      sql += ` AND p.price_per_unit_paise >= ?`;
      params.push(Math.round(filters.minPriceRupees * 100));
    }

    if (filters.maxPriceRupees !== undefined && filters.maxPriceRupees > 0) {
      sql += ` AND p.price_per_unit_paise <= ?`;
      params.push(Math.round(filters.maxPriceRupees * 100));
    }

    if (filters.inStockOnly) {
      sql += ` AND (p.on_hand_quantity - p.reserved_quantity) > 0`;
    }

    if (filters.surplusOnly) {
      sql += ` AND p.is_surplus = 1`;
    }

    sql += ` ORDER BY p.created_at DESC`;

    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map(r => this.mapProductRow(r));
  }

  private mapProductRow(r: any): Product {
    const onHand = r.on_hand_quantity;
    const reserved = r.reserved_quantity;
    return {
      id: r.id,
      farmerId: r.farmer_id,
      farmerName: r.farmer_name,
      farmerPhone: r.farmer_phone,
      farmName: r.farm_name,
      farmerLocality: r.farmer_locality,
      name: r.name,
      category: r.category as ProduceCategory,
      unit: r.unit as ProduceUnit,
      pricePerUnitPaise: r.price_per_unit_paise,
      onHandQuantity: onHand,
      reservedQuantity: reserved,
      availableQuantity: Math.max(0, onHand - reserved),
      harvestDate: r.harvest_date,
      availabilityDate: r.availability_date,
      pickupLocality: r.pickup_locality,
      pickupNotes: r.pickup_notes || '',
      description: r.description || '',
      isSurplus: r.is_surplus === 1,
      surplusDiscountPct: r.surplus_discount_pct || 0,
      surplusDeadline: r.surplus_deadline,
      status: r.status as ProductStatus,
      moderationNote: r.moderation_note,
      imageUrl: r.image_url,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      lotInfo: r.lot_number ? {
        lotNumber: r.lot_number,
        harvestTimestamp: r.harvest_timestamp,
        fieldLocation: r.field_location,
        harvestNotes: r.harvest_notes,
      } : undefined,
    };
  }

  // --- Farmer Inventory Adjustment ---
  adjustProductStock(farmerId: string, productId: string, newOnHandQuantity: number): Product {
    if (newOnHandQuantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    const product = this.getProductById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    if (product.farmerId !== farmerId) {
      throw new Error('Unauthorized: You do not own this product');
    }

    if ((product.unit === 'piece' || product.unit === 'bunch') && !Number.isInteger(newOnHandQuantity)) {
      throw new Error('Pieces and bunches must be whole integer quantities');
    }

    // Invariant 11: Inventory cannot be reduced below reserved quantity
    if (newOnHandQuantity < product.reservedQuantity) {
      throw new Error(
        `Cannot reduce stock to ${newOnHandQuantity}. There are currently ${product.reservedQuantity} reserved units committed to pending orders.`
      );
    }

    const now = new Date().toISOString();
    // Conditional update ensuring reserved_quantity hasn't increased concurrently
    const info = this.db.prepare(`
      UPDATE products
      SET on_hand_quantity = ?, updated_at = ?
      WHERE id = ? AND farmer_id = ? AND ? >= reserved_quantity
    `).run(newOnHandQuantity, now, productId, farmerId, newOnHandQuantity);

    if (info.changes === 0) {
      throw new Error('Failed to update stock. On-hand quantity cannot be less than currently reserved quantity.');
    }

    return this.getProductById(productId)!;
  }

  // --- Orders & Atomic Checkout ---
  checkout(params: {
    buyerId: string;
    items: Array<{ productId: string; quantity: number; expectedUnitPricePaise: number }>;
    paymentMode: 'cash_on_pickup' | 'simulated_upi';
    idempotencyKey: string;
  }): Order[] {
    const buyer = this.getUserById(params.buyerId);
    if (!buyer || buyer.role !== 'buyer') {
      throw new Error('Only registered buyers can place orders');
    }

    if (!params.items || params.items.length === 0) {
      throw new Error('Cannot checkout an empty cart');
    }

    // Check idempotency first: if orders already exist for this key, return them
    const existingOrders = this.getOrdersByIdempotencyKey(params.idempotencyKey);
    if (existingOrders.length > 0) {
      return existingOrders;
    }

    // Pre-validate items: reject zero or negative quantities, fractional quantities
    for (const item of params.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error(`Quantity must be a positive integer. Invalid: ${item.quantity}`);
      }
    }

    // Execute checkout in a single atomic transaction
    const executeCheckout = this.db.transaction(() => {
      // 1. Group items by farmer
      const farmerItemsMap = new Map<string, Array<{
        product: any;
        item: { productId: string; quantity: number; expectedUnitPricePaise: number };
        effectivePricePaise: number;
        subtotalPaise: number;
      }>>();

      const now = new Date();
      const nowIso = now.toISOString();

      for (const item of params.items) {
        // Fetch current product with lock
        const productRow = this.db.prepare(`
          SELECT * FROM products WHERE id = ?
        `).get(item.productId) as any;

        if (!productRow) {
          throw new Error(`Product not found (ID: ${item.productId})`);
        }

        // Test 13: Hidden or rejected listings cannot receive new orders
        if (productRow.status !== 'active') {
          throw new Error(`Item "${productRow.name}" is no longer active and cannot be ordered`);
        }

        // Test 13: Expired surplus listings cannot receive new orders
        if (productRow.is_surplus === 1 && productRow.surplus_deadline) {
          if (new Date(productRow.surplus_deadline) < now) {
            throw new Error(`Surplus offer for "${productRow.name}" has expired`);
          }
        }

        // Validate unit type restrictions
        if ((productRow.unit === 'piece' || productRow.unit === 'bunch') && !Number.isInteger(item.quantity)) {
          throw new Error(`Item "${productRow.name}" (${productRow.unit}) requires whole integer quantities`);
        }

        // Calculate effective price (accounting for surplus discount)
        let effectivePricePaise = productRow.price_per_unit_paise;
        if (productRow.is_surplus === 1 && productRow.surplus_discount_pct > 0) {
          effectivePricePaise = Math.round(productRow.price_per_unit_paise * (1 - productRow.surplus_discount_pct / 100));
        }

        // Validate price hasn't changed on server
        if (effectivePricePaise !== item.expectedUnitPricePaise) {
          throw new Error(
            `Price changed for "${productRow.name}". Cart had ₹${(item.expectedUnitPricePaise / 100).toFixed(2)}, current price is ₹${(effectivePricePaise / 100).toFixed(2)}`
          );
        }

        // Calculate available stock
        const availableStock = productRow.on_hand_quantity - productRow.reserved_quantity;
        // Test 1 & 4: Ordering above available stock fails
        if (item.quantity > availableStock) {
          const displayUnit = productRow.unit === 'kg' ? `${availableStock / 1000} kg` : `${availableStock} ${productRow.unit}s`;
          throw new Error(
            `Insufficient stock for "${productRow.name}". Only ${displayUnit} available (requested ${productRow.unit === 'kg' ? item.quantity / 1000 + ' kg' : item.quantity}).`
          );
        }

        // Calculate subtotal
        let subtotalPaise = 0;
        if (productRow.unit === 'kg') {
          // quantity is in grams
          subtotalPaise = Math.round((item.quantity * effectivePricePaise) / 1000);
        } else {
          subtotalPaise = item.quantity * effectivePricePaise;
        }

        // Conditional update to atomically reserve stock:
        // Ensures on_hand_quantity - (reserved_quantity + item.quantity) >= 0
        const updateResult = this.db.prepare(`
          UPDATE products
          SET reserved_quantity = reserved_quantity + ?, updated_at = ?
          WHERE id = ? AND (on_hand_quantity - reserved_quantity) >= ?
        `).run(item.quantity, nowIso, item.productId, item.quantity);

        if (updateResult.changes === 0) {
          throw new Error(`Stock conflict for "${productRow.name}". Available quantity changed during checkout.`);
        }

        const farmerId = productRow.farmer_id;
        if (!farmerItemsMap.has(farmerId)) {
          farmerItemsMap.set(farmerId, []);
        }
        farmerItemsMap.get(farmerId)!.push({
          product: productRow,
          item,
          effectivePricePaise,
          subtotalPaise,
        });
      }

      // 2. Create one order per farmer in the same transaction
      const createdOrderIds: string[] = [];

      let farmerIndex = 0;
      for (const [farmerId, farmerItems] of farmerItemsMap.entries()) {
        const orderId = 'ord_' + crypto.randomUUID();
        const randCode = Math.floor(1000 + Math.random() * 9000);
        const orderCode = `RC-${new Date().getFullYear()}-${randCode}-${farmerIndex + 1}`;
        farmerIndex++;

        let orderTotalPaise = 0;
        for (const fi of farmerItems) {
          orderTotalPaise += fi.subtotalPaise;
        }

        // Composite idempotency key for multi-order grouping if needed
        const orderIdempotencyKey = farmerItemsMap.size === 1
          ? params.idempotencyKey
          : `${params.idempotencyKey}-${farmerId}`;

        this.db.prepare(`
          INSERT INTO orders (
            id, order_code, buyer_id, farmer_id, status, payment_mode,
            payment_status, total_amount_paise, idempotency_key, created_at, updated_at
          ) VALUES (?, ?, ?, ?, 'requested', ?, ?, ?, ?, ?, ?)
        `).run(
          orderId,
          orderCode,
          params.buyerId,
          farmerId,
          params.paymentMode,
          params.paymentMode === 'simulated_upi' ? 'completed' : 'pending',
          orderTotalPaise,
          orderIdempotencyKey,
          nowIso,
          nowIso
        );

        // Record OrderItems & StockReservations
        for (const fi of farmerItems) {
          const orderItemId = 'itm_' + crypto.randomUUID();
          this.db.prepare(`
            INSERT INTO order_items (
              id, order_id, product_id, product_name_snapshot,
              unit_snapshot, unit_price_paise_snapshot, quantity, subtotal_paise
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            orderItemId,
            orderId,
            fi.item.productId,
            fi.product.name,
            fi.product.unit,
            fi.effectivePricePaise,
            fi.item.quantity,
            fi.subtotalPaise
          );

          const resId = 'res_' + crypto.randomUUID();
          this.db.prepare(`
            INSERT INTO stock_reservations (
              id, order_id, product_id, reserved_quantity, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, 'active', ?, ?)
          `).run(resId, orderId, fi.item.productId, fi.item.quantity, nowIso, nowIso);
        }

        // Record Initial OrderEvent
        this.db.prepare(`
          INSERT INTO order_events (
            id, order_id, from_status, to_status, actor_user_id, notes, created_at
          ) VALUES (?, ?, 'none', 'requested', ?, 'Order submitted by buyer. Stock reserved.', ?)
        `).run('evt_' + crypto.randomUUID(), orderId, params.buyerId, nowIso);

        createdOrderIds.push(orderId);
      }

      return createdOrderIds;
    });

    const orderIds = executeCheckout();
    return orderIds.map(id => this.getOrderById(id)!);
  }

  getOrdersByIdempotencyKey(key: string): Order[] {
    const rows = this.db.prepare(`
      SELECT id FROM orders WHERE idempotency_key = ? OR idempotency_key LIKE ?
    `).all(key, `${key}-%`) as any[];
    return rows.map(r => this.getOrderById(r.id)!);
  }

  getOrderById(id: string): Order | null {
    const row = this.db.prepare(`
      SELECT o.*,
             ub.full_name as buyer_name, ub.phone as buyer_phone,
             uf.full_name as farmer_name, uf.phone as farmer_phone,
             fp.farm_name, fp.village_mandal as pickup_locality
      FROM orders o
      JOIN users ub ON o.buyer_id = ub.id
      JOIN users uf ON o.farmer_id = uf.id
      LEFT JOIN farmer_profiles fp ON uf.id = fp.user_id
      WHERE o.id = ?
    `).get(id) as any;

    if (!row) return null;

    const items = this.db.prepare(`
      SELECT id, order_id as orderId, product_id as productId,
             product_name_snapshot as productNameSnapshot,
             unit_snapshot as unitSnapshot,
             unit_price_paise_snapshot as unitPricePaiseSnapshot,
             quantity, subtotal_paise as subtotalPaise
      FROM order_items WHERE order_id = ?
    `).all(id) as OrderItem[];

    const events = this.db.prepare(`
      SELECT oe.id, oe.order_id as orderId, oe.from_status as fromStatus,
             oe.to_status as toStatus, oe.actor_user_id as actorUserId,
             u.full_name as actorName, oe.notes, oe.created_at as createdAt
      FROM order_events oe
      JOIN users u ON oe.actor_user_id = u.id
      WHERE oe.order_id = ?
      ORDER BY oe.created_at ASC
    `).all(id) as OrderEvent[];

    return {
      id: row.id,
      orderCode: row.order_code,
      buyerId: row.buyer_id,
      buyerName: row.buyer_name,
      buyerPhone: row.buyer_phone,
      farmerId: row.farmer_id,
      farmerName: row.farmer_name,
      farmerPhone: row.farmer_phone,
      farmName: row.farm_name,
      pickupLocality: row.pickup_locality,
      status: row.status as OrderStatus,
      cancelReason: row.cancel_reason,
      cancelledBy: row.cancelled_by,
      paymentMode: row.payment_mode,
      paymentStatus: row.payment_status,
      totalAmountPaise: row.total_amount_paise,
      idempotencyKey: row.idempotency_key,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      items,
      events,
    };
  }

  getOrdersForBuyer(buyerId: string): Order[] {
    const rows = this.db.prepare(`
      SELECT id FROM orders WHERE buyer_id = ? ORDER BY created_at DESC
    `).all(buyerId) as any[];
    return rows.map(r => this.getOrderById(r.id)!);
  }

  getOrdersForFarmer(farmerId: string): Order[] {
    const rows = this.db.prepare(`
      SELECT id FROM orders WHERE farmer_id = ? ORDER BY created_at DESC
    `).all(farmerId) as any[];
    return rows.map(r => this.getOrderById(r.id)!);
  }

  // --- Order State Transitions & Inventory Synchronization ---
  updateOrderStatus(params: {
    orderId: string;
    action: 'accept' | 'mark_ready' | 'complete' | 'cancel';
    actorUserId: string;
    cancelReason?: string;
  }): Order {
    const order = this.getOrderById(params.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const actor = this.getUserById(params.actorUserId);
    if (!actor) {
      throw new Error('Actor not found');
    }

    const currentStatus = order.status;
    const nowIso = new Date().toISOString();

    // Check terminal states
    if (currentStatus === 'completed' || currentStatus === 'cancelled') {
      throw new Error(`Order is already in terminal state "${currentStatus}" and cannot be transitioned`);
    }

    // Role and ownership validation (Test 8 & Test 7)
    if (params.action === 'accept' || params.action === 'mark_ready' || params.action === 'complete') {
      if (actor.role !== 'farmer' || actor.id !== order.farmerId) {
        throw new Error('Unauthorized: Only the farmer who owns this order can accept, mark ready, or complete it');
      }
    }

    if (params.action === 'cancel') {
      const isBuyerOwner = actor.role === 'buyer' && actor.id === order.buyerId;
      const isFarmerOwner = actor.role === 'farmer' && actor.id === order.farmerId;
      const isAdmin = actor.role === 'admin';

      if (!isBuyerOwner && !isFarmerOwner && !isAdmin) {
        throw new Error('Unauthorized: You cannot cancel this order');
      }

      // Buyer can only cancel while status is 'requested'
      if (isBuyerOwner && currentStatus !== 'requested') {
        throw new Error('Buyers can only cancel an order while it is in "requested" status');
      }
    }

    // Validate workflow state machine
    let nextStatus: OrderStatus;
    if (params.action === 'accept') {
      if (currentStatus !== 'requested') {
        throw new Error(`Invalid status transition: Cannot accept order in "${currentStatus}" status`);
      }
      nextStatus = 'accepted';
    } else if (params.action === 'mark_ready') {
      if (currentStatus !== 'accepted') {
        throw new Error(`Invalid status transition: Cannot mark ready order in "${currentStatus}" status`);
      }
      nextStatus = 'ready';
    } else if (params.action === 'complete') {
      if (currentStatus !== 'ready') {
        throw new Error(`Invalid status transition: Cannot complete order in "${currentStatus}" status. Must be "ready" first.`);
      }
      nextStatus = 'completed';
    } else if (params.action === 'cancel') {
      nextStatus = 'cancelled';
    } else {
      throw new Error('Invalid action');
    }

    // Atomic execution of state transition and inventory updates
    const tx = this.db.transaction(() => {
      if (nextStatus === 'completed') {
        // Test 6: Completing an order reduces on-hand stock and consumes the reservation
        // Find all active reservations for this order
        const reservations = this.db.prepare(`
          SELECT * FROM stock_reservations WHERE order_id = ? AND status = 'active'
        `).all(order.id) as any[];

        for (const res of reservations) {
          // Consume reservation
          this.db.prepare(`
            UPDATE stock_reservations
            SET status = 'consumed', updated_at = ?
            WHERE id = ? AND status = 'active'
          `).run(nowIso, res.id);

          // Reduce on_hand_quantity and reserved_quantity
          // Ensure on_hand >= res.reserved_quantity and reserved >= res.reserved_quantity
          const updateResult = this.db.prepare(`
            UPDATE products
            SET on_hand_quantity = on_hand_quantity - ?,
                reserved_quantity = reserved_quantity - ?,
                updated_at = ?
            WHERE id = ? AND on_hand_quantity >= ? AND reserved_quantity >= ?
          `).run(res.reserved_quantity, res.reserved_quantity, nowIso, res.product_id, res.reserved_quantity, res.reserved_quantity);

          if (updateResult.changes === 0) {
            throw new Error(`Failed to update stock upon completion for product ID: ${res.product_id}`);
          }
        }

        // Update payment status if cash on pickup
        this.db.prepare(`
          UPDATE orders
          SET status = 'completed', payment_status = 'completed', updated_at = ?
          WHERE id = ?
        `).run(nowIso, order.id);

      } else if (nextStatus === 'cancelled') {
        // Test 5: Cancellation releases reservation exactly once
        // Find active reservations
        const reservations = this.db.prepare(`
          SELECT * FROM stock_reservations WHERE order_id = ? AND status = 'active'
        `).all(order.id) as any[];

        for (const res of reservations) {
          // Release reservation
          const releaseRes = this.db.prepare(`
            UPDATE stock_reservations
            SET status = 'released', updated_at = ?
            WHERE id = ? AND status = 'active'
          `).run(nowIso, res.id);

          // Only decrease product.reserved_quantity if this reservation was genuinely active and just updated
          if (releaseRes.changes > 0) {
            this.db.prepare(`
              UPDATE products
              SET reserved_quantity = reserved_quantity - ?,
                  updated_at = ?
              WHERE id = ? AND reserved_quantity >= ?
            `).run(res.reserved_quantity, nowIso, res.product_id, res.reserved_quantity);
          }
        }

        this.db.prepare(`
          UPDATE orders
          SET status = 'cancelled',
              cancel_reason = ?,
              cancelled_by = ?,
              updated_at = ?
          WHERE id = ?
        `).run(params.cancelReason || 'Cancelled by user', actor.role, nowIso, order.id);

      } else {
        // Just status update for accept / ready
        this.db.prepare(`
          UPDATE orders
          SET status = ?, updated_at = ?
          WHERE id = ?
        `).run(nextStatus, nowIso, order.id);
      }

      // Record event
      this.db.prepare(`
        INSERT INTO order_events (
          id, order_id, from_status, to_status, actor_user_id, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        'evt_' + crypto.randomUUID(),
        order.id,
        currentStatus,
        nextStatus,
        params.actorUserId,
        params.cancelReason ? `Cancelled: ${params.cancelReason}` : `Status transitioned to ${nextStatus}`,
        nowIso
      );
    });

    tx();
    return this.getOrderById(order.id)!;
  }

  // --- Farmer Metrics Dashboard ---
  getFarmerDashboardMetrics(farmerId: string) {
    const products = this.getProducts({ farmerId, includeHidden: true });
    const orders = this.getOrdersForFarmer(farmerId);

    let totalOnHandPaise = 0;
    let totalReservedPaise = 0;
    let lowStockCount = 0;

    for (const p of products) {
      if (p.unit === 'kg') {
        totalOnHandPaise += Math.round((p.onHandQuantity * p.pricePerUnitPaise) / 1000);
        totalReservedPaise += Math.round((p.reservedQuantity * p.pricePerUnitPaise) / 1000);
        // Low stock: less than 10kg
        if (p.availableQuantity < 10000) lowStockCount++;
      } else {
        totalOnHandPaise += p.onHandQuantity * p.pricePerUnitPaise;
        totalReservedPaise += p.reservedQuantity * p.pricePerUnitPaise;
        if (p.availableQuantity < 5) lowStockCount++;
      }
    }

    let completedRevenuePaise = 0;
    let requestedOrdersValuePaise = 0;
    let incomingRequestsCount = 0;
    let acceptedAndReadyCount = 0;
    let completedOrdersCount = 0;

    for (const o of orders) {
      if (o.status === 'completed') {
        completedRevenuePaise += o.totalAmountPaise;
        completedOrdersCount++;
      } else if (o.status === 'requested') {
        requestedOrdersValuePaise += o.totalAmountPaise;
        incomingRequestsCount++;
      } else if (o.status === 'accepted' || o.status === 'ready') {
        acceptedAndReadyCount++;
      }
    }

    return {
      activeListingsCount: products.filter(p => p.status === 'active').length,
      totalListingsCount: products.length,
      lowStockCount,
      inventoryValuation: {
        onHandPaise: totalOnHandPaise,
        reservedPaise: totalReservedPaise,
      },
      orders: {
        incomingRequestsCount,
        acceptedAndReadyCount,
        completedOrdersCount,
        completedRevenuePaise,
        requestedOrdersValuePaise,
      },
      recentOrders: orders.slice(0, 10),
    };
  }

  // --- Surplus Corner Calculations ---
  getSurplusListings(): Product[] {
    const nowIso = new Date().toISOString();
    const rows = this.db.prepare(`
      SELECT p.*,
             u.full_name as farmer_name, u.phone as farmer_phone,
             fp.farm_name, fp.village_mandal as farmer_locality,
             l.lot_number, l.harvest_timestamp, l.field_location, l.harvest_notes
      FROM products p
      JOIN users u ON p.farmer_id = u.id
      LEFT JOIN farmer_profiles fp ON u.id = fp.user_id
      LEFT JOIN produce_lots l ON p.id = l.product_id
      WHERE p.status = 'active'
        AND p.is_surplus = 1
        AND (p.surplus_deadline IS NULL OR p.surplus_deadline > ?)
        AND (p.on_hand_quantity - p.reserved_quantity) > 0
      ORDER BY p.surplus_discount_pct DESC, p.created_at DESC
    `).all(nowIso) as any[];

    return rows.map(r => this.mapProductRow(r));
  }

  getSurplusSavingsStats() {
    // Calculated strictly from actual completed orders of surplus items
    const row = this.db.prepare(`
      SELECT
        COALESCE(SUM(oi.quantity), 0) as totalSurplusUnitsSold,
        COALESCE(SUM(
          CASE
            WHEN p.unit = 'kg' THEN
              ROUND((oi.quantity * (p.price_per_unit_paise - oi.unit_price_paise_snapshot)) / 1000.0)
            ELSE
              (oi.quantity * (p.price_per_unit_paise - oi.unit_price_paise_snapshot))
          END
        ), 0) as totalSavingsPaise
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.status = 'completed' AND p.is_surplus = 1 AND p.price_per_unit_paise > oi.unit_price_paise_snapshot
    `).get() as any;

    return {
      totalSavingsPaise: Math.max(0, row?.totalSavingsPaise || 0),
      totalSurplusOrdersCompleted: row?.totalSurplusUnitsSold || 0,
    };
  }

  // --- Reports & Moderation ---
  createListingReport(params: {
    productId: string;
    reporterUserId: string;
    reason: string;
    details: string;
  }): ListingReport {
    const product = this.getProductById(params.productId);
    if (!product) throw new Error('Product not found');

    const id = 'rep_' + crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO listing_reports (id, product_id, reporter_user_id, reason, details, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `).run(id, params.productId, params.reporterUserId, params.reason, params.details, now);

    return {
      id,
      productId: params.productId,
      productName: product.name,
      farmerName: product.farmerName,
      reporterUserId: params.reporterUserId,
      reason: params.reason,
      details: params.details,
      status: 'pending',
      createdAt: now,
    };
  }

  getReports(): ListingReport[] {
    const rows = this.db.prepare(`
      SELECT lr.*, p.name as product_name, u.full_name as farmer_name, ur.full_name as reporter_name
      FROM listing_reports lr
      JOIN products p ON lr.product_id = p.id
      JOIN users u ON p.farmer_id = u.id
      JOIN users ur ON lr.reporter_user_id = ur.id
      ORDER BY lr.created_at DESC
    `).all() as any[];

    return rows.map(r => ({
      id: r.id,
      productId: r.product_id,
      productName: r.product_name,
      farmerName: r.farmer_name,
      reporterUserId: r.reporter_user_id,
      reporterName: r.reporter_name,
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.created_at,
    }));
  }

  moderateListing(params: {
    productId: string;
    adminUserId: string;
    action: 'hide' | 'restore' | 'reject';
    reason: string;
  }): Product {
    const admin = this.getUserById(params.adminUserId);
    if (!admin || admin.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const product = this.getProductById(params.productId);
    if (!product) throw new Error('Product not found');

    const newStatus: ProductStatus = params.action === 'hide' ? 'hidden' : (params.action === 'reject' ? 'rejected' : 'active');
    const now = new Date().toISOString();

    const tx = this.db.transaction(() => {
      this.db.prepare(`
        UPDATE products
        SET status = ?, moderation_note = ?, updated_at = ?
        WHERE id = ?
      `).run(newStatus, `${params.action.toUpperCase()}: ${params.reason}`, now, params.productId);

      this.db.prepare(`
        INSERT INTO moderation_actions (id, product_id, admin_user_id, action, reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('mod_' + crypto.randomUUID(), params.productId, params.adminUserId, params.action, params.reason, now);

      // Dismiss pending reports for this listing
      this.db.prepare(`
        UPDATE listing_reports SET status = 'reviewed' WHERE product_id = ? AND status = 'pending'
      `).run(params.productId);
    });

    tx();
    return this.getProductById(params.productId)!;
  }

  getModerationAuditTrail() {
    const rows = this.db.prepare(`
      SELECT ma.*, p.name as product_name, u.full_name as admin_name
      FROM moderation_actions ma
      JOIN products p ON ma.product_id = p.id
      JOIN users u ON ma.admin_user_id = u.id
      ORDER BY ma.created_at DESC
      LIMIT 50
    `).all() as any[];

    return rows.map(r => ({
      id: r.id,
      productId: r.product_id,
      productName: r.product_name,
      adminUserId: r.admin_user_id,
      adminName: r.admin_name,
      action: r.action,
      reason: r.reason,
      createdAt: r.created_at,
    }));
  }

  // Find possible duplicate listings for admin human review
  getPotentialDuplicates() {
    const rows = this.db.prepare(`
      SELECT p1.id as id1, p1.name as name1, p1.farmer_id as farmer1, u1.full_name as farmer_name1,
             p2.id as id2, p2.name as name2, p2.farmer_id as farmer2, u2.full_name as farmer_name2,
             p1.pickup_locality as locality1, p1.category as category1
      FROM products p1
      JOIN products p2 ON p1.id < p2.id
                      AND lower(p1.name) = lower(p2.name)
                      AND p1.farmer_id = p2.farmer_id
                      AND p1.status = 'active'
                      AND p2.status = 'active'
      JOIN users u1 ON p1.farmer_id = u1.id
      JOIN users u2 ON p2.farmer_id = u2.id
    `).all() as any[];

    return rows;
  }
}

export const marketplaceService = new MarketplaceService();
