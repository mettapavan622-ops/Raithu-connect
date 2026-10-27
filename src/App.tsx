import React, { useState } from 'react';
import { AuthProvider, useAuth } from './client/context/AuthContext';
import { CartProvider, useCart } from './client/context/CartContext';
import { Navbar } from './client/components/Navbar';
import { MarketplaceView } from './client/views/MarketplaceView';
import { SurplusCornerView } from './client/views/SurplusCornerView';
import { FarmerDashboardView } from './client/views/FarmerDashboardView';
import { BuyerOrdersView } from './client/views/BuyerOrdersView';
import { AdminModerationView } from './client/views/AdminModerationView';
import { ProductDetailsModal } from './client/components/ProductDetailsModal';
import { FarmerProfileModal } from './client/components/FarmerProfileModal';
import { CartModal } from './client/components/CartModal';
import { AuthModal } from './client/components/AuthModal';
import { ProductFormModal } from './client/components/ProductFormModal';
import { StockAdjustModal } from './client/components/StockAdjustModal';
import { AiListingAssistantModal } from './client/components/AiListingAssistantModal';
import { ReportListingModal } from './client/components/ReportListingModal';
import { Product, ListingDraftResult } from './shared/types';
import { Sprout, Heart, Shield, HelpCircle, MapPin, ExternalLink } from 'lucide-react';

function MarketplaceApp() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'marketplace' | 'surplus' | 'farmer_dashboard' | 'buyer_orders' | 'admin_moderation'>('marketplace');

  // Modal States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);
  const [reportingProduct, setReportingProduct] = useState<Product | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  // AI Assistant draft passed to product form
  const [currentDraft, setCurrentDraft] = useState<ListingDraftResult | null>(null);

  const handleApplyDraft = (draft: ListingDraftResult) => {
    setCurrentDraft(draft);
    setIsProductFormOpen(true);
  };

  const handleOrderSuccess = (orders: any[]) => {
    if (user?.role === 'buyer') {
      setCurrentView('buyer_orders');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 text-stone-900 font-sans selection:bg-emerald-200 selection:text-emerald-950">
      {/* Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view: any) => setCurrentView(view)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {currentView === 'marketplace' && (
          <MarketplaceView
            onSelectProduct={(p) => setSelectedProduct(p)}
            onViewFarmer={(fId) => setSelectedFarmerId(fId)}
            onReportProduct={(p) => setReportingProduct(p)}
            onOpenCreateProduct={() => {
              if (!user || user.role !== 'farmer') {
                setIsAuthOpen(true);
              } else {
                setIsProductFormOpen(true);
              }
            }}
          />
        )}

        {currentView === 'surplus' && (
          <SurplusCornerView
            onSelectProduct={(p) => setSelectedProduct(p)}
            onViewFarmer={(fId) => setSelectedFarmerId(fId)}
            onReportProduct={(p) => setReportingProduct(p)}
          />
        )}

        {currentView === 'farmer_dashboard' && (
          <FarmerDashboardView
            onOpenCreateProduct={() => setIsProductFormOpen(true)}
            onOpenStockAdjust={(p) => setStockAdjustProduct(p)}
            onSelectProduct={(p) => setSelectedProduct(p)}
          />
        )}

        {currentView === 'buyer_orders' && <BuyerOrdersView />}

        {currentView === 'admin_moderation' && <AdminModerationView />}
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
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <ProductFormModal
        isOpen={isProductFormOpen}
        onClose={() => {
          setIsProductFormOpen(false);
          setCurrentDraft(null);
        }}
        onSuccess={() => {
          setCurrentDraft(null);
          // If on farmer dashboard, it refreshes automatically
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
            {/* Col 1 */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-emerald-400" />
                <span className="font-serif font-bold text-base text-stone-50">
                  RaithuConnect — Local Harvest, Direct Trade
                </span>
              </div>
              <p className="text-stone-400 max-w-md leading-relaxed">
                Empowering Telangana farmers to publish farm-gate harvests and sell directly to consumers, chefs, and retailers across Hyderabad rural fringe mandals.
              </p>
              <div className="text-[11px] text-amber-300/80 bg-amber-950/60 p-2.5 rounded-lg border border-amber-800/50 max-w-md">
                🌾 <strong>Hackathon Scope Notice:</strong> Pickup-first prototype for Hyderabad. Cash on pickup &amp; simulated payments only. Delivery is not arranged by this app.
              </div>
            </div>

            {/* Col 2 */}
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

            {/* Col 3 */}
            <div className="space-y-1.5">
              <span className="font-serif font-bold text-stone-100 block mb-1">Architecture &amp; Proof</span>
              <ul className="space-y-1 text-stone-400">
                <li>• SQLite with WAL &amp; Foreign Keys</li>
                <li>• Atomic Reservations &amp; Invariants</li>
                <li>• Gemini 3.8 Flash Listing Assistant</li>
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
