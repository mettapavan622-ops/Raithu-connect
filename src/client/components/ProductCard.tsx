import React from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  FileCheck,
  ShoppingBag,
  Sparkles,
  AlertTriangle,
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

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onViewFarmer?: (farmerId: string) => void;
  onReport?: (product: Product) => void;
  isComparing?: boolean;
  onToggleCompare?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onViewFarmer,
  onReport,
  isComparing = false,
  onToggleCompare,
}) => {
  const { addToCart } = useCart();
  const [imageError, setImageError] = React.useState(false);
  const [addedNotice, setAddedNotice] = React.useState(false);

  const fallbackImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80';

  const isOutOfStock = product.availableQuantity <= 0;
  const isSurplus = product.isSurplus && product.surplusDiscountPct > 0;
  const effectivePricePaise = isSurplus
    ? Math.round(product.pricePerUnitPaise * (1 - product.surplusDiscountPct / 100))
    : product.pricePerUnitPaise;

  const surplusTime = isSurplus ? getSurplusTimeRemaining(product.surplusDeadline) : null;
  const isExpiredSurplus = surplusTime?.isExpired;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock || isExpiredSurplus) return;
    addToCart(product);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 1500);
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="bg-white rounded-xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col cursor-pointer group hover:border-emerald-700/40 relative"
    >
      {/* Product Image Section */}
      <div className="relative aspect-[4/3] w-full bg-stone-100 overflow-hidden">
        <img
          src={imageError ? fallbackImage : product.imageUrl}
          alt={product.name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Surplus Badge */}
        {isSurplus && !isExpiredSurplus && (
          <div className="absolute top-2.5 left-2.5 bg-amber-600 text-stone-950 font-bold text-xs px-2.5 py-1 rounded-md shadow flex items-center gap-1 border border-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{product.surplusDiscountPct}% OFF SURPLUS</span>
          </div>
        )}

        {/* Expired Surplus Notice */}
        {isExpiredSurplus && (
          <div className="absolute top-2.5 left-2.5 bg-stone-900/90 text-stone-300 text-[11px] px-2 py-0.5 rounded shadow">
            Surplus offer expired
          </div>
        )}

        {/* Category Chip */}
        <div className="absolute top-2.5 right-2.5 bg-stone-900/80 backdrop-blur-xs text-stone-200 text-[11px] font-medium px-2 py-0.5 rounded capitalize">
          {product.category.replace('_', ' ')}
        </div>

        {/* Comparison Checkbox */}
        {onToggleCompare && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(product);
            }}
            className="absolute bottom-2.5 left-2.5 bg-stone-950/75 hover:bg-stone-950 text-stone-100 text-[11px] font-medium px-2 py-1 rounded flex items-center gap-1.5 transition-colors"
          >
            <input
              type="checkbox"
              checked={isComparing}
              onChange={() => {}} // handled by parent onClick
              className="rounded text-emerald-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
            />
            <span>Compare</span>
          </div>
        )}

        {/* Stock Status Badge */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-2xs flex items-center justify-center">
            <span className="bg-red-900 text-red-100 font-semibold text-xs px-3 py-1 rounded-md shadow">
              Out of Stock
            </span>
          </div>
        ) : product.availableQuantity < (product.unit === 'kg' ? 10000 : 5) ? (
          <div className="absolute bottom-2.5 right-2.5 bg-amber-900/90 text-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded shadow flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Low stock
          </div>
        ) : null}
      </div>

      {/* Card Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Header: Name and Price */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-serif text-lg font-bold text-stone-900 line-clamp-1 group-hover:text-emerald-800 transition-colors">
              {product.name}
            </h3>
            <div className="text-right shrink-0">
              <div className="font-bold text-emerald-850 text-base">
                {formatInrPaise(effectivePricePaise)}
                <span className="text-xs font-normal text-stone-500">/{product.unit}</span>
              </div>
              {isSurplus && (
                <div className="text-[11px] text-stone-400 line-through">
                  {formatUnitPrice(product.pricePerUnitPaise, product.unit)}
                </div>
              )}
            </div>
          </div>

          {/* Farmer & Location Info */}
          <div className="flex items-center justify-between text-xs text-stone-600 mb-3 pb-2 border-b border-stone-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onViewFarmer && product.farmerId) {
                  onViewFarmer(product.farmerId);
                }
              }}
              className="text-emerald-800 font-medium hover:underline text-left line-clamp-1"
            >
              🧑‍🌾 {product.farmerName || 'Local Farmer'}
            </button>
            <div className="flex items-center gap-1 text-stone-500 shrink-0 text-[11px]">
              <MapPin className="w-3 h-3 text-stone-400" />
              <span>{product.pickupLocality.split(',')[0]}</span>
            </div>
          </div>

          {/* 8 Mandatory Display Specs Grid */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs text-stone-700 bg-stone-50 p-2.5 rounded-lg mb-3 border border-stone-200/60">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-medium">Available</span>
              <span className="font-semibold text-stone-900">
                {formatUnitQuantity(product.availableQuantity, product.unit)}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-medium">Harvest Date</span>
              <span className="font-medium text-stone-800">
                {formatDateKolkata(product.harvestDate)}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-medium">Pickup Ready</span>
              <span className="font-medium text-stone-800">
                {formatDateKolkata(product.availabilityDate)}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-medium">Stock Updated</span>
              <span className="font-medium text-stone-600 text-[11px]">
                {formatDateTimeKolkata(product.updatedAt).split(',')[0]}
              </span>
            </div>
          </div>

          {/* Surplus countdown if active */}
          {isSurplus && surplusTime && !isExpiredSurplus && (
            <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3" /> Sale ends:
              </span>
              <span className="font-semibold">{surplusTime.text}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5"
          >
            <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Harvest Passport</span>
          </button>

          <button
            type="button"
            disabled={isOutOfStock || isExpiredSurplus}
            onClick={handleQuickAdd}
            className={`py-2 px-3.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              addedNotice
                ? 'bg-emerald-800 text-white'
                : isOutOfStock || isExpiredSurplus
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-emerald-700 hover:bg-emerald-850 text-white shadow-xs'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{addedNotice ? 'Added ✓' : 'Add'}</span>
          </button>

          {onReport && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReport(product);
              }}
              className="p-2 text-stone-400 hover:text-red-600 transition-colors rounded"
              title="Report listing"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
