import React, { useState } from 'react';
import {
  X,
  FileCheck,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  ShieldAlert,
  Info,
  CheckCircle,
  ShoppingBag,
  Flag
} from 'lucide-react';
import { Product } from '../../shared/types';
import {
  formatInrPaise,
  formatUnitQuantity,
  formatUnitPrice,
  formatDateKolkata,
  formatDateTimeKolkata,
  getSurplusTimeRemaining,
} from '../utils';
import { useCart } from '../context/CartContext';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onViewFarmer?: (farmerId: string) => void;
  onReport?: (product: Product) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onViewFarmer,
  onReport,
}) => {
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState<'details' | 'passport'>('details');

  if (!product) return null;

  // Selected quantity state
  // For kg: step in 500g increments (default 1000g = 1kg)
  // For piece/bunch: step in whole numbers (default 1)
  const isKg = product.unit === 'kg';
  const defaultQuantity = isKg ? Math.min(1000, product.availableQuantity) : Math.min(1, product.availableQuantity);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(defaultQuantity || 1);
  const [addedNotice, setAddedNotice] = useState(false);

  const isOutOfStock = product.availableQuantity <= 0;
  const isSurplus = product.isSurplus && product.surplusDiscountPct > 0;
  const effectivePricePaise = isSurplus
    ? Math.round(product.pricePerUnitPaise * (1 - product.surplusDiscountPct / 100))
    : product.pricePerUnitPaise;

  const surplusTime = isSurplus ? getSurplusTimeRemaining(product.surplusDeadline) : null;
  const isExpiredSurplus = surplusTime?.isExpired;

  // Subtotal calculation
  const subtotalPaise = isKg
    ? Math.round((selectedQuantity * effectivePricePaise) / 1000)
    : selectedQuantity * effectivePricePaise;

  const handleAddToCart = () => {
    if (isOutOfStock || isExpiredSurplus) return;
    addToCart(product, selectedQuantity);
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      onClose();
    }, 1000);
  };

  const incrementQty = () => {
    const step = isKg ? 500 : 1;
    setSelectedQuantity((prev) => Math.min(product.availableQuantity, prev + step));
  };

  const decrementQty = () => {
    const step = isKg ? 500 : 1;
    const minVal = isKg ? 500 : 1;
    setSelectedQuantity((prev) => Math.max(minVal, prev - step));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="bg-emerald-950 text-stone-100 px-6 py-4 flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg sm:text-xl font-bold tracking-tight">
              {product.name}
            </span>
            <span className="text-xs bg-emerald-800 text-emerald-300 font-medium px-2 py-0.5 rounded capitalize">
              {product.category.replace('_', ' ')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-emerald-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'details'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Produce Details &amp; Pickup
          </button>

          <button
            onClick={() => setActiveTab('passport')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'passport'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileCheck className="w-4 h-4 text-emerald-700" />
            Harvest Passport™
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {activeTab === 'details' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Image and Farmer Card */}
              <div>
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 border border-stone-200 mb-4">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {isSurplus && (
                    <div className="absolute top-3 left-3 bg-amber-600 text-stone-950 font-bold text-xs px-2.5 py-1 rounded shadow">
                      {product.surplusDiscountPct}% SURPLUS DISCOUNT
                    </div>
                  )}
                </div>

                {/* Farmer Contact Box */}
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1">
                    Direct Grower Profile
                  </span>
                  <h4 className="font-serif font-bold text-stone-900 text-base">
                    {product.farmerName || 'Local Farmer'}
                  </h4>
                  {product.farmName && (
                    <p className="text-xs text-stone-600 font-medium">{product.farmName}</p>
                  )}
                  <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    {product.farmerLocality || product.pickupLocality}
                  </p>
                  {onViewFarmer && product.farmerId && (
                    <button
                      onClick={() => {
                        onClose();
                        onViewFarmer(product.farmerId);
                      }}
                      className="mt-3 text-xs text-emerald-800 hover:text-emerald-950 font-semibold underline"
                    >
                      View Farmer's Farm Story &amp; All Produce →
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Pricing, Quantities, and Action */}
              <div className="flex flex-col justify-between">
                <div>
                  {/* Price Banner */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-emerald-900">
                        {formatInrPaise(effectivePricePaise)}
                      </span>
                      <span className="text-stone-500 font-medium">/{product.unit}</span>
                      {isSurplus && (
                        <span className="text-sm text-stone-400 line-through">
                          {formatUnitPrice(product.pricePerUnitPaise, product.unit)}
                        </span>
                      )}
                    </div>

                    {isSurplus && surplusTime && (
                      <div className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-300 p-2 rounded-lg flex items-center justify-between">
                        <span className="font-medium">Surplus Sale Offer:</span>
                        <span className="font-bold">{surplusTime.text}</span>
                      </div>
                    )}
                  </div>

                  {/* Stock & Locality Specs */}
                  <div className="space-y-2.5 text-xs text-stone-700 mb-4 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                    <div className="flex justify-between pb-1.5 border-b border-stone-200/80">
                      <span className="text-stone-500">Available to Order</span>
                      <span className="font-bold text-stone-900">
                        {formatUnitQuantity(product.availableQuantity, product.unit)}
                      </span>
                    </div>

                    <div className="flex justify-between pb-1.5 border-b border-stone-200/80">
                      <span className="text-stone-500">Harvest Date</span>
                      <span className="font-semibold text-stone-800">
                        {formatDateKolkata(product.harvestDate)}
                      </span>
                    </div>

                    <div className="flex justify-between pb-1.5 border-b border-stone-200/80">
                      <span className="text-stone-500">Ready for Pickup</span>
                      <span className="font-semibold text-stone-800">
                        {formatDateKolkata(product.availabilityDate)}
                      </span>
                    </div>

                    <div className="flex justify-between pb-1.5 border-b border-stone-200/80">
                      <span className="text-stone-500">Designated Pickup Point</span>
                      <span className="font-semibold text-stone-800 text-right max-w-[200px]">
                        {product.pickupLocality}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-stone-500">Last Stock Verification</span>
                      <span className="font-medium text-stone-600">
                        {formatDateTimeKolkata(product.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Farmer Description */}
                  {product.description && (
                    <div className="mb-4">
                      <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1">
                        Grower Description
                      </span>
                      <p className="text-xs text-stone-700 leading-relaxed bg-white p-3 rounded-lg border border-stone-100 shadow-2xs">
                        {product.description}
                      </p>
                    </div>
                  )}

                  {/* Pickup Notes */}
                  {product.pickupNotes && (
                    <div className="mb-4 p-3 bg-amber-50/60 border border-amber-200/60 rounded-lg text-xs text-amber-900">
                      <span className="font-semibold block mb-0.5">Pickup Instructions:</span>
                      {product.pickupNotes}
                    </div>
                  )}
                </div>

                {/* Quantity Picker & Add to Cart */}
                <div className="pt-4 border-t border-stone-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-stone-700">Select Quantity:</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={decrementQty}
                        disabled={selectedQuantity <= (isKg ? 500 : 1)}
                        className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 disabled:opacity-40 font-bold text-stone-800 flex items-center justify-center transition-colors"
                      >
                        -
                      </button>
                      <span className="font-bold text-stone-900 text-sm min-w-[70px] text-center">
                        {formatUnitQuantity(selectedQuantity, product.unit)}
                      </span>
                      <button
                        onClick={incrementQty}
                        disabled={selectedQuantity >= product.availableQuantity}
                        className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 disabled:opacity-40 font-bold text-stone-800 flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4 text-sm">
                    <span className="text-stone-600">Calculated Subtotal:</span>
                    <span className="font-extrabold text-stone-900 text-base">
                      {formatInrPaise(subtotalPaise)}
                    </span>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || isExpiredSurplus}
                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                      addedNotice
                        ? 'bg-emerald-900 text-white'
                        : isOutOfStock || isExpiredSurplus
                        ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{addedNotice ? 'Added to Cart ✓' : 'Add to Pickup Cart'}</span>
                  </button>

                  {/* Delivery Demo Disclaimer */}
                  <p className="text-[11px] text-stone-400 text-center mt-2">
                    Demo only — delivery is not arranged by this app. You will collect directly from {product.pickupLocality.split(',')[0]}.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Harvest Passport™ */
            <div className="space-y-6">
              {/* Distinctive Passport Certificate Container */}
              <div className="bg-emerald-950 text-stone-100 p-6 rounded-2xl border-2 border-emerald-800 shadow-xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-800/30 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between mb-4 border-b border-emerald-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <FileCheck className="w-6 h-6 text-emerald-400" />
                    <div>
                      <h3 className="font-serif text-lg font-bold text-emerald-200">
                        Harvest Passport™
                      </h3>
                      <p className="text-[11px] text-stone-400 font-mono">
                        Produce Traceability &amp; Harvest Log
                      </p>
                    </div>
                  </div>

                  <span className="text-xs bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 font-mono px-2.5 py-1 rounded">
                    {product.lotInfo?.lotNumber || `LOT-${product.id.slice(0, 8).toUpperCase()}`}
                  </span>
                </div>

                {/* Important Truth Disclaimer */}
                <div className="bg-emerald-900/40 border border-emerald-700/40 p-3 rounded-xl mb-5 flex items-start gap-2.5 text-xs text-emerald-200">
                  <Info className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-emerald-100">Farmer-Provided Declaration:</span>
                    The dates, field origin, and harvest practices below are self-reported directly by the registered grower.
                    RaithuConnect promotes honest local direct trade without invented claims or third-party certifications.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-emerald-900/30 p-3.5 rounded-xl border border-emerald-800/50">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                      Exact Harvest Timestamp
                    </span>
                    <span className="font-semibold text-stone-100 text-sm">
                      {formatDateTimeKolkata(product.lotInfo?.harvestTimestamp || product.harvestDate)}
                    </span>
                  </div>

                  <div className="bg-emerald-900/30 p-3.5 rounded-xl border border-emerald-800/50">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                      Field / Polam Location
                    </span>
                    <span className="font-semibold text-stone-100 text-sm">
                      {product.lotInfo?.fieldLocation || product.pickupLocality}
                    </span>
                  </div>

                  <div className="bg-emerald-900/30 p-3.5 rounded-xl border border-emerald-800/50">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                      Initial Batch On-Hand
                    </span>
                    <span className="font-semibold text-stone-100 text-sm">
                      {formatUnitQuantity(product.onHandQuantity, product.unit)}
                    </span>
                  </div>

                  <div className="bg-emerald-900/30 p-3.5 rounded-xl border border-emerald-800/50">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                      Current Committed Reservations
                    </span>
                    <span className="font-semibold text-stone-100 text-sm">
                      {formatUnitQuantity(product.reservedQuantity, product.unit)} (Active buyer orders)
                    </span>
                  </div>
                </div>

                {/* Grower's Harvest Field Notes */}
                <div className="mt-4 bg-emerald-900/30 p-3.5 rounded-xl border border-emerald-800/50 text-xs">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                    Field Notes from {product.farmerName}
                  </span>
                  <p className="text-stone-200 italic leading-relaxed">
                    "{product.lotInfo?.harvestNotes || 'Picked fresh in early hours to preserve natural flavor and crispness.'}"
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-emerald-800/80 flex items-center justify-between text-[11px] text-stone-400 font-mono">
                  <span>Registered Farmer: {product.farmerName}</span>
                  <span>Mandal: {product.farmerLocality || product.pickupLocality}</span>
                </div>
              </div>

              {/* Guidelines reminder */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600">
                <span className="font-bold text-stone-900 block mb-1">
                  Why Harvest Passports Matter:
                </span>
                By recording harvest dates at the lot level, buyers know exactly when their food was plucked,
                enabling true farm-to-table transparency without intermediaries or artificial shelf-life extenders.
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer with Reporting Option */}
        <div className="px-6 py-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>Local Harvest ID: #{product.id.slice(0, 12)}</span>
          {onReport && (
            <button
              onClick={() => onReport(product)}
              className="text-stone-400 hover:text-red-700 flex items-center gap-1 font-medium transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              Report this listing
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
