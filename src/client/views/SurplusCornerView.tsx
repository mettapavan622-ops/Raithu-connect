import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  PiggyBank,
  AlertCircle,
  ShoppingBag,
  Info
} from 'lucide-react';
import { Product } from '../../shared/types';
import { apiFetch } from '../api';
import { ProductCard } from '../components/ProductCard';
import { formatInrPaise } from '../utils';

interface SurplusCornerViewProps {
  onSelectProduct: (product: Product) => void;
  onViewFarmer: (farmerId: string) => void;
  onReportProduct: (product: Product) => void;
}

export const SurplusCornerView: React.FC<SurplusCornerViewProps> = ({
  onSelectProduct,
  onViewFarmer,
  onReportProduct,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<{ totalSavingsPaise: number; totalSurplusOrdersCompleted: number }>({
    totalSavingsPaise: 0,
    totalSurplusOrdersCompleted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSurplusData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ products: Product[]; stats: any }>('/api/surplus');
      setProducts(res.products || []);
      if (res.stats) setStats(res.stats);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch surplus corner offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurplusData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-stone-100 rounded-3xl p-6 sm:p-8 border border-amber-800 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-amber-800 text-amber-200 text-xs px-3 py-1 rounded-full font-mono font-medium border border-amber-600">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Surplus Corner • మిగులు పంట</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-amber-100">
            Excess Harvest Clearance Deals
          </h1>

          <p className="text-sm text-amber-200/90 leading-relaxed">
            When weather or peak flushes produce extra volume, local farmers offer direct discounts with strict sale deadlines to prevent harvest spoilage.
          </p>

          {/* Strictly Verified Actual Money Saved Stats from Real Completed Orders */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <div className="bg-amber-900/80 border border-amber-700/60 px-4 py-2 rounded-xl flex items-center gap-3">
              <PiggyBank className="w-6 h-6 text-amber-300" />
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-300 block">
                  Buyer Money Saved (Verified from Completed Orders)
                </span>
                <span className="text-xl font-extrabold text-white">
                  {formatInrPaise(stats.totalSavingsPaise)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Honesty & Safety Notice */}
      <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex items-start gap-3 text-xs text-stone-700 shadow-2xs">
        <Info className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-stone-900 block mb-0.5">Surplus Corner Rules &amp; Freshness Policy:</span>
          Farmers set explicit discount percentages and countdown sale deadlines for excess volume.
          Deadlines reflect planned trade windows and do not infer or replace physical inspection of food freshness. Expired offers are automatically blocked from checkout.
        </div>
      </div>

      {/* Produce Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold text-stone-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            Active Surplus Offers ({products.length})
          </h2>
          <span className="text-xs text-stone-500">
            First come, first served • Time-sensitive discounts
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-stone-500 font-medium">Checking active surplus lots...</p>
          </div>
        ) : error ? (
          <div className="py-12 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-xs text-red-900">
            <p className="font-bold mb-1">Could not load surplus listings</p>
            <p className="text-stone-600 mb-3">{error}</p>
            <button
              onClick={fetchSurplusData}
              className="px-4 py-1.5 bg-red-700 text-white rounded-lg font-semibold"
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center bg-stone-50 rounded-2xl border border-stone-200 p-8 space-y-3">
            <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="font-serif font-bold text-stone-800 text-base">No active surplus lots today</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              All harvested produce is currently within standard supply levels. Check back when seasonal flushes arrive!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onSelect={onSelectProduct}
                onViewFarmer={onViewFarmer}
                onReport={onReportProduct}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
