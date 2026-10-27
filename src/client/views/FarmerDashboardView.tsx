import React, { useState, useEffect } from 'react';
import {
  Tractor,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Sliders,
  DollarSign,
  TrendingUp,
  XCircle,
  Check,
  Send,
  Eye,
  Calendar,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { Product, Order } from '../../shared/types';
import { apiFetch } from '../api';
import {
  formatInrPaise,
  formatUnitQuantity,
  formatDateTimeKolkata,
  formatDateKolkata
} from '../utils';

interface FarmerDashboardViewProps {
  onOpenCreateProduct: () => void;
  onOpenStockAdjust: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export const FarmerDashboardView: React.FC<FarmerDashboardViewProps> = ({
  onOpenCreateProduct,
  onOpenStockAdjust,
  onSelectProduct,
}) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'produce' | 'orders'>('overview');
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  // Cancellation prompt modal
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');

  const loadData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [dashRes, prodsRes, ordsRes] = await Promise.all([
        apiFetch('/api/farmer/dashboard'),
        apiFetch('/api/farmer/products'),
        apiFetch('/api/farmer/orders'),
      ]);

      setMetrics(dashRes);
      setProducts(prodsRes.products || []);
      setOrders(ordsRes.orders || []);
    } catch (err: any) {
      setActionError(err.message || 'Failed to load farmer dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOrderStatusAction = async (orderId: string, action: 'accept' | 'mark_ready' | 'complete' | 'cancel', reason?: string) => {
    setActionError(null);
    try {
      await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        body: JSON.stringify({ action, cancelReason: reason }),
      });
      setCancellingOrderId(null);
      setCancelReasonInput('');
      await loadData();
    } catch (err: any) {
      setActionError(err.message || `Failed to ${action} order`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Bar */}
      <div className="bg-emerald-950 text-stone-100 rounded-2xl p-6 border border-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider">
            <Tractor className="w-4 h-4" />
            <span>Farmer Operations &amp; Inventory Hub</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-50">
            Grower Management Dashboard
          </h1>
          <p className="text-xs text-stone-400">
            Monitor on-hand vs reserved stock, accept incoming orders, and manage farm-gate collections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2.5 bg-emerald-900 hover:bg-emerald-800 text-stone-200 rounded-xl transition-colors border border-emerald-700/50"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenCreateProduct}
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Publish Harvest
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-stone-200 bg-white rounded-t-xl px-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Overview Metrics
        </button>
        <button
          onClick={() => setActiveTab('produce')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'produce'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>Produce &amp; Inventory</span>
          <span className="bg-stone-100 text-stone-700 px-1.5 py-0.2 rounded-full text-[10px]">
            {products.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>Incoming Orders</span>
          {orders.filter((o) => o.status === 'requested').length > 0 && (
            <span className="bg-amber-500 text-stone-950 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
              {orders.filter((o) => o.status === 'requested').length} new
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-stone-500">
          Loading farmer dashboard...
        </div>
      ) : activeTab === 'overview' ? (
        /* Tab 1: Overview Metrics Grid */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Completed Sales Revenue */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1">
                Completed Sales Revenue
              </span>
              <div className="text-2xl font-extrabold text-emerald-900">
                {formatInrPaise(metrics?.orders?.completedRevenuePaise || 0)}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                From {metrics?.orders?.completedOrdersCount || 0} completed farm gate orders
              </p>
            </div>

            {/* Metric 2: Requested Orders Value */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider block mb-1">
                Requested Orders Value
              </span>
              <div className="text-2xl font-extrabold text-amber-800">
                {formatInrPaise(metrics?.orders?.requestedOrdersValuePaise || 0)}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                {metrics?.orders?.incomingRequestsCount || 0} pending orders awaiting your review
              </p>
            </div>

            {/* Metric 3: Active Orders In Progress */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1">
                Accepted &amp; Ready Orders
              </span>
              <div className="text-2xl font-extrabold text-stone-900">
                {metrics?.orders?.acceptedAndReadyCount || 0}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Committed stock awaiting buyer pickup
              </p>
            </div>

            {/* Metric 4: Low Stock Warnings */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1">
                Active Listings
              </span>
              <div className="text-2xl font-extrabold text-stone-900">
                {metrics?.activeListingsCount || 0}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                {metrics?.lowStockCount || 0} listings with low stock alert
              </p>
            </div>
          </div>

          {/* Inventory Valuation Breakdown */}
          <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div>
              <span className="font-bold text-stone-900 block text-sm">
                Inventory Invariant Status:
              </span>
              <p className="text-stone-600">
                Available quantity is strictly calculated as <code className="bg-white px-1.5 py-0.5 rounded border border-stone-300 font-mono text-[11px]">on_hand - reserved</code>.
                Active orders lock inventory immediately to prevent overselling.
              </p>
            </div>
            <div className="flex gap-4 shrink-0">
              <div className="bg-white p-3 rounded-xl border border-stone-200 text-right">
                <span className="text-[10px] uppercase text-stone-400 font-bold block">Physical On-Hand Value</span>
                <span className="font-bold text-stone-900 text-sm">
                  {formatInrPaise(metrics?.inventoryValuation?.onHandPaise || 0)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-stone-200 text-right">
                <span className="text-[10px] uppercase text-amber-600 font-bold block">Reserved Value</span>
                <span className="font-bold text-amber-800 text-sm">
                  {formatInrPaise(metrics?.inventoryValuation?.reservedPaise || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Orders Preview */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <h3 className="font-serif font-bold text-stone-900 text-base mb-4">
              Recent Order Requests
            </h3>
            {orders.length === 0 ? (
              <p className="text-xs text-stone-500 py-6 text-center">No orders received yet.</p>
            ) : (
              <div className="divide-y divide-stone-100 text-xs">
                {orders.slice(0, 5).map((o) => (
                  <div key={o.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-stone-900 flex items-center gap-2">
                        <span>Order #{o.orderCode}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          o.status === 'requested' ? 'bg-amber-100 text-amber-900' :
                          o.status === 'accepted' ? 'bg-blue-100 text-blue-900' :
                          o.status === 'ready' ? 'bg-purple-100 text-purple-900' :
                          o.status === 'completed' ? 'bg-emerald-100 text-emerald-900' :
                          'bg-stone-200 text-stone-700'
                        }`}>
                          {o.status}
                        </span>
                      </div>
                      <div className="text-stone-500 mt-0.5">
                        Buyer: {o.buyerName} ({o.buyerPhone}) • {formatDateTimeKolkata(o.createdAt)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-extrabold text-stone-900 text-sm">
                        {formatInrPaise(o.totalAmountPaise)}
                      </div>
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="text-emerald-800 hover:underline text-[11px] font-semibold"
                      >
                        Manage Order →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'produce' ? (
        /* Tab 2: Produce & Inventory Management */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-stone-900 text-base">
              My Produce Listings ({products.length})
            </h3>
            <button
              onClick={onOpenCreateProduct}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Listing
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-stone-800">
                <thead className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Produce</th>
                    <th className="py-3 px-3">Price / Unit</th>
                    <th className="py-3 px-3">On-Hand Stock</th>
                    <th className="py-3 px-3">Reserved</th>
                    <th className="py-3 px-3">Available</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-2.5">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-10 h-10 object-cover rounded-lg border border-stone-200 shrink-0"
                        />
                        <div>
                          <div
                            onClick={() => onSelectProduct(p)}
                            className="font-bold text-stone-900 hover:underline cursor-pointer"
                          >
                            {p.name}
                          </div>
                          <span className="text-[10px] text-stone-500 capitalize">
                            {p.category.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-semibold text-emerald-850">
                        {formatInrPaise(p.pricePerUnitPaise)}/{p.unit}
                      </td>

                      <td className="py-3 px-3 font-medium text-stone-900">
                        {formatUnitQuantity(p.onHandQuantity, p.unit)}
                      </td>

                      <td className="py-3 px-3 font-medium text-amber-800">
                        {formatUnitQuantity(p.reservedQuantity, p.unit)}
                      </td>

                      <td className="py-3 px-3 font-bold text-stone-900">
                        {formatUnitQuantity(p.availableQuantity, p.unit)}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          p.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                          p.status === 'hidden' ? 'bg-amber-100 text-amber-900' :
                          'bg-red-100 text-red-900'
                        }`}>
                          {p.status}
                        </span>
                        {p.isSurplus && (
                          <span className="ml-1 text-[10px] bg-amber-500 text-stone-950 font-bold px-1.5 py-0.2 rounded">
                            Surplus
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onOpenStockAdjust(p)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded text-xs inline-flex items-center gap-1"
                        >
                          <Sliders className="w-3 h-3 text-emerald-700" />
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 3: Incoming Orders Workflow */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-stone-900 text-base">
              Incoming Orders &amp; Fulfillment ({orders.length})
            </h3>
            <span className="text-xs text-stone-500">
              Only the farmer owning the order may accept, mark ready, or complete it.
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-stone-200">
              <Package className="w-12 h-12 text-stone-300 mx-auto mb-2" />
              <p className="text-xs text-stone-500 font-medium">No customer orders placed yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isRequested = order.status === 'requested';
                const isAccepted = order.status === 'accepted';
                const isReady = order.status === 'ready';
                const isCompleted = order.status === 'completed';
                const isCancelled = order.status === 'cancelled';

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4"
                  >
                    {/* Order Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-stone-900 text-base">
                            Order #{order.orderCode}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                            isRequested ? 'bg-amber-100 text-amber-900' :
                            isAccepted ? 'bg-blue-100 text-blue-900' :
                            isReady ? 'bg-purple-100 text-purple-900' :
                            isCompleted ? 'bg-emerald-100 text-emerald-900' :
                            'bg-red-100 text-red-900'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <span className="text-stone-400 text-[11px]">
                          Submitted: {formatDateTimeKolkata(order.createdAt)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Total Amount</span>
                        <span className="text-xl font-extrabold text-stone-900">
                          {formatInrPaise(order.totalAmountPaise)}
                        </span>
                        <span className="text-[11px] text-stone-500 block capitalize">
                          {order.paymentMode.replace('_', ' ')} • {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Buyer Information & Pickup */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-stone-50 p-3 rounded-xl border border-stone-200">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Buyer Contact</span>
                        <div className="font-bold text-stone-900">{order.buyerName}</div>
                        <div className="text-stone-600">Phone: {order.buyerPhone}</div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Pickup Location</span>
                        <div className="font-semibold text-stone-900 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                          {order.pickupLocality}
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block mb-2">Reserved Items:</span>
                      <div className="divide-y divide-stone-100 text-xs">
                        {order.items.map((item) => (
                          <div key={item.id} className="py-2 flex justify-between items-center">
                            <div>
                              <span className="font-bold text-stone-900">{item.productNameSnapshot}</span>
                              <span className="text-stone-500 text-[11px] ml-2">
                                ({formatInrPaise(item.unitPricePaiseSnapshot)}/{item.unitSnapshot})
                              </span>
                            </div>
                            <div className="font-semibold text-stone-900">
                              {formatUnitQuantity(item.quantity, item.unitSnapshot)} = {formatInrPaise(item.subtotalPaise)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.cancelReason && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900">
                        <span className="font-bold block">Cancellation Reason:</span>
                        {order.cancelReason} ({order.cancelledBy ? `by ${order.cancelledBy}` : ''})
                      </div>
                    )}

                    {/* Order State Transition Actions */}
                    {!isCompleted && !isCancelled && (
                      <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-stone-500">
                          {isRequested && 'Review order and confirm harvest preparation.'}
                          {isAccepted && 'Harvest produce and notify buyer when packaged.'}
                          {isReady && 'Waiting for buyer arrival at farm pickup point.'}
                        </div>

                        <div className="flex items-center gap-2">
                          {isRequested && (
                            <button
                              onClick={() => handleOrderStatusAction(order.id, 'accept')}
                              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Accept Order
                            </button>
                          )}

                          {isAccepted && (
                            <button
                              onClick={() => handleOrderStatusAction(order.id, 'mark_ready')}
                              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                              <Package className="w-3.5 h-3.5" />
                              Mark Ready for Pickup
                            </button>
                          )}

                          {isReady && (
                            <button
                              onClick={() => handleOrderStatusAction(order.id, 'complete')}
                              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Complete Order &amp; Handover
                            </button>
                          )}

                          <button
                            onClick={() => setCancellingOrderId(order.id)}
                            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold rounded-lg text-xs transition-colors"
                          >
                            Cancel with Reason
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Cancel Reason Prompt */}
                    {cancellingOrderId === order.id && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs">
                        <label className="font-bold text-red-900 block">
                          Please provide reason for cancelling Order #{order.orderCode}:
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Weather disruption prevented morning harvest; produce unavailable"
                          value={cancelReasonInput}
                          onChange={(e) => setCancelReasonInput(e.target.value)}
                          className="w-full px-3 py-1.5 border border-red-300 rounded-lg text-stone-900 bg-white"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => { setCancellingOrderId(null); setCancelReasonInput(''); }}
                            className="px-3 py-1 border border-stone-300 rounded text-stone-700"
                          >
                            Dismiss
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOrderStatusAction(order.id, 'cancel', cancelReasonInput || 'Farmer cancelled order')}
                            className="px-3 py-1 bg-red-700 text-white rounded font-bold"
                          >
                            Confirm Cancellation
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
