import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Flag,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  RefreshCw
} from 'lucide-react';
import { ListingReport, ModerationAction } from '../../shared/types';
import { apiFetch } from '../api';
import { formatDateTimeKolkata } from '../utils';

export const AdminModerationView: React.FC = () => {
  const [reports, setReports] = useState<ListingReport[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [auditTrail, setAuditTrail] = useState<ModerationAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  // Action form state
  const [actingProductId, setActingProductId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'hide' | 'restore' | 'reject'>('hide');
  const [actionReason, setActionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadModerationData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [repRes, dupRes, audRes] = await Promise.all([
        apiFetch('/api/admin/moderation/reports'),
        apiFetch('/api/admin/moderation/duplicates'),
        apiFetch('/api/admin/moderation/audit'),
      ]);

      setReports(repRes.reports || []);
      setDuplicates(dupRes.duplicates || []);
      setAuditTrail(audRes.auditTrail || []);
    } catch (err: any) {
      setActionError(err.message || 'Failed to load moderation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModerationData();
  }, []);

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actingProductId) return;

    setSubmittingAction(true);
    setActionError(null);

    try {
      await apiFetch('/api/admin/moderation/action', {
        method: 'POST',
        body: JSON.stringify({
          productId: actingProductId,
          action: actionType,
          reason: actionReason.trim(),
        }),
      });

      setActingProductId(null);
      setActionReason('');
      await loadModerationData();
    } catch (err: any) {
      setActionError(err.message || 'Moderation action failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="bg-red-950 text-stone-100 rounded-2xl p-6 border border-red-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-red-400 font-mono text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Administrative Moderation &amp; Market Integrity</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-50">
            Marketplace Moderation Dashboard
          </h1>
          <p className="text-xs text-stone-300">
            Audit user reports, investigate suspected duplicate listings, and moderate marketplace content with full traceability.
          </p>
        </div>

        <button
          onClick={loadModerationData}
          className="p-2.5 bg-red-900 hover:bg-red-800 text-stone-200 rounded-xl transition-colors border border-red-700/50 self-start sm:self-auto"
          title="Refresh moderation queue"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Grid: Reports & Potential Duplicates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Listing Reports Queue */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
              <Flag className="w-4 h-4 text-red-600" />
              Listing Reports Queue ({reports.filter((r) => r.status === 'pending').length} pending)
            </h3>
            <span className="text-[11px] text-stone-400">User flagged items</span>
          </div>

          {loading ? (
            <p className="text-xs text-stone-500 py-8 text-center">Loading reports...</p>
          ) : reports.length === 0 ? (
            <p className="text-xs text-stone-500 py-8 text-center">No reports filed.</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {reports.map((r) => (
                <div key={r.id} className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-stone-900 text-sm block">{r.productName}</span>
                      <span className="text-[11px] text-stone-500">
                        Farmer: {r.farmerName} • Reported by: {r.reporterName}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      r.status === 'pending' ? 'bg-amber-100 text-amber-900' : 'bg-stone-200 text-stone-700'
                    }`}>
                      {r.status}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-stone-100">
                    <span className="font-semibold text-stone-800 block text-[11px] capitalize">
                      Reason: {r.reason.replace(/_/g, ' ')}
                    </span>
                    <p className="text-stone-600 italic mt-0.5">{r.details}</p>
                  </div>

                  {r.status === 'pending' && (
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => {
                          setActingProductId(r.productId);
                          setActionType('hide');
                        }}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-[11px]"
                      >
                        Hide Listing
                      </button>
                      <button
                        onClick={() => {
                          setActingProductId(r.productId);
                          setActionType('reject');
                        }}
                        className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white font-semibold rounded text-[11px]"
                      >
                        Reject Listing
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Potential Duplicate Listings for Human Review */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
              <Copy className="w-4 h-4 text-amber-600" />
              Suspected Duplicates (Human Review Only)
            </h3>
            <span className="text-[11px] text-stone-400">Algorithmic suggestion</span>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <strong>Human Oversight Guarantee:</strong> Listings are never automatically deleted based on AI/heuristics. An administrator must inspect suspected duplicates and make the final decision.
          </div>

          {loading ? (
            <p className="text-xs text-stone-500 py-8 text-center">Checking for duplicate listings...</p>
          ) : duplicates.length === 0 ? (
            <p className="text-xs text-stone-500 py-8 text-center">
              No potential duplicate listings identified across active records.
            </p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto">
              {duplicates.map((d, idx) => (
                <div key={idx} className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
                  <span className="font-bold text-stone-900 block">
                    Same Farmer &amp; Matching Produce Name:
                  </span>
                  <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-stone-200">
                    <div>
                      <span className="text-[10px] text-stone-400 block font-bold">Listing A</span>
                      <div className="font-semibold text-stone-900">{d.name1}</div>
                      <div className="text-[11px] text-stone-500">ID: {d.id1.slice(0, 8)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block font-bold">Listing B</span>
                      <div className="font-semibold text-stone-900">{d.name2}</div>
                      <div className="text-[11px] text-stone-500">ID: {d.id2.slice(0, 8)}</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-600">
                    Farmer: <span className="font-semibold">{d.farmer_name1}</span> • Locality: {d.locality1}
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => {
                        setActingProductId(d.id2);
                        setActionType('hide');
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-[11px]"
                    >
                      Hide Duplicate (Listing B)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Dialog / Modal if an item is selected */}
      {actingProductId && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h4 className="font-serif font-bold text-stone-900 text-base">
              Execute Moderation Action (Product ID: {actingProductId.slice(0, 10)})
            </h4>

            <form onSubmit={handleExecuteAction} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-800 block mb-1">Action Type</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
                >
                  <option value="hide">Hide (Blocks new orders; existing orders accessible)</option>
                  <option value="reject">Reject (Marks permanently rejected)</option>
                  <option value="restore">Restore (Re-activate to marketplace)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">Action Reason (Required for Audit Trail) *</label>
                <textarea
                  rows={3}
                  required
                  minLength={3}
                  placeholder="State the administrative justification..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setActingProductId(null); setActionReason(''); }}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg"
                >
                  {submittingAction ? 'Recording...' : 'Apply Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Moderation Audit Trail Table */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
        <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
          <FileText className="w-4 h-4 text-stone-700" />
          Official Moderation Audit Trail (Immutable Log)
        </h3>

        {auditTrail.length === 0 ? (
          <p className="text-xs text-stone-500 py-6 text-center">No moderation actions logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-stone-800">
              <thead className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3">Admin Officer</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {auditTrail.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-stone-50">
                    <td className="py-2.5 px-3 text-stone-500 font-mono">
                      {formatDateTimeKolkata(entry.createdAt)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-stone-900">
                      {entry.productName}
                    </td>
                    <td className="py-2.5 px-3 text-stone-700">
                      {entry.adminName}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        entry.action === 'hide' ? 'bg-amber-100 text-amber-900' :
                        entry.action === 'reject' ? 'bg-red-100 text-red-900' :
                        'bg-emerald-100 text-emerald-900'
                      }`}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-stone-600">
                      {entry.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
