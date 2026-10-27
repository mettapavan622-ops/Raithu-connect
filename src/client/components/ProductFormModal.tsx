import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Camera,
  Calendar,
  MapPin,
  Tag,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { ProduceCategory, ProduceUnit, ListingDraftResult } from '../../shared/types';
import { apiFetch } from '../api';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenAiAssistant: () => void;
  initialDraft?: ListingDraftResult | null;
  defaultLocality?: string;
}

const PRESET_PHOTOS = [
  { label: 'Tomatoes', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80' },
  { label: 'Purple Brinjal', url: 'https://images.unsplash.com/photo-1628773822503-930a84d9f1c7?w=800&auto=format&fit=crop&q=80' },
  { label: 'Fresh Palak', url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&auto=format&fit=crop&q=80' },
  { label: 'Desi Methi', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80' },
  { label: 'Tender Bhendi', url: 'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=800&auto=format&fit=crop&q=80' },
  { label: 'Taiwan Guava', url: 'https://images.unsplash.com/photo-1536511135898-05995589e5a1?w=800&auto=format&fit=crop&q=80' },
  { label: 'Sweet Papaya', url: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=800&auto=format&fit=crop&q=80' },
  { label: 'Sona Masoori Rice', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80' },
  { label: 'Red Onions', url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800&auto=format&fit=crop&q=80' },
  { label: 'Green Chillies', url: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800&auto=format&fit=crop&q=80' },
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenAiAssistant,
  initialDraft,
  defaultLocality = 'Shamshabad Mandal',
}) => {
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const [name, setName] = useState(initialDraft?.productName || '');
  const [category, setCategory] = useState<ProduceCategory>(initialDraft?.category || 'vegetables');
  const [unit, setUnit] = useState<ProduceUnit>(initialDraft?.unit || 'kg');

  // For kg: display in kg (e.g. 50 kg)
  // For bunch/piece: display whole integer
  const initialQtyDisplay = initialDraft?.quantity
    ? initialDraft.unit === 'kg'
      ? (initialDraft.quantity / 1000).toString()
      : initialDraft.quantity.toString()
    : '20';
  const [quantityInput, setQuantityInput] = useState(initialQtyDisplay);

  const [priceRupees, setPriceRupees] = useState<string>(
    initialDraft?.pricePerUnit ? initialDraft.pricePerUnit.toString() : '40'
  );

  const [harvestDate, setHarvestDate] = useState(initialDraft?.harvestDate || todayStr);
  const [availabilityDate, setAvailabilityDate] = useState(initialDraft?.availabilityDate || todayStr);
  const [pickupLocality, setPickupLocality] = useState(initialDraft?.pickupLocality || defaultLocality);
  const [pickupNotes, setPickupNotes] = useState('Farm gate pickup between 7:00 AM and 1:00 PM.');
  const [description, setDescription] = useState(initialDraft?.description || '');

  // Surplus State
  const [isSurplus, setIsSurplus] = useState(initialDraft?.isSurplus || false);
  const [surplusDiscountPct, setSurplusDiscountPct] = useState(initialDraft?.surplusDiscountPct || 20);
  const [surplusDeadline, setSurplusDeadline] = useState(
    new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );

  // Harvest Passport Traceability
  const [lotNumber, setLotNumber] = useState(`LOT-${todayStr.slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [fieldLocation, setFieldLocation] = useState(defaultLocality);
  const [harvestNotes, setHarvestNotes] = useState('Harvested at morning dew break.');

  // Image
  const [imageUrl, setImageUrl] = useState(PRESET_PHOTOS[0].url);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync draft updates if changed externally
  React.useEffect(() => {
    if (initialDraft) {
      if (initialDraft.productName) setName(initialDraft.productName);
      if (initialDraft.category) setCategory(initialDraft.category);
      if (initialDraft.unit) setUnit(initialDraft.unit);
      if (initialDraft.quantity) {
        setQuantityInput(
          initialDraft.unit === 'kg'
            ? (initialDraft.quantity / 1000).toString()
            : initialDraft.quantity.toString()
        );
      }
      if (initialDraft.pricePerUnit) setPriceRupees(initialDraft.pricePerUnit.toString());
      if (initialDraft.harvestDate) setHarvestDate(initialDraft.harvestDate);
      if (initialDraft.availabilityDate) setAvailabilityDate(initialDraft.availabilityDate);
      if (initialDraft.pickupLocality) setPickupLocality(initialDraft.pickupLocality);
      if (initialDraft.description) setDescription(initialDraft.description);
      if (initialDraft.isSurplus) setIsSurplus(true);
      if (initialDraft.surplusDiscountPct) setSurplusDiscountPct(initialDraft.surplusDiscountPct);
    }
  }, [initialDraft]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const priceNum = parseFloat(priceRupees);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMessage('Please enter a valid positive price');
      return;
    }

    const qtyNum = parseFloat(quantityInput);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setErrorMessage('Please enter a valid positive quantity');
      return;
    }

    // Convert display quantity to integer base quantity:
    // for kg: convert kg to grams (e.g. 50 kg -> 50000 grams)
    // for piece/bunch: must be integer
    let onHandQuantity = 0;
    if (unit === 'kg') {
      onHandQuantity = Math.round(qtyNum * 1000);
      if (onHandQuantity <= 0) {
        setErrorMessage('Minimum quantity for kg listings is 100g (0.1 kg)');
        return;
      }
    } else {
      if (!Number.isInteger(qtyNum)) {
        setErrorMessage(`Quantity for ${unit} must be a whole number`);
        return;
      }
      onHandQuantity = qtyNum;
    }

    setSubmitting(true);

    try {
      await apiFetch('/api/farmer/products', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          category,
          unit,
          pricePerUnitRupees: priceNum,
          onHandQuantity,
          harvestDate,
          availabilityDate,
          pickupLocality: pickupLocality.trim(),
          pickupNotes: pickupNotes.trim(),
          description: description.trim(),
          isSurplus,
          surplusDiscountPct: isSurplus ? surplusDiscountPct : 0,
          surplusDeadline: isSurplus ? new Date(surplusDeadline).toISOString() : null,
          imageUrl,
          lotNumber,
          fieldLocation,
          harvestNotes,
        }),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to publish produce listing.');
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
            <Tag className="w-5 h-5 text-emerald-400" />
            <h3 className="font-serif text-lg font-bold">
              Publish Produce Harvest
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-emerald-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto space-y-5 text-xs">
          {/* AI Assistant Banner */}
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="font-semibold text-amber-950">
                Want to speak or dictate in Telugu/Hindi?
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenAiAssistant}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-stone-950 font-bold rounded-lg transition-colors text-[11px]"
            >
              Use AI Assistant
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Basic Details */}
          <div className="space-y-3">
            <div>
              <label className="font-bold text-stone-800 block mb-1">Produce Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Country Tomatoes (Naatu Tomato)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-stone-800 block mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
                >
                  <option value="vegetables">Vegetables</option>
                  <option value="fruits">Fruits</option>
                  <option value="leafy_greens">Leafy Greens</option>
                  <option value="grains">Grains &amp; Pulses</option>
                  <option value="spices_and_others">Spices &amp; Others</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">Measurement Unit *</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
                >
                  <option value="kg">kg (Kilogram)</option>
                  <option value="bunch">bunch (Katta)</option>
                  <option value="piece">piece (Kaya / Unit)</option>
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="font-bold text-stone-800 block mb-1">
                  Price in ₹ (per {unit}) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  value={priceRupees}
                  onChange={(e) => setPriceRupees(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  Available Quantity ({unit === 'kg' ? 'in kg' : `whole ${unit}s`}) *
                </label>
                <input
                  type="number"
                  step={unit === 'kg' ? '0.5' : '1'}
                  min="0.5"
                  required
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
                />
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">Harvest Date *</label>
                <input
                  type="date"
                  required
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
                />
              </div>
            </div>
          </div>

          {/* Pickup & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-200">
            <div>
              <label className="font-bold text-stone-800 block mb-1">Ready for Pickup Date *</label>
              <input
                type="date"
                required
                value={availabilityDate}
                onChange={(e) => setAvailabilityDate(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
              />
            </div>

            <div>
              <label className="font-bold text-stone-800 block mb-1">Pickup Locality (Mandal/Village) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Shamshabad Mandal, Near Airport"
                value={pickupLocality}
                onChange={(e) => setPickupLocality(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-800 block mb-1">Pickup Notes &amp; Timings</label>
            <input
              type="text"
              placeholder="e.g. Farm gate pickup between 7 AM and 1 PM. Bring your own bags."
              value={pickupNotes}
              onChange={(e) => setPickupNotes(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
            />
          </div>

          <div>
            <label className="font-bold text-stone-800 block mb-1">Produce Description</label>
            <textarea
              rows={2}
              placeholder="Brief description of the harvest, taste, variety..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
            />
          </div>

          {/* Photo Selector */}
          <div className="pt-2 border-t border-stone-200">
            <label className="font-bold text-stone-800 block mb-1">Produce Photograph *</label>
            <div className="flex gap-2 items-center mb-2">
              <input
                type="url"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-stone-300 rounded-lg text-stone-900"
                placeholder="https://..."
              />
              <img
                src={imageUrl}
                alt="Preview"
                className="w-10 h-10 object-cover rounded border border-stone-300"
              />
            </div>

            <div>
              <span className="text-[10px] text-stone-500 uppercase font-semibold block mb-1">
                Select Authentic Produce Preset Photo:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_PHOTOS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setImageUrl(p.url)}
                    className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                      imageUrl === p.url
                        ? 'bg-emerald-700 text-white border-emerald-800'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Surplus Corner Option */}
          <div className="pt-3 border-t border-stone-200 p-3 bg-amber-50/60 rounded-xl border border-amber-200">
            <label className="flex items-center gap-2 font-bold text-amber-950 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={isSurplus}
                onChange={(e) => setIsSurplus(e.target.checked)}
                className="rounded text-amber-600 focus:ring-0 w-4 h-4"
              />
              <span>Mark this harvest as "Surplus Corner" excess stock</span>
            </label>

            {isSurplus && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="font-semibold text-amber-900 block mb-1">Discount %</label>
                  <input
                    type="number"
                    min="5"
                    max="80"
                    value={surplusDiscountPct}
                    onChange={(e) => setSurplusDiscountPct(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-stone-900 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-amber-900 block mb-1">Sale Deadline</label>
                  <input
                    type="datetime-local"
                    value={surplusDeadline}
                    onChange={(e) => setSurplusDeadline(e.target.value)}
                    className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-stone-900 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Harvest Passport Traceability Section */}
          <div className="pt-3 border-t border-stone-200 space-y-3">
            <div className="flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-700" />
              <span className="font-bold text-stone-900 font-serif">
                Harvest Passport™ Traceability Details
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Lot / Batch Number</label>
                <input
                  type="text"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-stone-900"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Field / Polam Location</label>
                <input
                  type="text"
                  value={fieldLocation}
                  onChange={(e) => setFieldLocation(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Harvest Notes</label>
              <input
                type="text"
                placeholder="e.g. Handpicked at sunrise; irrigated with clean canal water."
                value={harvestNotes}
                onChange={(e) => setHarvestNotes(e.target.value)}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-stone-900"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-100 font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white font-bold rounded-lg shadow-sm"
            >
              {submitting ? 'Publishing Listing...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
