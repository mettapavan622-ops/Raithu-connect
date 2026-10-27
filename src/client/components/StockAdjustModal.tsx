import React, { useState } from 'react';
import { X, Package, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Product } from '../../shared/types';
import { formatUnitQuantity } from '../utils';
import { apiFetch } from '../api';

interface StockAdjustModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !product) return null;

  const isKg = product.unit === 'kg';
  // For kg: display in kg
  const initialDisplay = isKg
    ? (product.onHandQuantity / 1000).toString()
    : product.onHandQuantity.toString();

  const [quantityInput, setQuantityInput] = useState(initialDisplay);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const minAllowedDisplay = isKg
    ? product.reservedQuantity / 1000
    : product.reservedQuantity;

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const val = parseFloat(quantityInput);
    if (isNaN(val) || val < 0) {
      setErrorMessage('Please enter a valid non-negative quantity');
      return;
    }

    let newOnHand = 0;
    if (isKg) {
      newOnHand = Math.round(val * 1000);
    } else {
      if (!Number.isInteger(val)) {
        setErrorMessage(`Quantities for ${product.unit} must be whole integers`);
        return;
      }
      newOnHand = val;
    }

    // Invariant check
    if (newOnHand < product.reservedQuantity) {
      setErrorMessage(
        `Cannot reduce stock to ${formatUnitQuantity(newOnHand, product.unit)}. You currently have ${formatUnitQuantity(product.reservedQuantity, product.unit)} committed to pending buyer orders.`
      );
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch(`/api/farmer/products/${product.id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ newOnHandQuantity: newOnHand }),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to adjust inventory stock.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-emerald-950 text-stone-100 px-6 py-4 flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <h3 className="font-serif text-base font-bold">
              Adjust Physical On-Hand Stock
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-emerald-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAdjust} className="p-6 space-y-4 text-xs">
          <div>
            <h4 className="font-serif font-bold text-stone-900 text-sm mb-1">{product.name}</h4>
            <div className="text-stone-500">
              Unit: <span className="font-semibold text-stone-700">{product.unit}</span>
            </div>
          </div>

          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-stone-500">Current On-Hand Stock:</span>
              <span className="font-bold text-stone-900">{formatUnitQuantity(product.onHandQuantity, product.unit)}</span>
            </div>
            <div className="flex justify-between text-amber-900">
              <span className="font-medium">Committed Active Reservations:</span>
              <span className="font-bold">{formatUnitQuantity(product.reservedQuantity, product.unit)}</span>
            </div>
            <div className="flex justify-between text-emerald-800 pt-1 border-t border-stone-200">
              <span className="font-medium">Current Available Stock:</span>
              <span className="font-bold">{formatUnitQuantity(product.availableQuantity, product.unit)}</span>
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-800 block mb-1">
              New On-Hand Stock ({isKg ? 'in kg' : `whole ${product.unit}s`})
            </label>
            <input
              type="number"
              step={isKg ? '0.5' : '1'}
              min={minAllowedDisplay}
              required
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 font-semibold text-sm"
            />
            <p className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              Minimum allowed is {formatUnitQuantity(product.reservedQuantity, product.unit)} to safeguard existing reserved orders.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white font-bold rounded-lg shadow-sm"
            >
              {submitting ? 'Updating...' : 'Save Stock Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
