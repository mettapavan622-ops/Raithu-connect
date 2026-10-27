import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './client/context/AuthContext';
import { CartProvider, useCart } from './client/context/CartContext';
import { Navbar } from './client/components/Navbar';
import { MarketplaceView } from './client/views/MarketplaceView';
import { SurplusCornerView } from './client/views/SurplusCornerView';
import { LoginPage } from './client/views/auth/LoginPage';
import { RegisterPage } from './client/views/auth/RegisterPage';
import { AdminLoginPage } from './client/views/auth/AdminLoginPage';
import { FarmerDashboardPage } from './client/views/farmer/FarmerDashboardPage';
import { BuyerDashboardPage } from './client/views/buyer/BuyerDashboardPage';
import { AdminDashboardPage } from './client/views/admin/AdminDashboardPage';
import { ProductDetailsModal } from './client/components/ProductDetailsModal';
import { FarmerProfileModal } from './client/components/FarmerProfileModal';
import { CartModal } from './client/components/CartModal';
import { ProductFormModal } from './client/components/ProductFormModal';
import { StockAdjustModal } from './client/components/StockAdjustModal';
import { AiListingAssistantModal } from './client/components/AiListingAssistantModal';
import { ReportListingModal } from './client/components/ReportListingModal';
import { Product, ListingDraftResult } from './shared/types';
import { Sprout } from 'lucide-react';

