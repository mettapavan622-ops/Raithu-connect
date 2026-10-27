import React, { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { Order } from '../../shared/types';
import { apiFetch } from '../api';
import {
  formatInrPaise,
  formatUnitQuantity,
  formatDateTimeKolkata,
} from '../utils';

export const BuyerOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

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
  }, []);

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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-emerald-950 text-stone-100 rounded-2xl p-6 border border-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider">
            <ShoppingBag className="w-4 h-4" />
            <span>Direct Consumer Orders</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-50">
            My Pickup Orders
          </h1>
          <p className="text-xs text-stone-400">
            Track status progression from harvest request to farm gate collection.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="p-2.5 bg-emerald-900 hover:bg-emerald-800 text-stone-200 rounded-xl transition-colors self-start sm:self-auto border border-emerald-700/50"
          title="Refresh orders"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Delivery Reminder */}
      <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2.5 shadow-2xs">
        <Truck className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Demo only — delivery is not arranged by this app.</span>
          Please visit the farmer's designated pickup point once your order displays "Ready for Pickup".
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-stone-500">
          Loading order history...
        </div>
      ) : error ? (
        <div className="py-12 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-xs text-red-900">
          <p className="font-bold mb-1">Could not load orders</p>
          <p className="text-stone-600 mb-3">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-4 py-1.5 bg-red-700 text-white rounded-lg font-semibold"
          >
            Try Again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
          <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-serif font-bold text-stone-800 text-base">No orders placed yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Browse fresh Telangana harvests on the marketplace to place your first direct trade request!
          </p>
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
                {/* Header */}
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
                      Placed on {formatDateTimeKolkata(order.createdAt)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Total</span>
                    <span className="text-xl font-extrabold text-stone-900">
                      {formatInrPaise(order.totalAmountPaise)}
                    </span>
                    <span className="text-[11px] text-stone-500 block capitalize">
                      {order.paymentMode.replace('_', ' ')} • {order.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Status Stepper Progression */}
                <div className="py-2">
                  <div className="flex items-center justify-between text-xs text-stone-600 relative">
                    <div className="flex flex-col items-center z-10">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        isRequested || isAccepted || isReady || isCompleted ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-500'
                      }`}>
                        1
                      </div>
                      <span className="text-[10px] mt-1 font-semibold">Requested</span>
                    </div>

                    <div className={`h-0.5 flex-1 mx-2 ${
                      isAccepted || isReady || isCompleted ? 'bg-emerald-700' : 'bg-stone-200'
                    }`} />

                    <div className="flex flex-col items-center z-10">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        isAccepted || isReady || isCompleted ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-500'
                      }`}>
                        2
                      </div>
                      <span className="text-[10px] mt-1 font-semibold">Accepted</span>
                    </div>

                    <div className={`h-0.5 flex-1 mx-2 ${
                      isReady || isCompleted ? 'bg-emerald-700' : 'bg-stone-200'
                    }`} />

                    <div className="flex flex-col items-center z-10">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        isReady || isCompleted ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-500'
                      }`}>
                        3
                      </div>
                      <span className="text-[10px] mt-1 font-semibold">Ready</span>
                    </div>

                    <div className={`h-0.5 flex-1 mx-2 ${
                      isCompleted ? 'bg-emerald-700' : 'bg-stone-200'
                    }`} />

                    <div className="flex flex-col items-center z-10">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        isCompleted ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-500'
                      }`}>
                        4
                      </div>
                      <span className="text-[10px] mt-1 font-semibold">Completed</span>
                    </div>
                  </div>
                </div>

                {/* Farmer & Pickup Locality Box */}
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
                      Direct Grower
                    </span>
                    <div className="font-bold text-stone-900">🧑‍🌾 {order.farmerName}</div>
                    <div className="text-stone-600 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{order.farmerPhone} (Call for coordination)</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
                      Designated Farm Pickup Locality
                    </span>
                    <div className="font-semibold text-stone-900 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>{order.pickupLocality}</span>
                    </div>
                  </div>
                </div>

                {/* Reserved Items */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                    Order Items:
                  </span>
                  <div className="divide-y divide-stone-100 text-xs">
                    {order.items.map((item) => (
                      <div key={item.id} className="py-2 flex justify-between">
                        <div>
                          <span className="font-bold text-stone-900">{item.productNameSnapshot}</span>
                          <span className="text-stone-500 text-[11px] ml-2">
                            ({formatInrPaise(item.unitPricePaiseSnapshot)}/{item.unitSnapshot})
                          </span>
                        </div>
                        <span className="font-semibold text-stone-900">
                          {formatUnitQuantity(item.quantity, item.unitSnapshot)} = {formatInrPaise(item.subtotalPaise)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cancellation notice if cancelled */}
                {order.cancelReason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900">
                    <span className="font-bold block">Order Cancelled:</span>
                    {order.cancelReason} ({order.cancelledBy ? `by ${order.cancelledBy}` : ''})
                  </div>
                )}

                {/* Timeline Events Audit */}
                {order.events && order.events.length > 0 && (
                  <div className="pt-2 border-t border-stone-100">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                      Status Timeline Log:
                    </span>
                    <div className="space-y-1">
                      {order.events.map((ev) => (
                        <div key={ev.id} className="text-[11px] text-stone-600 flex items-center gap-2">
                          <span className="font-mono text-stone-400">
                            {formatDateTimeKolkata(ev.createdAt).split(',')[1]}
                          </span>
                          <span className="font-medium text-stone-800 capitalize">[{ev.toStatus}]</span>
                          <span>{ev.notes}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buyer Cancellation: Allowed strictly when order is in 'requested' state */}
                {isRequested && (
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[11px] text-stone-500">
                      Need to change your pickup plan? You can cancel while the order is pending confirmation.
                    </span>

                    <button
                      onClick={() => setCancellingOrderId(order.id)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}

                {/* Buyer Cancel Confirm Box */}
                {cancellingOrderId === order.id && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs">
                    <label className="font-bold text-red-900 block">
                      Reason for cancelling Order #{order.orderCode}:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Changed schedule / bought elsewhere"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full px-3 py-1.5 border border-red-300 rounded-lg text-stone-900 bg-white"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => { setCancellingOrderId(null); setCancelReason(''); }}
                        className="px-3 py-1 border border-stone-300 rounded text-stone-700"
                      >
                        Keep Order
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(order.id)}
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
  );
};
