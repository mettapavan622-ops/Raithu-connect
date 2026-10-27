import React, { useState } from 'react';
import { X, Flag, AlertTriangle, CheckCircle } from 'lucide-react';
import { Product } from '../../shared/types';
import { apiFetch } from '../api';

interface ReportListingModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportListingModal: React.FC<ReportListingModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const [reason, setReason] = useState<string>('duplicate_listing');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          reason,
          details: details.trim(),
        }),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit report. Please try again.');
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
        <div className="bg-red-950 text-stone-100 px-6 py-4 flex items-center justify-between border-b border-red-900">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-400" />
            <h3 className="font-serif text-base font-bold">
              Report Listing for Moderation
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-red-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-stone-900 text-sm">Report Submitted</h4>
            <p className="text-xs text-stone-500">
              Thank you. Marketplace officers will inspect this listing and audit records.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            <div>
              <span className="text-stone-500 block mb-0.5">Reporting Item:</span>
              <div className="font-serif font-bold text-stone-900 text-sm">{product.name}</div>
              <div className="text-[11px] text-stone-500">by {product.farmerName}</div>
            </div>

            <div>
              <label className="font-bold text-stone-800 block mb-1">Reason for Report *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
              >
                <option value="duplicate_listing">Possible Duplicate Listing</option>
                <option value="incorrect_pricing_or_unit">Incorrect Pricing or Incompatible Unit</option>
                <option value="misleading_harvest_info">Misleading Harvest Date or Locality</option>
                <option value="inappropriate_content">Inappropriate Content or Spurious Product</option>
                <option value="other">Other Concerns</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-800 block mb-1">Specific Details *</label>
              <textarea
                rows={3}
                required
                minLength={5}
                placeholder="Explain what is incorrect or duplicate about this listing..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
              />
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
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
                className="px-5 py-2 bg-red-700 hover:bg-red-800 disabled:bg-stone-300 text-white font-bold rounded-lg shadow-sm"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
