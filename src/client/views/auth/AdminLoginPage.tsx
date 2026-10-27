import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { LanguageSelector } from '../../components/LanguageSelector';
import { ShieldAlert, ShieldCheck, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface AdminLoginPageProps {
  onNavigate: (path: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { adminLogin, demoLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage(t('validation.requiredField'));
      return;
    }

    setLoading(true);
    try {
      await adminLogin(email.trim(), password);
      onNavigate('/admin/dashboard');
    } catch (err: any) {
      if (err.data?.error === 'ADMIN_ACCESS_REQUIRED') {
        setErrorMessage(t('auth.adminAccessDenied'));
      } else {
        setErrorMessage(t('auth.invalidCredentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdminDemo = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await demoLogin('admin');
      onNavigate('/admin/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo admin sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-950 text-stone-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-lg mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
            {t('auth.adminLoginTitle')}
          </h1>
          <p className="mt-1 text-xs text-slate-400 font-medium">
            {t('auth.adminLoginSubtitle')}
          </p>
        </div>

        <div className="mt-4 flex justify-center">
          <LanguageSelector variant="inline" className="bg-slate-900 border-slate-800 text-slate-200" />
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900 py-8 px-6 shadow-xl rounded-2xl border border-slate-800 sm:px-8">
          <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>{t('auth.adminPortalNotice')}</span>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('auth.email')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@raithuconnect.telangana.gov"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-700 bg-slate-950 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder:text-slate-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  {t('auth.password')}
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? t('auth.hidePassword') : t('auth.showPassword')}</span>
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-700 bg-slate-950 text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder:text-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? t('common.loading') : t('auth.submitAdminLogin')}</span>
            </button>
          </form>

          {/* Quick Demo Admin Button */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={handleAdminDemo}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Instant Admin Demo Login (Dr. K. Ramana)</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => onNavigate('/marketplace')}
              className="text-slate-400 hover:text-slate-200 text-xs inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('auth.backToMarketplace')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
