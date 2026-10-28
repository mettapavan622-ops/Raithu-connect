import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Product, Order, FarmerSalesSummary } from '../../../shared/types';
import { apiFetch } from '../../api';
import { formatInrPaise, formatUnitQuantity, formatDateTimeKolkata, formatDateKolkata } from '../../utils';
import {
  Tractor,
  Package,
  Layers,
  ShoppingBag,
  TrendingUp,
  User,
  Plus,
  Sliders,
  Sparkles,
  RefreshCw,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Phone
} from 'lucide-react';
import { HarvestYieldChart } from '../../components/HarvestYieldChart';

interface FarmerDashboardPageProps {
  currentSubpath?: string;
  onNavigate: (path: string) => void;
  onOpenCreateProduct: () => void;
  onOpenStockAdjust: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onOpenAiAssistant?: () => void;
}

export const FarmerDashboardPage: React.FC<FarmerDashboardPageProps> = ({
  currentSubpath = 'overview',
  onNavigate,
  onOpenCreateProduct,
  onOpenStockAdjust,
  onSelectProduct,
  onOpenAiAssistant,
}) => {
  const { t } = useTranslation();
  const { user, farmerProfile, updateFarmerProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'inventory' | 'orders' | 'sales' | 'profile'>(
    (currentSubpath as any) || 'overview'
  );

  useEffect(() => {
    if (['overview', 'products', 'inventory', 'orders', 'sales', 'profile'].includes(currentSubpath)) {
      setActiveTab(currentSubpath as any);
    }
  }, [currentSubpath]);

  const [metrics, setMetrics] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [salesSummary, setSalesSummary] = useState<FarmerSalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Cancellation modal
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');

  // Profile Form state
  const [farmName, setFarmName] = useState(farmerProfile?.farmName || '');
  const [villageMandal, setVillageMandal] = useState(farmerProfile?.villageMandal || '');
  const [district, setDistrict] = useState(farmerProfile?.district || 'Ranga Reddy');
  const [bio, setBio] = useState(farmerProfile?.bio || '');
  const [upiId, setUpiId] = useState(farmerProfile?.upiId || '');
  const [address, setAddress] = useState(farmerProfile?.address || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [dashRes, prodsRes, ordsRes, salesRes] = await Promise.all([
        apiFetch('/api/farmer/dashboard'),
        apiFetch('/api/farmer/products'),
        apiFetch('/api/farmer/orders'),
        apiFetch('/api/farmer/sales'),
      ]);

      setMetrics(dashRes);
      setProducts(prodsRes.products || []);
      setOrders(ordsRes.orders || []);
      setSalesSummary(salesRes.sales || null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to load farmer data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  useEffect(() => {
    if (farmerProfile) {
      setFarmName(farmerProfile.farmName || '');
      setVillageMandal(farmerProfile.villageMandal || '');
      setDistrict(farmerProfile.district || 'Ranga Reddy');
      setBio(farmerProfile.bio || '');
      setUpiId(farmerProfile.upiId || '');
      setAddress(farmerProfile.address || '');
    }
  }, [farmerProfile]);

  const handleOrderStatusAction = async (
    orderId: string,
    action: 'accept' | 'mark_ready' | 'complete' | 'cancel',
    reason?: string
  ) => {
    setActionError(null);
    try {
      await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        body: JSON.stringify({ action, cancelReason: reason }),
      });
      setCancellingOrderId(null);
      setCancelReasonInput('');
      setSuccessNotice(`Order status successfully updated to ${action.replace('_', ' ')}`);
      setTimeout(() => setSuccessNotice(null), 4000);
      await loadData();
    } catch (err: any) {
      setActionError(err.message || `Failed to ${action} order`);
    }
  };

  const handleSaveFarmProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setActionError(null);
    try {
      await updateFarmerProfile({
        farmName: farmName.trim(),
        villageMandal: villageMandal.trim(),
        district: district.trim(),
        bio: bio.trim(),
        upiId: upiId.trim(),
        address: address.trim(),
      });
      setSuccessNotice('Farm profile details updated successfully');
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const navItems = [
    { id: 'overview', label: t('farmer.overview'), icon: Tractor, path: '/farmer/dashboard' },
    { id: 'products', label: t('farmer.products'), icon: Package, path: '/farmer/products', badge: products.length },
    { id: 'inventory', label: t('farmer.inventory'), icon: Layers, path: '/farmer/inventory' },
    { id: 'orders', label: t('farmer.orders'), icon: ShoppingBag, path: '/farmer/orders', badge: orders.filter(o => o.status === 'requested').length },
    { id: 'sales', label: t('farmer.sales'), icon: TrendingUp, path: '/farmer/sales' },
    { id: 'profile', label: t('farmer.profile'), icon: User, path: '/farmer/profile' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Role Banner */}
      <div className="bg-emerald-950 text-stone-100 rounded-2xl p-6 border border-emerald-900 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider">
            <Tractor className="w-4 h-4" />
            <span>{t('farmer.badge')} — {user?.fullName}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            {farmerProfile?.farmName || t('farmer.dashboardTitle')}
          </h1>
          <p className="text-xs text-stone-300 flex items-center gap-2 mt-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{farmerProfile?.villageMandal || 'Hyderabad Rural'}, {farmerProfile?.district || 'Telangana'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenCreateProduct}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('farmer.addNewProduce')}</span>
          </button>
          {onOpenAiAssistant && (
            <button
              type="button"
              onClick={onOpenAiAssistant}
              className="px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-700"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{t('farmer.aiAssistant')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={loadData}
            className="p-2 bg-emerald-900 hover:bg-emerald-800 text-stone-200 rounded-xl transition-colors border border-emerald-800"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-900 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Navigation Tabs (Desktop & Mobile Scrollable) */}
      <div className="border-b border-stone-200 bg-white rounded-xl p-1.5 shadow-2xs overflow-x-auto">
        <nav className="flex space-x-1 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id as any);
                  onNavigate(item.path);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-amber-400 text-stone-950' : 'bg-stone-200 text-stone-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs font-medium text-stone-600 block mb-1">
                {t('farmer.totalListings')}
              </span>
              <div className="text-2xl font-bold font-serif text-stone-900">
                {products.filter(p => p.status === 'active').length}
              </div>
              <span className="text-[11px] text-emerald-800 mt-1 block">Active on marketplace</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs font-medium text-stone-600 block mb-1">
                {t('farmer.pendingPickups')}
              </span>
              <div className="text-2xl font-bold font-serif text-amber-700">
                {orders.filter(o => ['requested', 'accepted', 'ready'].includes(o.status)).length}
              </div>
              <span className="text-[11px] text-stone-600 mt-1 block">Awaiting pickup</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs font-medium text-stone-600 block mb-1">
                {t('farmer.completedOrders')}
              </span>
              <div className="text-2xl font-bold font-serif text-emerald-800">
                {salesSummary?.completedOrdersCount || orders.filter(o => o.status === 'completed').length}
              </div>
              <span className="text-[11px] text-stone-600 mt-1 block">Completed trade</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs font-medium text-stone-600 block mb-1">
                {t('farmer.totalRevenue')}
              </span>
              <div className="text-2xl font-bold font-serif text-stone-900">
                {formatInrPaise(salesSummary?.totalEarningsPaise || 0)}
              </div>
              <span className="text-[11px] text-emerald-800 mt-1 block">Strictly from completed orders</span>
            </div>
          </div>

          {/* Historical Harvest Yield Trends & Future Planting Advisory (Recharts) */}
          <HarvestYieldChart
            products={products}
            onOpenCreateProduct={onOpenCreateProduct}
          />

          {/* Incoming Orders Preview */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif font-bold text-lg text-stone-900">
                {t('farmer.recentOrdersTitle')}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('orders');
                  onNavigate('/farmer/orders');
                }}
                className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold inline-flex items-center gap-1"
              >
                <span>View All Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {orders.length === 0 ? (
              <p className="text-xs text-stone-600 py-6 text-center">{t('farmer.noOrdersYet')}</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900 text-sm">#{ord.orderCode}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          ord.status === 'ready'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : ord.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            : ord.status === 'accepted'
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : ord.status === 'cancelled'
                            ? 'bg-stone-200 text-stone-700'
                            : 'bg-amber-50 text-amber-800 border border-amber-300'
                        }`}>
                          {ord.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-stone-600 mt-1">
                        Buyer: <span className="font-semibold text-stone-800">{ord.buyerName || 'Local Buyer'}</span> ({ord.buyerPhone})
                      </div>
                      <div className="text-stone-600 text-[11px] mt-0.5">
                        {ord.items.map(it => `${it.productNameSnapshot} (${formatUnitQuantity(it.quantity, it.unitSnapshot)})`).join(', ')}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                      <div className="font-bold text-sm text-stone-900">
                        {formatInrPaise(ord.totalAmountPaise)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {ord.status === 'requested' && (
                          <button
                            type="button"
                            onClick={() => handleOrderStatusAction(ord.id, 'accept')}
                            className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md text-xs font-semibold"
                          >
                            Accept
                          </button>
                        )}
                        {ord.status === 'accepted' && (
                          <button
                            type="button"
                            onClick={() => handleOrderStatusAction(ord.id, 'mark_ready')}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold"
                          >
                            Mark Ready
                          </button>
                        )}
                        {ord.status === 'ready' && (
                          <button
                            type="button"
                            onClick={() => handleOrderStatusAction(ord.id, 'complete')}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold"
                          >
                            Confirm Pickup
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-lg text-stone-900">
              {t('farmer.products')} ({products.length})
            </h2>
            <button
              type="button"
              onClick={onOpenCreateProduct}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('farmer.addNewProduce')}</span>
            </button>
          </div>

          {products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
              <Package className="w-10 h-10 text-stone-600 mx-auto mb-3" />
              <p className="text-sm text-stone-600 font-medium mb-4">{t('farmer.noProductsYet')}</p>
              <button
                type="button"
                onClick={onOpenCreateProduct}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold"
              >
                {t('farmer.addNewProduce')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-xs transition-shadow flex flex-col"
                >
                  <div className="relative h-44 bg-stone-100">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'active'
                          ? 'bg-emerald-800 text-white'
                          : 'bg-red-800 text-white'
                      }`}>
                        {p.status.toUpperCase()}
                      </span>
                    </div>
                    {p.isSurplus && (
                      <div className="absolute top-2.5 right-2.5 bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                        {p.surplusDiscountPct}% OFF
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-serif font-bold text-base text-stone-900">{p.name}</h3>
                      <div className="text-emerald-900 font-extrabold text-base mt-0.5">
                        ₹{(p.pricePerUnitPaise / 100).toFixed(0)} / {p.unit}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-stone-100 text-[11px] text-stone-600">
                        <div>
                          <span className="text-stone-600 block">Available:</span>
                          <span className="font-semibold text-stone-900">
                            {formatUnitQuantity(p.availableQuantity, p.unit)}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-600 block">Reserved:</span>
                          <span className="font-semibold text-amber-800">
                            {formatUnitQuantity(p.reservedQuantity, p.unit)}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-600 block">Harvest Date:</span>
                          <span className="font-semibold text-stone-800">{formatDateKolkata(p.harvestDate)}</span>
                        </div>
                        <div>
                          <span className="text-stone-600 block">Pickup Hub:</span>
                          <span className="font-semibold text-stone-800 truncate block">{p.pickupLocality}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenStockAdjust(p)}
                        className="flex-1 py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Adjust Stock</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectProduct(p)}
                        className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg text-xs font-semibold transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
          <div className="p-5 border-b border-stone-200 flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-lg text-stone-900">
                {t('farmer.inventory')}
              </h2>
              <p className="text-xs text-stone-600">
                On-hand stock is strictly conserved; inventory cannot be reduced below active customer reservations.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-xs">
              <thead className="bg-stone-50 font-semibold text-stone-700">
                <tr>
                  <th className="py-3 px-4 text-left">Produce</th>
                  <th className="py-3 px-4 text-left">Unit Price</th>
                  <th className="py-3 px-4 text-left">On Hand</th>
                  <th className="py-3 px-4 text-left">Reserved</th>
                  <th className="py-3 px-4 text-left">Available to Buyers</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/70">
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900">{p.name}</div>
                      <div className="text-[11px] text-stone-600">{p.category}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-800">
                      ₹{(p.pricePerUnitPaise / 100).toFixed(0)} / {p.unit}
                    </td>
                    <td className="py-3 px-4 font-medium text-stone-800">
                      {formatUnitQuantity(p.onHandQuantity, p.unit)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-amber-800">
                      {formatUnitQuantity(p.reservedQuantity, p.unit)}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-800">
                      {formatUnitQuantity(p.availableQuantity, p.unit)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        p.availableQuantity > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {p.availableQuantity > 0 ? 'In Stock' : 'Depleted'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenStockAdjust(p)}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md font-semibold text-xs transition-colors"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-lg text-stone-900">
              {t('farmer.orders')} ({orders.length})
            </h2>
            <div className="text-xs text-stone-600">
              Step-by-step: Accept &rarr; Mark Ready &rarr; Confirm Pickup
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-xs text-stone-600">
              {t('farmer.noOrdersYet')}
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base text-stone-900">#{ord.orderCode}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          ord.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-900'
                            : ord.status === 'ready'
                            ? 'bg-amber-100 text-amber-900'
                            : ord.status === 'accepted'
                            ? 'bg-blue-100 text-blue-900'
                            : ord.status === 'cancelled'
                            ? 'bg-stone-200 text-stone-700'
                            : 'bg-amber-50 text-amber-800 border border-amber-300'
                        }`}>
                          {ord.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-stone-600 text-[11px] mt-0.5">
                        Placed on {formatDateTimeKolkata(ord.createdAt)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-bold text-emerald-900">
                        {formatInrPaise(ord.totalAmountPaise)}
                      </div>
                      <div className="text-[11px] text-stone-600 capitalize">
                        {ord.paymentMode.replace('_', ' ')} &bull; {ord.paymentStatus}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-stone-600 block text-[11px] mb-1">Customer Details:</span>
                      <div className="font-semibold text-stone-900">{ord.buyerName || 'Buyer'}</div>
                      <div className="text-stone-600 text-[11px] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-stone-600" />
                        <span>{ord.buyerPhone || 'N/A'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-stone-600 block text-[11px] mb-1">Ordered Items:</span>
                      <ul className="space-y-1">
                        {ord.items.map((it) => (
                          <li key={it.id} className="flex justify-between text-stone-800">
                            <span>
                              {it.productNameSnapshot} &times; {formatUnitQuantity(it.quantity, it.unitSnapshot)}
                            </span>
                            <span className="font-semibold">{formatInrPaise(it.subtotalPaise)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-stone-600">
                      {ord.status === 'requested' && 'Please confirm availability and accept this order request.'}
                      {ord.status === 'accepted' && 'Prepare harvest batch. Mark ready when available for pickup.'}
                      {ord.status === 'ready' && 'Waiting for buyer to arrive at pickup point.'}
                      {ord.status === 'completed' && 'Order successfully completed.'}
                      {ord.status === 'cancelled' && `Cancelled: ${ord.cancelReason || 'No reason provided'}`}
                    </div>

                    <div className="flex items-center gap-2">
                      {ord.status === 'requested' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOrderStatusAction(ord.id, 'accept')}
                            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold"
                          >
                            Accept Order
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancellingOrderId(ord.id)}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-semibold"
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {ord.status === 'accepted' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOrderStatusAction(ord.id, 'mark_ready')}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold"
                          >
                            Mark Ready for Pickup
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancellingOrderId(ord.id)}
                            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {ord.status === 'ready' && (
                        <button
                          type="button"
                          onClick={() => handleOrderStatusAction(ord.id, 'complete')}
                          className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs"
                        >
                          Confirm Pickup &amp; Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SALES */}
      {activeTab === 'sales' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs">
            <h2 className="font-serif font-bold text-xl text-stone-900 mb-1">
              {t('farmer.sales')}
            </h2>
            <p className="text-xs text-stone-600 mb-6">
              Authoritative revenue generated strictly from completed pickups by your customers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs text-emerald-800 font-semibold block">Total Completed Revenue</span>
                <div className="text-2xl font-bold font-serif text-emerald-950 mt-1">
                  {formatInrPaise(salesSummary?.totalEarningsPaise || 0)}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-xs text-stone-600 font-semibold block">Completed Pickup Count</span>
                <div className="text-2xl font-bold font-serif text-stone-900 mt-1">
                  {salesSummary?.completedOrdersCount || 0}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-xs text-amber-900 font-semibold block">Pending In-Flight Orders</span>
                <div className="text-2xl font-bold font-serif text-amber-950 mt-1">
                  {salesSummary?.pendingOrdersCount || 0}
                </div>
              </div>
            </div>

            {/* Sales by Category breakdown */}
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3">
              Revenue by Produce Category
            </h3>
            {salesSummary?.salesByCategory && salesSummary.salesByCategory.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {salesSummary.salesByCategory.map((cat) => (
                  <div key={cat.category} className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs">
                    <span className="font-semibold text-stone-900 capitalize block">{cat.category.replace('_', ' ')}</span>
                    <div className="text-sm font-bold text-emerald-800 mt-0.5">{formatInrPaise(cat.revenuePaise)}</div>
                    <span className="text-[11px] text-stone-600">{cat.count} order(s)</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-600">No category breakdown available yet.</p>
            )}
          </div>

          {/* Historical Harvest Yield Trends & Future Planting Advisory */}
          <HarvestYieldChart
            products={products}
            onOpenCreateProduct={onOpenCreateProduct}
          />
        </div>
      )}

      {/* TAB 6: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs max-w-2xl">
          <h2 className="font-serif font-bold text-xl text-stone-900 mb-1">
            {t('farmer.profile')}
          </h2>
          <p className="text-xs text-stone-600 mb-5">
            Manage your public farm identity, locality, and pickup depot coordinates for buyers.
          </p>

          <form onSubmit={handleSaveFarmProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                {t('auth.farmName')} *
              </label>
              <input
                type="text"
                required
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  {t('auth.farmLocality')} *
                </label>
                <input
                  type="text"
                  required
                  value={villageMandal}
                  onChange={(e) => setVillageMandal(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  District
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                {t('auth.upiId')}
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Full Physical Address / Farm Gate Instructions
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Survey No. 42, Near Shamshabad Raitu Bazaar"
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                {t('auth.farmBio')}
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="py-2.5 px-5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              {savingProfile ? t('common.loading') : t('common.save')}
            </button>
          </form>
        </div>
      )}

      {/* Cancellation Reason Prompt Modal */}
      {cancellingOrderId && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-serif font-bold text-lg text-stone-900">
              Cancel Order Request
            </h3>
            <p className="text-xs text-stone-600">
              State the reason for cancellation. Customer reserved stock will be automatically released back to your available inventory.
            </p>
            <input
              type="text"
              required
              value={cancelReasonInput}
              onChange={(e) => setCancelReasonInput(e.target.value)}
              placeholder="e.g. Morning harvest completed; crop quality below grading standard"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-red-600"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingOrderId(null)}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleOrderStatusAction(cancellingOrderId, 'cancel', cancelReasonInput)}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
