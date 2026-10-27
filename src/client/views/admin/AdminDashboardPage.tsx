import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { ListingReport, ModerationAction, AdminPlatformStats, AdminUserRow, AdminActivityItem, Product } from '../../../shared/types';
import { apiFetch } from '../../api';
import { formatInrPaise, formatDateTimeKolkata, formatDateKolkata } from '../../utils';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Package,
  Flag,
  Activity,
  BarChart3,
  Search,
  Filter,
  Eye,
  EyeOff,
  XCircle,
  CheckCircle,
  RefreshCw,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';

interface AdminDashboardPageProps {
  currentSubpath?: string;
  onNavigate: (path: string) => void;
  onSelectProduct?: (product: Product) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  currentSubpath = 'overview',
  onNavigate,
  onSelectProduct,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'reports' | 'users' | 'activity'>(
    (currentSubpath as any) || 'overview'
  );

  useEffect(() => {
    if (['overview', 'listings', 'reports', 'users', 'activity'].includes(currentSubpath)) {
      setActiveTab(currentSubpath as any);
    }
  }, [currentSubpath]);

  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [reports, setReports] = useState<ListingReport[]>([]);
  const [usersList, setUsersList] = useState<AdminUserRow[]>([]);
  const [activityLogs, setActivityLogs] = useState<AdminActivityItem[]>([]);
  const [listings, setListings] = useState<Product[]>([]);
  const [listingStatusFilter, setListingStatusFilter] = useState<'all' | 'active' | 'hidden' | 'rejected'>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Moderation prompt modal
  const [actingProduct, setActingProduct] = useState<Product | null>(null);
  const [actionType, setActionType] = useState<'hide' | 'restore' | 'reject'>('hide');
  const [actionReason, setActionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [statsRes, reportsRes, usersRes, activityRes, listingsRes] = await Promise.all([
        apiFetch('/api/admin/stats'),
        apiFetch('/api/admin/moderation/reports'),
        apiFetch(`/api/admin/users?role=${userRoleFilter === 'all' ? '' : userRoleFilter}&search=${encodeURIComponent(userSearchTerm)}`),
        apiFetch('/api/admin/activity'),
        apiFetch(`/api/admin/listings?status=${listingStatusFilter === 'all' ? '' : listingStatusFilter}`),
      ]);

      setStats(statsRes.stats || null);
      setReports(reportsRes.reports || []);
      setUsersList(usersRes.users || []);
      setActivityLogs(activityRes.activities || []);
      setListings(listingsRes.products || []);
    } catch (err: any) {
      setActionError(err.message || 'Failed to load administrative data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userRoleFilter, listingStatusFilter]);

  const handleModerationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actingProduct || !actionReason.trim()) return;

    setSubmittingAction(true);
    setActionError(null);
    try {
      await apiFetch('/api/admin/moderation/action', {
        method: 'POST',
        body: JSON.stringify({
          productId: actingProduct.id,
          action: actionType,
          reason: actionReason.trim(),
        }),
      });

      setSuccessNotice(`Listing "${actingProduct.name}" status updated to ${actionType.toUpperCase()}`);
      setTimeout(() => setSuccessNotice(null), 4000);
      setActingProduct(null);
      setActionReason('');
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Moderation action failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  const navItems = [
    { id: 'overview', label: t('admin.overview'), path: '/admin/dashboard', icon: BarChart3 },
    { id: 'listings', label: t('admin.listings'), path: '/admin/listings', icon: Package, badge: stats?.hiddenListingsCount },
    { id: 'reports', label: t('admin.reports'), path: '/admin/reports', icon: Flag, badge: reports.filter(r => r.status === 'pending').length },
    { id: 'users', label: t('admin.users'), path: '/admin/users', icon: Users, badge: stats ? stats.totalFarmers + stats.totalBuyers : undefined },
    { id: 'activity', label: t('admin.activity'), path: '/admin/activity', icon: Activity },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Official Admin Banner */}
      <div className="bg-slate-900 text-stone-100 rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>{t('admin.badge')} &bull; Platform Overseer</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            {t('admin.dashboardTitle')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as Administrator: <span className="text-amber-300 font-semibold">{user?.fullName}</span> ({user?.email})
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors border border-slate-700 self-start md:self-auto cursor-pointer"
          title="Refresh metrics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Notifications */}
      {successNotice && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 rounded-xl text-xs font-medium flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="border-b border-stone-200 bg-white rounded-xl p-1.5 shadow-2xs overflow-x-auto">
        <nav className="flex space-x-1 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id as any);
                  onNavigate(item.path);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-amber-300 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-amber-400 text-slate-950' : 'bg-stone-200 text-stone-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs font-medium text-stone-600 block mb-1">
                {t('admin.totalFarmers')}
              </span>
              <div className="text-2xl font-bold font-serif text-stone-900">
                {stats?.totalFarmers || 0}
              </div>
              <span className="text-[11px] text-emerald-800 mt-1 block">Verified rural growers</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs font-medium text-stone-600 block mb-1">
                {t('admin.totalBuyers')}
              </span>
              <div className="text-2xl font-bold font-serif text-stone-900">
                {stats?.totalBuyers || 0}
              </div>
              <span className="text-[11px] text-stone-600 mt-1 block">Households &amp; businesses</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs font-medium text-stone-600 block mb-1">
                {t('admin.totalActiveListings')}
              </span>
              <div className="text-2xl font-bold font-serif text-emerald-800">
                {stats?.totalActiveListings || 0}
              </div>
              <span className="text-[11px] text-stone-600 mt-1 block">Available crops today</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs font-medium text-stone-600 block mb-1">
                {t('admin.totalGrossVolume')}
              </span>
              <div className="text-2xl font-bold font-serif text-stone-900">
                {formatInrPaise(stats?.totalGrossVolumePaise || 0)}
              </div>
              <span className="text-[11px] text-amber-800 mt-1 block">{stats?.totalOrders || 0} total orders</span>
            </div>
          </div>

          {/* Quick Moderation Queue Spotlight */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                <Flag className="w-5 h-5 text-amber-600" />
                <span>Pending User Reports Requiring Review</span>
              </h2>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('reports');
                  onNavigate('/admin/reports');
                }}
                className="text-xs text-slate-800 hover:text-slate-950 font-bold inline-flex items-center gap-1"
              >
                <span>View All Reports</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {reports.filter(r => r.status === 'pending').length === 0 ? (
              <p className="text-xs text-stone-600 py-4 text-center">{t('admin.noReports')}</p>
            ) : (
              <div className="space-y-2">
                {reports.filter(r => r.status === 'pending').slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-stone-900">{r.productName}</div>
                      <div className="text-stone-700 mt-0.5">
                        Reason: <span className="font-semibold capitalize">{r.reason.replace(/_/g, ' ')}</span> &bull; {r.details}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('reports');
                        onNavigate('/admin/reports');
                      }}
                      className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-md font-semibold text-xs"
                    >
                      Investigate
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LISTING MODERATION */}
      {activeTab === 'listings' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <h2 className="font-serif font-bold text-lg text-stone-900">
                {t('admin.listings')} ({listings.length})
              </h2>
              <p className="text-xs text-stone-600">
                Administrative content governance across all registered farmer accounts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-600">Filter Status:</span>
              <select
                value={listingStatusFilter}
                onChange={(e) => setListingStatusFilter(e.target.value as any)}
                className="px-2.5 py-1 text-xs border border-stone-300 rounded-lg bg-stone-50"
              >
                <option value="all">All Listings</option>
                <option value="active">Active Only</option>
                <option value="hidden">Hidden Only</option>
                <option value="rejected">Rejected Only</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-xs">
              <thead className="bg-stone-50 font-semibold text-stone-700">
                <tr>
                  <th className="py-3 px-4 text-left">Produce Name</th>
                  <th className="py-3 px-4 text-left">Farmer / Farm</th>
                  <th className="py-3 px-4 text-left">Price &amp; Locality</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Harvest Date</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {listings.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/70">
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900">{p.name}</div>
                      <div className="text-[11px] text-stone-600">{p.category}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-800">{p.farmerName}</div>
                      <div className="text-[11px] text-stone-600">{p.farmName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-emerald-900">₹{(p.pricePerUnitPaise / 100).toFixed(0)}/{p.unit}</div>
                      <div className="text-[11px] text-stone-600">{p.pickupLocality}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'hidden'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-red-100 text-red-900'
                      }`}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-700">
                      {p.harvestDate}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {p.status === 'active' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActingProduct(p);
                            setActionType('hide');
                          }}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-md font-semibold text-xs"
                        >
                          Hide
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setActingProduct(p);
                            setActionType('restore');
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-md font-semibold text-xs"
                        >
                          Restore
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setActingProduct(p);
                          setActionType('reject');
                        }}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded-md font-semibold text-xs"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USER-REPORTED ITEMS */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
          <h2 className="font-serif font-bold text-lg text-stone-900">
            {t('admin.reports')} ({reports.length})
          </h2>
          {reports.length === 0 ? (
            <p className="text-xs text-stone-600 py-6 text-center">{t('admin.noReports')}</p>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">{r.productName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        r.status === 'pending' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {r.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-stone-700 mt-1">
                      Report Category: <span className="font-semibold capitalize">{r.reason.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-stone-600 mt-0.5">
                      Details: &ldquo;{r.details}&rdquo; &bull; Reporter: {r.reporterName || 'Buyer'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const targetProd = listings.find(p => p.id === r.productId);
                        if (targetProd) {
                          setActingProduct(targetProd);
                          setActionType('hide');
                        }
                      }}
                      className="px-3 py-1.5 bg-red-800 hover:bg-red-900 text-white rounded-lg font-semibold text-xs"
                    >
                      Take Action
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: USER DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <h2 className="font-serif font-bold text-lg text-stone-900">
                {t('admin.users')} ({usersList.length})
              </h2>
              <p className="text-xs text-stone-600">
                Platform directory with verified roles, registration timestamps, and localities.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Search name, email, locality..."
                className="px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-stone-50 w-48"
              />
              <button
                type="button"
                onClick={loadData}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Search
              </button>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg bg-stone-50"
              >
                <option value="all">All Roles</option>
                <option value="farmer">Farmers Only</option>
                <option value="buyer">Buyers Only</option>
                <option value="admin">Administrators Only</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-xs">
              <thead className="bg-stone-50 font-semibold text-stone-700">
                <tr>
                  <th className="py-3 px-4 text-left">Name &amp; Email</th>
                  <th className="py-3 px-4 text-left">Role</th>
                  <th className="py-3 px-4 text-left">Locality</th>
                  <th className="py-3 px-4 text-left">Phone</th>
                  <th className="py-3 px-4 text-left">Registered</th>
                  <th className="py-3 px-4 text-right">Activity Stats</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/70">
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900">{u.fullName}</div>
                      <div className="text-[11px] text-stone-600">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'farmer'
                          ? 'bg-emerald-100 text-emerald-900'
                          : u.role === 'admin'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-blue-100 text-blue-900'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-800">
                      {u.locality || u.villageMandal || 'Hyderabad'}
                    </td>
                    <td className="py-3 px-4 text-stone-600 font-mono text-[11px]">
                      {u.phone}
                    </td>
                    <td className="py-3 px-4 text-stone-600 text-[11px]">
                      {formatDateKolkata(u.createdAt.split('T')[0])}
                    </td>
                    <td className="py-3 px-4 text-right text-stone-700">
                      {u.role === 'farmer' ? `${u.productCount} listings` : `${u.orderCount} orders`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT ACTIVITY LOG */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
          <h2 className="font-serif font-bold text-lg text-stone-900">
            {t('admin.activity')}
          </h2>
          <p className="text-xs text-stone-600">
            Immutable chronological record of registrations, order transitions, and moderation enforcement.
          </p>

          <div className="space-y-2.5">
            {activityLogs.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-bold text-stone-900">{item.title}</div>
                  <div className="text-stone-600 mt-0.5">{item.description}</div>
                  <div className="text-[11px] text-stone-600 mt-0.5">Actor: {item.actorName}</div>
                </div>
                <div className="text-stone-600 font-mono text-[11px]">
                  {formatDateTimeKolkata(item.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Moderation Form Modal */}
      {actingProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-serif font-bold text-lg text-stone-900">
              Moderation Action: {actingProduct.name}
            </h3>
            <div className="text-xs text-stone-600">
              Action: <span className="font-bold uppercase text-stone-900">{actionType}</span>
            </div>

            <form onSubmit={handleModerationSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  {t('admin.reasonPrompt')} *
                </label>
                <textarea
                  required
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter verifiable reason for audit log..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActingProduct(null)}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg text-xs font-bold"
                >
                  {submittingAction ? t('common.loading') : 'Execute Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
