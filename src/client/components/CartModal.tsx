import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Truck,
  CreditCard,
  Banknote,
  ArrowRight,
  MapPin,
  Clock
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatInrPaise, formatUnitQuantity } from '../utils';
import { apiFetch } from '../api';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orders: any[]) => void;
  onOpenAuth: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
  onOpenAuth,
}) => {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalPaise,
    itemsGroupedByFarmer,
  } = useCart();
  const { user } = useAuth();

  const [paymentMode, setPaymentMode] = useState<'cash_on_pickup' | 'simulated_upi'>('cash_on_pickup');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdOrders, setCreatedOrders] = useState<any[] | null>(null);

  if (!isOpen) return null;

  const farmerCount = Object.keys(itemsGroupedByFarmer).length;

  const handleCheckout = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    if (user.role !== 'buyer') {
      setErrorMessage('Orders can only be placed with a Buyer account. Please switch to a Buyer profile.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    // Generate unique idempotency key
    const idempotencyKey = 'rc_idem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

    const payload = {
      items: items.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        expectedUnitPricePaise: i.unitPricePaise,
      })),
      paymentMode,
      idempotencyKey,
    };

    try {
      const result = await apiFetch('/api/orders/checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setCreatedOrders(result.orders);
      clearCart();
      onOrderSuccess(result.orders);
    } catch (err: any) {
      setErrorMessage(err.message || 'Order reservation failed. Please review your cart.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-emerald-950 text-stone-100 px-6 py-4 flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <h3 className="font-serif text-lg font-bold">
              Direct Farmer Pickup Cart
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-emerald-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {createdOrders ? (
            /* Success Screen */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="font-serif text-2xl font-bold text-stone-900">
                Order Requests Submitted!
              </h4>
              <p className="text-sm text-stone-600 max-w-md mx-auto">
                Stock has been reserved. {createdOrders.length > 1 ? `${createdOrders.length} separate orders were created for each farmer.` : 'Your order is awaiting farmer acceptance.'}
              </p>

              {/* Order Cards */}
              <div className="space-y-3 max-w-md mx-auto pt-2 text-left">
                {createdOrders.map((o) => (
                  <div key={o.id} className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                    <div className="flex items-center justify-between font-bold text-stone-900 mb-1">
                      <span>Order #{o.orderCode}</span>
                      <span className="text-emerald-850 font-extrabold">{formatInrPaise(o.totalAmountPaise)}</span>
                    </div>
                    <div className="text-stone-600 mb-2">
                      Farmer: <span className="font-semibold text-stone-800">{o.farmerName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-500 bg-white p-2 rounded border border-stone-100">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Pickup: {o.pickupLocality}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 max-w-md mx-auto">
                <strong>Pickup Notice:</strong> Please contact the farmer or visit the designated locality once the order moves to "Ready for Pickup".
              </div>

              <div className="pt-4">
                <button
                  onClick={() => {
                    setCreatedOrders(null);
                    onClose();
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow transition-colors"
                >
                  View My Orders
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12 text-stone-500">
              <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="font-medium text-stone-700 mb-1">Your cart is currently empty</p>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                Explore local harvests from Hyderabad and nearby mandals to place fresh direct orders.
              </p>
            </div>
          ) : (
            /* Active Cart Review */
            <div className="space-y-6">
              {/* Delivery Disclaimer Banner */}
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-xs text-amber-950">
                <Truck className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Demo only — delivery is not arranged by this app.</span>
                  All produce must be picked up directly at the farmer's designated locality in Hyderabad or surrounding rural mandals.
                </div>
              </div>

              {/* Error Callout */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-xl flex items-start gap-2.5 text-xs text-red-900">
                  <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Order Submission Error:</span>
                    {errorMessage}
                  </div>
                </div>
              )}

              {/* Multi-Farmer Warning */}
              {farmerCount > 1 && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-950 flex items-center justify-between">
                  <span>Cart contains items from <strong>{farmerCount} different farmers</strong>.</span>
                  <span className="text-[11px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono font-medium">
                    {farmerCount} Separate Orders
                  </span>
                </div>
              )}

              {/* Items Grouped by Farmer */}
              <div className="space-y-4">
                {Object.entries(itemsGroupedByFarmer).map(([farmerId, group]) => (
                  <div key={farmerId} className="border border-stone-200 rounded-xl overflow-hidden bg-white">
                    {/* Farmer Header */}
                    <div className="bg-stone-50 px-4 py-2.5 border-b border-stone-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 font-serif">🧑‍🌾 {group.farmerName}</span>
                        {group.farmName && <span className="text-stone-500 font-medium hidden sm:inline">({group.farmName})</span>}
                      </div>
                      <div className="flex items-center gap-1 text-stone-500 text-[11px]">
                        <MapPin className="w-3 h-3 text-emerald-700" />
                        <span>Pickup: {group.locality.split(',')[0]}</span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="p-4 divide-y divide-stone-100">
                      {group.items.map((item) => {
                        const isKg = item.product.unit === 'kg';
                        const step = isKg ? 500 : 1;

                        return (
                          <div key={item.product.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                className="w-12 h-12 object-cover rounded-lg border border-stone-200 shrink-0"
                              />
                              <div>
                                <h5 className="font-bold text-stone-900">{item.product.name}</h5>
                                <div className="text-stone-500 text-[11px]">
                                  {formatInrPaise(item.unitPricePaise)}/{item.product.unit}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {/* Quantity Stepper */}
                              <div className="flex items-center gap-2 bg-stone-100 rounded-lg p-1">
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity - step)}
                                  className="w-6 h-6 rounded bg-white hover:bg-stone-200 text-stone-800 font-bold flex items-center justify-center shadow-2xs"
                                >
                                  -
                                </button>
                                <span className="font-semibold text-stone-900 min-w-[50px] text-center">
                                  {formatUnitQuantity(item.quantity, item.product.unit)}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity + step)}
                                  disabled={item.quantity >= item.product.availableQuantity}
                                  className="w-6 h-6 rounded bg-white hover:bg-stone-200 disabled:opacity-40 text-stone-800 font-bold flex items-center justify-center shadow-2xs"
                                >
                                  +
                                </button>
                              </div>

                              {/* Subtotal */}
                              <div className="font-bold text-stone-900 min-w-[65px] text-right">
                                {formatInrPaise(item.subtotalPaise)}
                              </div>

                              {/* Remove */}
                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                className="text-stone-400 hover:text-red-700 p-1"
                                title="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Mode Selection */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                <span className="font-bold text-stone-800 block mb-2">Select Payment Method:</span>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      paymentMode === 'cash_on_pickup'
                        ? 'bg-emerald-50 border-emerald-700 text-emerald-950 font-semibold'
                        : 'bg-white border-stone-200 text-stone-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_mode"
                      value="cash_on_pickup"
                      checked={paymentMode === 'cash_on_pickup'}
                      onChange={() => setPaymentMode('cash_on_pickup')}
                      className="text-emerald-700 focus:ring-0"
                    />
                    <Banknote className="w-4 h-4 text-emerald-800" />
                    <span>Cash on Pickup</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      paymentMode === 'simulated_upi'
                        ? 'bg-emerald-50 border-emerald-700 text-emerald-950 font-semibold'
                        : 'bg-white border-stone-200 text-stone-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_mode"
                      value="simulated_upi"
                      checked={paymentMode === 'simulated_upi'}
                      onChange={() => setPaymentMode('simulated_upi')}
                      className="text-emerald-700 focus:ring-0"
                    />
                    <CreditCard className="w-4 h-4 text-emerald-800" />
                    <span>Simulated UPI (Demo)</span>
                  </label>
                </div>
                <p className="text-[10px] text-stone-500 mt-2">
                  * Note: This is an academic prototype. Real card credentials or payment gateways are never collected.
                </p>
              </div>

              {/* Total & Checkout Bar */}
              <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-500 block">Total Payable:</span>
                  <span className="text-2xl font-extrabold text-stone-900">
                    {formatInrPaise(totalPaise)}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={submitting}
                  className="bg-emerald-700 hover:bg-emerald-850 disabled:bg-stone-300 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md flex items-center gap-2 transition-all"
                >
                  {submitting ? (
                    <span>Reserving Inventory...</span>
                  ) : (
                    <>
                      <span>Submit Order Request</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
