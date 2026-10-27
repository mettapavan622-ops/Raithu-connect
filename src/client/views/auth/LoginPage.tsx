import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { LanguageSelector } from '../../components/LanguageSelector';
import { Sprout, Eye, EyeOff, ShieldCheck, ShoppingBag, UserCheck, AlertTriangle, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (path: string) => void;
  initialRole?: 'buyer' | 'farmer';
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, initialRole = 'buyer' }) => {
  const { t } = useTranslation();
  const { login, demoLogin } = useAuth();

  const [selectedRole, setSelectedRole] = useState<'buyer' | 'farmer'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mismatchData, setMismatchData] = useState<{ actualRole: string; expectedRole: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setMismatchData(null);

    if (!email.trim() || !password) {
      setErrorMessage(t('validation.requiredField'));
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password, selectedRole);
      // Success: Navigate to role dashboard
      if (selectedRole === 'farmer') {
        onNavigate('/farmer/dashboard');
      } else {
        onNavigate('/buyer/dashboard');
      }
    } catch (err: any) {
      if (err.data?.error === 'ACCOUNT_ROLE_MISMATCH') {
        setMismatchData({
          actualRole: err.data.actualRole,
          expectedRole: err.data.expectedRole,
        });
      } else if (err.data?.error === 'TOO_MANY_ATTEMPTS') {
        setErrorMessage(err.data.message || 'Too many failed login attempts. Please wait 1 minute.');
      } else {
        setErrorMessage(t('auth.invalidCredentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchRole = (actualRole: string) => {
    if (actualRole === 'farmer' || actualRole === 'buyer') {
      setSelectedRole(actualRole);
      setMismatchData(null);
      setErrorMessage(null);
    } else if (actualRole === 'admin') {
      onNavigate('/admin/login');
    }
  };

  const handleQuickDemo = async (role: 'farmer' | 'buyer') => {
    setLoading(true);
    setErrorMessage(null);
    setMismatchData(null);
    try {
      await demoLogin(role);
      if (role === 'farmer') {
        onNavigate('/farmer/dashboard');
      } else {
        onNavigate('/buyer/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in with demo profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-stone-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* App Logo & Intro */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-800 text-amber-300 shadow-md mb-3">
            <Sprout className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-emerald-950">
            {t('common.appName')}
          </h1>
          <p className="mt-1 text-sm text-stone-600 font-medium">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        {/* Language selector in card top */}
        <div className="mt-4 flex justify-center">
          <LanguageSelector variant="inline" />
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-stone-200 sm:px-8">
          {/* Account-Type Selection Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
              {t('auth.roleSelectorPrompt')}
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('buyer');
                  setMismatchData(null);
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                  selectedRole === 'buyer'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{t('auth.buyerRole')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('farmer');
                  setMismatchData(null);
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                  selectedRole === 'farmer'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <Sprout className="w-4 h-4" />
                <span>{t('auth.farmerRole')}</span>
              </button>
            </div>
            <p className="mt-1.5 text-xs text-stone-600 text-center">
              {selectedRole === 'buyer' ? t('auth.buyerRoleDesc') : t('auth.farmerRoleDesc')}
            </p>
          </div>

          {/* Role Mismatch Warning Banner */}
          {mismatchData && (
            <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-sm">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold">{t('auth.roleMismatchTitle')}</h2>
                  <p className="mt-1 text-xs text-amber-800">
                    {t('auth.roleMismatchAdvice', {
                      actualRole: mismatchData.actualRole === 'farmer' ? t('auth.farmerRole') : mismatchData.actualRole === 'buyer' ? t('auth.buyerRole') : t('auth.adminRole'),
                      expectedRole: mismatchData.expectedRole === 'farmer' ? t('auth.farmerRole') : t('auth.buyerRole'),
                    })}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSwitchRole(mismatchData.actualRole)}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <span>
                      {t('auth.roleMismatchSwitch', {
                        actualRole: mismatchData.actualRole === 'farmer' ? t('auth.farmerRole') : mismatchData.actualRole === 'buyer' ? t('auth.buyerRole') : t('auth.adminRole'),
                      })}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* General Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Main Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 text-stone-900 text-sm placeholder:text-stone-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-stone-700">
                  {t('auth.password')}
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-stone-600 hover:text-emerald-800 flex items-center gap-1 font-medium"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>{t('auth.hidePassword')}</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t('auth.showPassword')}</span>
                    </>
                  )}
                </button>
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 text-stone-900 text-sm placeholder:text-stone-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span>{t('common.loading')}</span>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>{t('auth.submitLogin')}</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fill Switches */}
          <div className="mt-6 pt-5 border-t border-stone-200">
            <p className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2.5 text-center">
              {t('auth.quickDemoLogins')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('farmer')}
                disabled={loading}
                className="px-2.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-medium transition-colors text-left"
              >
                <div className="font-semibold">Mallikarjun (Farmer)</div>
                <div className="text-[11px] text-emerald-700">Shamshabad Groves</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('buyer')}
                disabled={loading}
                className="px-2.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-xs font-medium transition-colors text-left"
              >
                <div className="font-semibold">Priya Sharma (Buyer)</div>
                <div className="text-[11px] text-amber-800">Household Consumer</div>
              </button>
            </div>
          </div>

          {/* Links to Register & Admin */}
          <div className="mt-6 space-y-2 text-center text-sm">
            <div>
              <button
                type="button"
                onClick={() => onNavigate('/register')}
                className="text-emerald-800 hover:text-emerald-900 font-semibold text-xs"
              >
                {t('auth.dontHaveAccount')}
              </button>
            </div>
            <div>
              <button
                type="button"
                onClick={() => onNavigate('/admin/login')}
                className="text-stone-600 hover:text-stone-700 text-xs inline-flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-stone-600" />
                <span>{t('nav.adminLogin')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
