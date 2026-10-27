import React from 'react';
import { X, Scale, AlertCircle, ShoppingBag } from 'lucide-react';
import { Product } from '../../shared/types';
import {
  formatInrPaise,
  formatUnitQuantity,
  formatDateKolkata,
} from '../utils';
import { useCart } from '../context/CartContext';

interface ComparisonDrawerProps {
  products: Product[];
  onRemove: (productId: string) => void;
  onClear: () => void;
  onSelectProduct: (product: Product) => void;
}

export const ComparisonDrawer: React.FC<ComparisonDrawerProps> = ({
  products,
  onRemove,
  onClear,
  onSelectProduct,
}) => {
  const { addToCart } = useCart();
  const [isOpen, setIsOpen] = React.useState(true);

  if (products.length === 0) return null;

  // Check unit compatibility: are all selected items using the same measurement unit?
  const uniqueUnits = Array.from(new Set(products.map((p) => p.unit)));
  const hasUnitMismatch = uniqueUnits.length > 1;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-emerald-800 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-800" />
            <h4 className="font-serif font-bold text-stone-900 text-sm sm:text-base">
              Produce Comparison ({products.length} items)
            </h4>
            {hasUnitMismatch && (
              <span className="text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-medium flex items-center gap-1 border border-amber-300">
                <AlertCircle className="w-3 h-3 text-amber-700" />
                Note: Incompatible units ({uniqueUnits.join(', ')}) cannot be directly price-compared
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-xs text-stone-600 hover:text-stone-900 font-medium underline"
            >
              {isOpen ? 'Minimize' : 'Expand'}
            </button>
            <button
              onClick={onClear}
              className="text-xs text-red-700 hover:text-red-900 font-medium"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {isOpen && (
          <div className="mt-3 overflow-x-auto pb-2">
            <table className="w-full text-xs text-left text-stone-800 border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 uppercase text-[10px] tracking-wider">
                  <th className="py-2 pr-4 font-semibold w-24">Item</th>
                  <th className="py-2 px-3 font-semibold">Farmer &amp; Locality</th>
                  <th className="py-2 px-3 font-semibold">Price / Unit</th>
                  <th className="py-2 px-3 font-semibold">Harvest Date</th>
                  <th className="py-2 px-3 font-semibold">Available Stock</th>
                  <th className="py-2 px-3 font-semibold">Ready Date</th>
                  <th className="py-2 pl-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {products.map((p) => {
                  const effectivePrice = p.isSurplus && p.surplusDiscountPct > 0
                    ? Math.round(p.pricePerUnitPaise * (1 - p.surplusDiscountPct / 100))
                    : p.pricePerUnitPaise;

                  return (
                    <tr key={p.id} className="hover:bg-emerald-50/50 transition-colors">
                      <td className="py-2.5 pr-4 flex items-center gap-2">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-10 h-10 object-cover rounded border border-stone-200"
                        />
                        <div>
                          <div
                            onClick={() => onSelectProduct(p)}
                            className="font-serif font-bold text-stone-900 cursor-pointer hover:underline hover:text-emerald-800 line-clamp-1"
                          >
                            {p.name}
                          </div>
                          <span className="text-[10px] text-stone-500 capitalize">
                            {p.category.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-medium text-stone-900">{p.farmerName}</div>
                        <div className="text-[11px] text-stone-500">{p.pickupLocality}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-bold text-emerald-850 text-sm">
                          {formatInrPaise(effectivePrice)}
                          <span className="text-[11px] font-normal text-stone-500">/{p.unit}</span>
                        </div>
                        {p.isSurplus && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
                            {p.surplusDiscountPct}% off
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 font-medium">
                        {formatDateKolkata(p.harvestDate)}
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-stone-900">
                        {formatUnitQuantity(p.availableQuantity, p.unit)}
                      </td>

                      <td className="py-2.5 px-3 text-stone-700">
                        {formatDateKolkata(p.availabilityDate)}
                      </td>

                      <td className="py-2.5 pl-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => addToCart(p)}
                            disabled={p.availableQuantity <= 0}
                            className="bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-200 text-white font-medium py-1 px-2.5 rounded text-xs flex items-center gap-1"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            Add
                          </button>
                          <button
                            onClick={() => onRemove(p.id)}
                            className="text-stone-400 hover:text-stone-700 p-1"
                            title="Remove from comparison"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
