import React, { useEffect, useState } from 'react';
import { X, MapPin, Phone, Tractor, CheckCircle, Package } from 'lucide-react';
import { Product, FarmerProfile } from '../../shared/types';
import { apiFetch } from '../api';
import { ProductCard } from './ProductCard';

interface FarmerProfileModalProps {
  farmerId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export const FarmerProfileModal: React.FC<FarmerProfileModalProps> = ({
  farmerId,
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const [data, setData] = useState<{ farmer: any; profile: FarmerProfile | null; products: Product[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (farmerId && isOpen) {
      setLoading(true);
      apiFetch(`/api/farmers/${farmerId}/profile`)
        .then((res) => setData(res))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }
  }, [farmerId, isOpen]);

  if (!isOpen || !farmerId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-emerald-950 text-stone-100 px-6 py-4 flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2">
            <Tractor className="w-5 h-5 text-emerald-400" />
            <h3 className="font-serif text-lg font-bold">
              Farmer Profile &amp; Direct Harvests
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-emerald-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 text-center text-stone-500 text-sm">
              Loading farmer profile...
            </div>
          ) : !data ? (
            <div className="py-12 text-center text-stone-500 text-sm">
              Farmer profile not found.
            </div>
          ) : (
            <>
              {/* Profile Bio Card */}
              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 flex flex-col md:flex-row gap-6 items-start">
                <div className="w-16 h-16 rounded-2xl bg-emerald-800 text-emerald-100 flex items-center justify-center font-serif text-2xl font-bold shrink-0 shadow-md">
                  {data.farmer.fullName.slice(0, 2)}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-serif text-2xl font-bold text-stone-900">
                      {data.farmer.fullName}
                    </h4>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full border border-emerald-300">
                      Registered Local Grower
                    </span>
                  </div>

                  {data.profile?.farmName && (
                    <p className="text-sm font-semibold text-emerald-900">
                      🏡 {data.profile.farmName}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-stone-600 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      {data.profile?.villageMandal || 'Telangana'}, {data.profile?.district || 'Ranga Reddy'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-700" />
                      {data.farmer.phone} (Pickup Coordinator)
                    </span>
                  </div>

                  {data.profile?.bio && (
                    <p className="text-xs text-stone-700 leading-relaxed pt-2 border-t border-stone-200">
                      {data.profile.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Active Harvest Listings by this Farmer */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-800" />
                    Available Harvests from {data.farmer.fullName} ({data.products.length})
                  </h5>
                  <span className="text-xs text-stone-500">Pick up at farm location</span>
                </div>

                {data.products.length === 0 ? (
                  <p className="text-xs text-stone-500 py-6 text-center">
                    No active produce listings at this moment.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {data.products.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        onSelect={(prod) => {
                          onClose();
                          onSelectProduct(prod);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