function MarketplaceApp() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      return p === '/' ? '/marketplace' : p;
    }
    return '/marketplace';
  });

  // Modal States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);
  const [reportingProduct, setReportingProduct] = useState<Product | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<ListingDraftResult | null>(null);

  // Router navigation helper
  const navigate = useCallback((path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo(0, 0);
    }
  }, []);

  // Listen to browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      setCurrentPath(p === '/' ? '/marketplace' : p);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleApplyDraft = (draft: ListingDraftResult) => {
    setCurrentDraft(draft);
    setIsProductFormOpen(true);
  };

  const handleOrderSuccess = () => {
    setIsCartOpen(false);
    if (user?.role === 'buyer') {
      navigate('/buyer/orders');
    }
  };

  // Helper to extract subpath
  const getSubpath = (base: string) => {
    if (!currentPath.startsWith(base)) return 'dashboard';
    const sub = currentPath.slice(base.length).replace(/^\//, '');
    return sub || 'dashboard';
  };

  // Render view depending on URL path and authenticated role
  const renderCurrentView = () => {
    if (authLoading) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-2">
            <Sprout className="w-8 h-8 text-emerald-700 animate-bounce mx-auto" />
            <p className="text-xs text-stone-600 font-medium">{t('common.loading')}</p>
          </div>
        </div>
      );
    }

    // 1. Auth routes
    if (currentPath === '/login') {
      if (user?.role === 'farmer') {
        navigate('/farmer/dashboard');
        return null;
      }
      if (user?.role === 'buyer') {
        navigate('/buyer/dashboard');
        return null;
      }
      if (user?.role === 'admin') {
        navigate('/admin/dashboard');
        return null;
      }
      return <LoginPage onNavigate={navigate} />;
    }

    if (currentPath === '/register') {
      if (user?.role === 'farmer') {
        navigate('/farmer/dashboard');
        return null;
      }
      if (user?.role === 'buyer') {
        navigate('/buyer/dashboard');
        return null;
      }
      return <RegisterPage onNavigate={navigate} />;
    }

    if (currentPath === '/admin/login') {
      if (user?.role === 'admin') {
        navigate('/admin/dashboard');
        return null;
      }
      return <AdminLoginPage onNavigate={navigate} />;
    }

    // 2. Farmer Routes (/farmer/*)
    if (currentPath.startsWith('/farmer')) {
      if (!user) {
        return <LoginPage onNavigate={navigate} initialRole="farmer" />;
      }
      if (user.role !== 'farmer') {
        return (
          <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl border border-stone-200 text-center space-y-3">
            <h2 className="font-serif font-bold text-lg text-stone-900">{t('auth.roleMismatchTitle')}</h2>
            <p className="text-xs text-stone-600">
              You are signed in as a {user.role}, but the Farmer Portal requires a verified grower account.
            </p>
            <button
              onClick={() => navigate(user.role === 'buyer' ? '/buyer/dashboard' : '/admin/dashboard')}
              className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Go to My {user.role === 'buyer' ? 'Buyer' : 'Admin'} Dashboard
            </button>
          </div>
        );
      }
      return (
        <FarmerDashboardPage
          currentSubpath={getSubpath('/farmer')}
          onNavigate={navigate}
          onOpenCreateProduct={() => setIsProductFormOpen(true)}
          onOpenStockAdjust={(p) => setStockAdjustProduct(p)}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        />
      );
    }

    // 3. Buyer Routes (/buyer/*)
    if (currentPath.startsWith('/buyer')) {
      if (!user) {
        return <LoginPage onNavigate={navigate} initialRole="buyer" />;
      }
      if (user.role !== 'buyer') {
        return (
          <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl border border-stone-200 text-center space-y-3">
            <h2 className="font-serif font-bold text-lg text-stone-900">{t('auth.roleMismatchTitle')}</h2>
            <p className="text-xs text-stone-600">
              You are signed in as a {user.role}. This view is dedicated for buyer pickup tracking.
            </p>
            <button
              onClick={() => navigate(user.role === 'farmer' ? '/farmer/dashboard' : '/admin/dashboard')}
              className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Go to My {user.role === 'farmer' ? 'Farmer' : 'Admin'} Dashboard
            </button>
          </div>
        );
      }
      return (
        <BuyerDashboardPage
          currentSubpath={getSubpath('/buyer')}
          onNavigate={navigate}
          onOpenCart={() => setIsCartOpen(true)}
        />
      );
    }

    // 4. Admin Routes (/admin/*)
    if (currentPath.startsWith('/admin')) {
      if (!user || user.role !== 'admin') {
        return <AdminLoginPage onNavigate={navigate} />;
      }
      return (
        <AdminDashboardPage
          currentSubpath={getSubpath('/admin')}
          onNavigate={navigate}
          onSelectProduct={(p) => setSelectedProduct(p)}
        />
      );
    }

    // 5. Surplus Corner (/surplus)
    if (currentPath === '/surplus') {
      return (
        <SurplusCornerView
          onSelectProduct={(p) => setSelectedProduct(p)}
          onViewFarmer={(fId) => setSelectedFarmerId(fId)}
          onReportProduct={(p) => setReportingProduct(p)}
        />
      );
    }

    // 6. Default: Marketplace View (/marketplace or /)
    return (
      <MarketplaceView
        onSelectProduct={(p) => setSelectedProduct(p)}
        onViewFarmer={(fId) => setSelectedFarmerId(fId)}
        onReportProduct={(p) => setReportingProduct(p)}
        onOpenCreateProduct={() => {
          if (!user) {
            navigate('/login');
          } else if (user.role === 'farmer') {
            setIsProductFormOpen(true);
          } else {
            navigate('/buyer/dashboard');
          }
        }}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 text-stone-900 font-sans selection:bg-emerald-200 selection:text-emerald-950">
      {/* Navigation */}
      <Navbar
        currentPath={currentPath}
        onNavigate={navigate}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {renderCurrentView()}
      </main>

      {/* Modals Container */}
      <ProductDetailsModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onViewFarmer={(fId) => setSelectedFarmerId(fId)}
        onReport={(p) => setReportingProduct(p)}
      />

      <FarmerProfileModal
        farmerId={selectedFarmerId}
        isOpen={!!selectedFarmerId}
        onClose={() => setSelectedFarmerId(null)}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderSuccess={handleOrderSuccess}
        onOpenAuth={() => navigate('/login')}
      />

      <ProductFormModal
        isOpen={isProductFormOpen}
        onClose={() => {
          setIsProductFormOpen(false);
          setCurrentDraft(null);
        }}
        onSuccess={() => {
          setCurrentDraft(null);
          setIsProductFormOpen(false);
        }}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        initialDraft={currentDraft}
      />

      <StockAdjustModal
        product={stockAdjustProduct}
        isOpen={!!stockAdjustProduct}
        onClose={() => setStockAdjustProduct(null)}
        onSuccess={() => setStockAdjustProduct(null)}
      />

      <AiListingAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        onApplyDraft={handleApplyDraft}
      />

      <ReportListingModal
        product={reportingProduct}
        isOpen={!!reportingProduct}
        onClose={() => setReportingProduct(null)}
      />

      {/* Footer */}
      <footer className="bg-emerald-950 text-stone-300 border-t border-emerald-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-emerald-400" />
                <span className="font-serif font-bold text-base text-stone-50">
                  {t('common.appName')} — {t('common.tagline')}
                </span>
              </div>
              <p className="text-stone-400 max-w-md leading-relaxed">
                Empowering Telangana farmers to publish farm-gate harvests and sell directly to consumers, chefs, and retailers across Hyderabad rural fringe mandals.
              </p>
              <div className="text-[11px] text-amber-300/80 bg-amber-950/60 p-2.5 rounded-lg border border-amber-800/50 max-w-md">
                🌾 <strong>Hackathon Scope Notice:</strong> Pickup-first prototype for Hyderabad. Cash on pickup &amp; simulated payments only. Delivery is not arranged by this app.
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="font-serif font-bold text-stone-100 block mb-1">Active Farm Mandals</span>
              <ul className="space-y-1 text-stone-400">
                <li>• Shamshabad (Ranga Reddy)</li>
                <li>• Ibrahimpatnam (Ranga Reddy)</li>
                <li>• Chevella (Ranga Reddy)</li>
                <li>• Shankarpally (Sangareddy)</li>
                <li>• Medchal (Medchal-Malkajgiri)</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <span className="font-serif font-bold text-stone-100 block mb-1">Architecture &amp; Proof</span>
              <ul className="space-y-1 text-stone-400">
                <li>• SQLite with WAL &amp; Foreign Keys</li>
                <li>• Strict Role-Scoped Authoritative State</li>
                <li>• Multilingual: English, తెలుగు, हिन्दी</li>
                <li>• Harvest Passport™ Traceability</li>
                <li>• 14 Vitest Invariant Tests Passing</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-emerald-900 text-[11px] text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>© 2026 RaithuConnect • HACK-P309: Farmer Marketplace Prototype</span>
            <span>All profiles and prices are sample demo data. Dates in Asia/Kolkata (IST).</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MarketplaceApp />
      </CartProvider>
    </AuthProvider>
  );
}
