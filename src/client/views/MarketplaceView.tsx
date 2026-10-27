import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  Tag,
  Sparkles,
  MapPin,
  Scale,
  ShoppingBag,
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import { Product, ProduceCategory } from '../../shared/types';
import { apiFetch } from '../api';
import { ProductCard } from '../components/ProductCard';
import { ComparisonDrawer } from '../components/ComparisonDrawer';
import { useAuth } from '../context/AuthContext';

interface MarketplaceViewProps {
  onSelectProduct: (product: Product) => void;
  onViewFarmer: (farmerId: string) => void;
  onReportProduct: (product: Product) => void;
  onOpenCreateProduct: () => void;
}

const CATEGORIES: { id: string; label: string }[] = [
  { id: '', label: 'All Produce' },
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'fruits', label: 'Fruits' },
  { id: 'leafy_greens', label: 'Leafy Greens' },
  { id: 'grains', label: 'Grains & Pulses' },
  { id: 'spices_and_others', label: 'Spices & Tubers' },
];

const POPULAR_LOCALITIES = [
  'Shamshabad',
  'Ibrahimpatnam',
  'Chevella',
  'Shankarpally',
  'Medchal',
  'Kandlakoya',
];

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  onSelectProduct,
  onViewFarmer,
  onReportProduct,
  onOpenCreateProduct,
}) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocality, setSelectedLocality] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [surplusOnly, setSurplusOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<string>('');

  // Comparison State
  const [compareItems, setCompareItems] = useState<Product[]>([]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedLocality) params.set('locality', selectedLocality);
      if (inStockOnly) params.set('inStock', 'true');
      if (surplusOnly) params.set('surplus', 'true');
      if (maxPrice && parseFloat(maxPrice) > 0) params.set('maxPrice', maxPrice);

      const res = await apiFetch<{ products: Product[] }>(`/api/products?${params.toString()}`);
      setProducts(res.products || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load produce listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedLocality, inStockOnly, surplusOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedLocality('');
    setInStockOnly(false);
    setSurplusOnly(false);
    setMaxPrice('');
  };

  const handleToggleCompare = (product: Product) => {
    setCompareItems((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 4) {
        alert('You can compare up to 4 produce items at once');
        return prev;
      }
      return [...prev, product];
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Hero Banner with Agricultural Warmth */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-stone-100 rounded-3xl p-6 sm:p-8 border border-emerald-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-700/20 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-emerald-800/80 text-emerald-300 text-xs px-3 py-1 rounded-full font-mono font-medium border border-emerald-700/60">
            <span>హైదరాబాద్ రైతు మార్కెట్ • Direct From Mandals</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-stone-50 leading-tight">
            Fresh Local Harvests, Direct From Telangana Growers
          </h1>
          <p className="text-sm text-stone-300 leading-relaxed">
            Eliminate commission agents. Order country vegetables, freshly picked leafy greens, single-estate grains, and seasonal fruits for direct farm gate pickup.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {user?.role === 'farmer' && (
              <button
                onClick={onOpenCreateProduct}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                Publish New Harvest
              </button>
            )}
            <span className="text-xs text-stone-400">
              Pickup points active across Shamshabad, Chevella, Ibrahimpatnam &amp; Medchal
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-4">
        {/* Search Row */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search produce name, farmer name, or locality (e.g. Tomato, Palak, Shamshabad)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-stone-300 rounded-xl focus:outline-none focus:border-emerald-700 text-stone-900 bg-stone-50/50"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors shrink-0 shadow-xs"
          >
            Search
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-emerald-850 text-emerald-100 shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Locality dropdown */}
            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-2.5 py-1.5 rounded-lg">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <select
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
                className="bg-transparent text-stone-800 font-medium focus:outline-none cursor-pointer"
              >
                <option value="">All Localities</option>
                {POPULAR_LOCALITIES.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* In-Stock Toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-stone-700 font-medium select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded text-emerald-700 focus:ring-0 w-3.5 h-3.5"
              />
              <span>In-Stock Only</span>
            </label>

            {/* Surplus Toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-amber-900 font-semibold select-none bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              <input
                type="checkbox"
                checked={surplusOnly}
                onChange={(e) => setSurplusOnly(e.target.checked)}
                className="rounded text-amber-600 focus:ring-0 w-3.5 h-3.5"
              />
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Surplus Deals</span>
            </label>

            {/* Max Price Filter */}
            <div className="flex items-center gap-1.5 text-stone-600">
              <span>Max ₹:</span>
              <input
                type="number"
                placeholder="₹ Any"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                onBlur={fetchProducts}
                className="w-20 px-2 py-1 bg-stone-50 border border-stone-200 rounded text-stone-900"
              />
            </div>
          </div>

          {(search || selectedCategory || selectedLocality || inStockOnly || surplusOnly || maxPrice) && (
            <button
              onClick={resetFilters}
              className="text-stone-500 hover:text-stone-800 flex items-center gap-1 font-medium underline"
            >
              <RotateCcw className="w-3 h-3" />
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Listings Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold text-stone-900">
            Available Harvests ({products.length})
          </h2>
          <span className="text-xs text-stone-500">
            Prices direct from grower • Updated daily
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-stone-500 font-medium">Fetching verified produce listings...</p>
          </div>
        ) : error ? (
          <div className="py-12 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-xs text-red-900">
            <p className="font-bold mb-1">Could not load marketplace listings</p>
            <p className="text-stone-600 mb-3">{error}</p>
            <button
              onClick={fetchProducts}
              className="px-4 py-1.5 bg-red-700 text-white rounded-lg font-semibold"
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center bg-stone-50 rounded-2xl border border-stone-200 p-8 space-y-3">
            <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="font-serif font-bold text-stone-800 text-base">No harvests matching criteria</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Try adjusting your category, locality, or search keyword to see nearby farmer listings.
            </p>
            <button
              onClick={resetFilters}
              className="text-xs text-emerald-800 font-bold underline"
            >
              View all listings
            </button>
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
                isComparing={compareItems.some((item) => item.id === p.id)}
                onToggleCompare={handleToggleCompare}
              />
            ))}
          </div>
        )}
      </div>

      {/* Comparison Drawer */}
      <ComparisonDrawer
        products={compareItems}
        onRemove={(id) => setCompareItems((prev) => prev.filter((p) => p.id !== id))}
        onClear={() => setCompareItems([])}
        onSelectProduct={onSelectProduct}
      />
    </div>
  );
};
