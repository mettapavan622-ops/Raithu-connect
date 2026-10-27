import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Order } from '../../../shared/types';
import { apiFetch } from '../../api';
import { formatInrPaise, formatUnitQuantity, formatDateTimeKolkata } from '../../utils';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  AlertCircle,
  Truck,
  Phone,
  RefreshCw,
  User,
  ArrowRight,
  ExternalLink,
  Store,
  QrCode,
  Tag
} from 'lucide-react';

interface BuyerDashboardPageProps {
  currentSubpath?: string;
  onNavigate: (path: string) => void;
  onOpenCart?: () => void;
}

export const BuyerDashboardPage: React.FC<BuyerDashboardPageProps> = ({
  currentSubpath = 'overview',
  onNavigate,
  onOpenCart,
}) => {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  const { totalItemsCount } = useCart();

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'tracking' | 'profile'>(
    (currentSubpath as any) || 'overview'
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation state
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Profile Form state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [locality, setLocality] = useState(user?.locality || '');
  const [buyerType, setBuyerType] = useState(user?.buyerType || 'household');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ orders: Order[] }>('/api/buyer/orders');
      setOrders(res.orders || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user?.id]);

  useEffect(() => {
    if (['overview', 'orders', 'tracking', 'profile'].includes(currentSubpath)) {
      setActiveTab(currentSubpath as any);
    }
  }, [currentSubpath]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setLocality(user.locality || '');
      setBuyerType(user.buyerType || 'household');
      setBusinessName(user.businessName || '');
    }
  }, [user]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        body: JSON.stringify({ action: 'cancel', cancelReason: cancelReason || 'Buyer changed plans' }),
      });
      setCancellingOrderId(null);
      setCancelReason('');
      fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Could not cancel order');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileNotice(null);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        locality: locality.trim(),
        buyerType: buyerType as any,
        businessName: businessName.trim(),
      });
      setProfileNotice('Profile updated successfully');
      setTimeout(() => setProfileNotice(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const activeOrders = orders.filter(o => ['requested', 'accepted', 'ready'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'completed');
  const activeOrderToTrack = selectedOrderId ? orders.find(o => o.id === selectedOrderId) : activeOrders[0] || orders[0];

  const navItems = [
    { id: 'overview', label: t('buyer.overview'), path: '/buyer/dashboard', icon: ShoppingBag },
    { id: 'orders', label: t('buyer.orders'), path: '/buyer/orders', icon: Clock, badge: activeOrders.length },
    { id: 'tracking', label: t('buyer.orderTracking'), path: '/buyer/orders/tracking', icon: Truck },
    { id: 'profile', label: t('buyer.profile'), path: '/buyer/profile', icon: User },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Banner */}
      <div className="bg-emerald-950 text-stone-100 rounded-2xl p-6 border border-emerald-900 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider">
            <ShoppingBag className="w-4 h-4" />
            <span>{t('buyer.badge')} — {user?.fullName}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            {t('buyer.dashboardTitle')}
          </h1>
          <p className="text-xs text-stone-300 flex items-center gap-2 mt-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pickup Area: {user?.locality || 'Hyderabad Central / Suburbs'}</span>
          </p>
        </div>

        {/* Quick Persistent Marketplace and Cart actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('/marketplace')}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Store className="w-4 h-4" />
            <span>{t('buyer.browseMarketplace')}</span>
          </button>
          {onOpenCart && (
            <button
              type="button"
              onClick={onOpenCart}
              className="px-3.5 py-2 bg-emerald-850 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 border border-emerald-700/80 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-300" />
              <span>{t('nav.cart')} ({totalItemsCount})</span>
            </button>
          )}
          <button
            type="button"
            onClick={fetchOrders}
            className="p-2 bg-emerald-900 hover:bg-emerald-800 text-stone-200 rounded-xl transition-colors border border-emerald-800"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
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

      {/* Delivery Reminder Callout */}
      <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2.5 shadow-2xs">
        <Truck className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Demo Prototype — Cash on pickup only. Delivery is not arranged by this app.</span>
          {t('buyer.pickupInstructions')}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs font-medium text-stone-600 block mb-1">
                {t('buyer.totalOrders')}
              </span>
              <div className="text-2xl font-bold font-serif text-stone-900">
                {orders.length}
              </div>
              <span className="text-[11px] text-stone-600 mt-1 block">Lifetime pickup requests</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs font-medium text-stone-600 block mb-1">
                {t('buyer.activeOrders')}
              </span>
              <div className="text-2xl font-bold font-serif text-amber-700">
                {activeOrders.length}
              </div>
              <span className="text-[11px] text-amber-800 mt-1 block">In preparation or ready</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs font-medium text-stone-600 block mb-1">
                {t('buyer.completedOrders')}
              </span>
              <div className="text-2xl font-bold font-serif text-emerald-800">
                {completedOrders.length}
              </div>
              <span className="text-[11px] text-emerald-800 mt-1 block">Fresh harvest received</span>
            </div>
          </div>

          {/* Active Pickups Spotlight */}
          {activeOrders.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-700" />
                  <span>Active Pickup In Progress</span>
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('tracking');
                    onNavigate('/buyer/orders/tracking');
                  }}
                  className="text-xs text-emerald-800 hover:text-emerald-950 font-bold inline-flex items-center gap-1"
                >
                  <span>{t('buyer.trackPickups')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-mono font-bold text-sm text-stone-900">
                    Order Code: <span className="bg-stone-900 text-amber-300 px-2 py-0.5 rounded tracking-widest">{activeOrders[0].orderCode}</span>
                  </div>
                  <div className="text-stone-700 mt-1">
                    Farmer: <span className="font-semibold">{activeOrders[0].farmerName || 'Grower'}</span> ({activeOrders[0].farmName})
                  </div>
                  <div className="text-stone-600 text-[11px] mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-700" />
                    <span>Pickup Location: {activeOrders[0].pickupLocality || 'Farmer Farm Depot'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    activeOrders[0].status === 'ready'
                      ? 'bg-amber-600 text-white animate-pulse'
                      : 'bg-emerald-800 text-white'
                  }`}>
                    {activeOrders[0].status === 'ready' ? 'READY FOR PICKUP' : activeOrders[0].status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY ORDERS LIST */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-lg text-stone-900">
              {t('buyer.orders')} ({orders.length})
            </h2>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-xs text-stone-600">
              {t('buyer.noOrders')}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => onNavigate('/marketplace')}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs"
                >
                  {t('buyer.browseMarketplace')}
                </button>
              </div>
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
                        <span className="font-mono font-bold text-sm text-stone-900">#{ord.orderCode}</span>
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
                        {ord.paymentMode.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-stone-600 block text-[11px] mb-1">Farmer Contact:</span>
                      <div className="font-semibold text-stone-900">{ord.farmerName || 'Farmer'}</div>
                      <div className="text-stone-600 text-[11px] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-stone-600" />
                        <span>{ord.pickupLocality || 'Pickup Hub'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-stone-600 block text-[11px] mb-1">Items:</span>
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

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrderId(ord.id);
                        setActiveTab('tracking');
                        onNavigate('/buyer/orders/tracking');
                      }}
                      className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold inline-flex items-center gap-1"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Track Status Details</span>
                    </button>

                    {['requested', 'accepted'].includes(ord.status) && (
                      <button
                        type="button"
                        onClick={() => setCancellingOrderId(ord.id)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TRACKING DETAIL */}
      {activeTab === 'tracking' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs max-w-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200 pb-4">
            <div>
              <h2 className="font-serif font-bold text-xl text-stone-900">
                {t('buyer.orderTracking')}
              </h2>
              <p className="text-xs text-stone-600">
                Present your Order Code upon arrival at the farm pickup location.
              </p>
            </div>
            {activeOrderToTrack && (
              <div className="bg-stone-900 text-amber-300 font-mono font-bold text-lg px-3 py-1.5 rounded-xl tracking-widest">
                #{activeOrderToTrack.orderCode}
              </div>
            )}
          </div>

          {activeOrderToTrack ? (
            <div className="space-y-5">
              {/* Pickup location alert */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-emerald-950">Pickup Location</div>
                  <div className="text-emerald-900 mt-0.5">
                    {activeOrderToTrack.pickupLocality || 'Designated Farm Gate Depot'}
                  </div>
                  <div className="text-stone-600 mt-1">
                    Farmer Contact: {activeOrderToTrack.farmerName} ({activeOrderToTrack.farmerPhone || '9849xxxxxx'})
                  </div>
                </div>
              </div>

              {/* Status Stepper */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Status Progression
                </h3>
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  {[
                    { key: 'requested', label: t('orders.statusRequested'), step: 1 },
                    { key: 'accepted', label: t('orders.statusAccepted'), step: 2 },
                    { key: 'ready', label: t('orders.statusReady'), step: 3 },
                    { key: 'completed', label: t('orders.statusCompleted'), step: 4 },
                  ].map((s) => {
                    const statusOrder = ['requested', 'accepted', 'ready', 'completed'];
                    const currentIdx = statusOrder.indexOf(activeOrderToTrack.status);
                    const stepIdx = statusOrder.indexOf(s.key);
                    const isDone = currentIdx >= stepIdx && activeOrderToTrack.status !== 'cancelled';
                    const isCurrent = activeOrderToTrack.status === s.key;

                    return (
                      <div key={s.key} className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isDone
                              ? 'bg-emerald-700 text-white'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {isDone ? '✓' : s.step}
                        </div>
                        <div className={`text-xs ${isCurrent ? 'font-bold text-emerald-950' : isDone ? 'text-stone-800' : 'text-stone-600'}`}>
                          {s.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-stone-600 py-6 text-center">No orders currently to track.</p>
          )}
        </div>
      )}

      {/* TAB 4: BUYER PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs max-w-xl">
          <h2 className="font-serif font-bold text-xl text-stone-900 mb-1">
            {t('buyer.profile')}
          </h2>
          <p className="text-xs text-stone-600 mb-5">
            Your saved locality preferences and buyer category for easy checkout.
          </p>

          {profileNotice && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{profileNotice}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                {t('auth.fullName')} *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                {t('auth.phone')} *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                {t('auth.locality')}
              </label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Shamshabad, Chevella, Kondapur"
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                {t('auth.buyerType')}
              </label>
              <select
                value={buyerType}
                onChange={(e) => setBuyerType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700 bg-white"
              >
                <option value="household">{t('auth.buyerTypeHousehold')}</option>
                <option value="retailer">{t('auth.buyerTypeRetailer')}</option>
                <option value="restaurant">{t('auth.buyerTypeRestaurant')}</option>
                <option value="wholesaler">{t('auth.buyerTypeWholesaler')}</option>
              </select>
            </div>

            {buyerType !== 'household' && (
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  {t('auth.businessName')}
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={profileSaving}
              className="py-2.5 px-5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              {profileSaving ? t('common.loading') : t('common.save')}
            </button>
          </form>
        </div>
      )}

      {/* Cancellation prompt modal */}
      {cancellingOrderId && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-serif font-bold text-lg text-stone-900">
              Cancel Order
            </h3>
            <p className="text-xs text-stone-600">
              Are you sure you want to cancel this order? Reserved crops will be immediately released back to the farmer's market stock.
            </p>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="State reason for cancellation..."
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
                onClick={() => handleCancelOrder(cancellingOrderId)}
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
