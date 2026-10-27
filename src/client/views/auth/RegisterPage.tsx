import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { LanguageSelector } from '../../components/LanguageSelector';
import { Sprout, ShoppingBag, Eye, EyeOff, UserPlus, AlertTriangle } from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (path: string) => void;
  initialRole?: 'buyer' | 'farmer';
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate, initialRole = 'buyer' }) => {
  const { t, i18n } = useTranslation();
  const { register } = useAuth();

  const [role, setRole] = useState<'buyer' | 'farmer'>(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [locality, setLocality] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'te' | 'hi'>(
    (i18n.language.startsWith('te') ? 'te' : i18n.language.startsWith('hi') ? 'hi' : 'en') as any
  );

  // Farmer specific
  const [farmName, setFarmName] = useState('');
  const [villageMandal, setVillageMandal] = useState('');
  const [mainCategories, setMainCategories] = useState('vegetables');
  const [bio, setBio] = useState('');
  const [upiId, setUpiId] = useState('');

  // Buyer specific
  const [buyerType, setBuyerType] = useState<'household' | 'retailer' | 'restaurant' | 'wholesaler'>('household');
  const [businessName, setBusinessName] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim() || !phone.trim() || !password) {
      setErrorMessage(t('validation.requiredField'));
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t('auth.passwordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t('auth.passwordsDoNotMatch'));
      return;
    }

    const payload: any = {
      role,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      preferredLanguage,
      locality: locality.trim() || (role === 'farmer' ? villageMandal.trim() : 'Hyderabad'),
    };

    if (role === 'farmer') {
      payload.farmName = farmName.trim() || `${fullName.trim()}'s Farm`;
      payload.villageMandal = villageMandal.trim() || locality.trim() || 'Chevella Mandal';
      payload.mainCategories = mainCategories;
      payload.bio = bio.trim();
      payload.upiId = upiId.trim() || `${phone.trim()}@upi`;
    } else {
      payload.buyerType = buyerType;
      payload.businessName = businessName.trim();
    }

    setLoading(true);
    try {
      await register(payload);
      if (role === 'farmer') {
        onNavigate('/farmer/dashboard');
      } else {
        onNavigate('/buyer/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-10 sm:px-6 lg:px-8 bg-stone-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-800 text-amber-300 shadow-md mb-2">
            <Sprout className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-emerald-950">
            {t('auth.registerTitle')}
          </h1>
          <p className="mt-1 text-sm text-stone-600 font-medium">
            {t('auth.registerSubtitle')}
          </p>
        </div>

        <div className="mt-3 flex justify-center">
          <LanguageSelector variant="inline" />
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-stone-200 sm:px-8">
          {/* Account Role Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
              Select Registration Type:
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setRole('buyer')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                  role === 'buyer'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{t('auth.buyerRole')}</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('farmer')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                  role === 'farmer'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <Sprout className="w-4 h-4" />
                <span>{t('auth.farmerRole')}</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t('auth.fullName')} *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('auth.fullNamePlaceholder')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t('auth.phone')} *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('auth.phonePlaceholder')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t('auth.email')} *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t('auth.locality')} *
                </label>
                <input
                  type="text"
                  required
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder={t('auth.localityPlaceholder')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                />
              </div>
            </div>

            {/* Password with visibility toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    {t('auth.password')} *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-stone-600 hover:text-emerald-800 flex items-center gap-0.5"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t('auth.confirmPassword')} *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {t('auth.preferredLanguage')}
              </label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 bg-white"
              >
                <option value="en">English</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>

            {/* Role-Specific Fields */}
            {role === 'farmer' ? (
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-3">
                <h2 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Farmer & Farm Specifics
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      {t('auth.farmName')}
                    </label>
                    <input
                      type="text"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      placeholder={t('auth.farmNamePlaceholder')}
                      className="w-full px-3 py-2 text-xs rounded-md border border-stone-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      {t('auth.farmLocality')}
                    </label>
                    <input
                      type="text"
                      value={villageMandal}
                      onChange={(e) => setVillageMandal(e.target.value)}
                      placeholder={t('auth.farmLocalityPlaceholder')}
                      className="w-full px-3 py-2 text-xs rounded-md border border-stone-300 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      {t('auth.mainCategories')}
                    </label>
                    <select
                      value={mainCategories}
                      onChange={(e) => setMainCategories(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-md border border-stone-300 bg-white"
                    >
                      <option value="vegetables">{t('marketplace.vegetables')}</option>
                      <option value="fruits">{t('marketplace.fruits')}</option>
                      <option value="leafy_greens">{t('marketplace.leafy_greens')}</option>
                      <option value="grains">{t('marketplace.grains')}</option>
                      <option value="spices_and_others">{t('marketplace.spices_and_others')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      {t('auth.upiId')}
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder={t('auth.upiIdPlaceholder')}
                      className="w-full px-3 py-2 text-xs rounded-md border border-stone-300 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    {t('auth.farmBio')}
                  </label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={t('auth.farmBioPlaceholder')}
                    className="w-full px-3 py-2 text-xs rounded-md border border-stone-300 bg-white"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-3">
                <h2 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Buyer Profile Details
                </h2>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    {t('auth.buyerType')}
                  </label>
                  <select
                    value={buyerType}
                    onChange={(e) => setBuyerType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-stone-300 bg-white"
                  >
                    <option value="household">{t('auth.buyerTypeHousehold')}</option>
                    <option value="retailer">{t('auth.buyerTypeRetailer')}</option>
                    <option value="restaurant">{t('auth.buyerTypeRestaurant')}</option>
                    <option value="wholesaler">{t('auth.buyerTypeWholesaler')}</option>
                  </select>
                </div>

                {buyerType !== 'household' && (
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      {t('auth.businessName')}
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder={t('auth.businessNamePlaceholder')}
                      className="w-full px-3 py-2 text-xs rounded-md border border-stone-300 bg-white"
                    />
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span>{t('common.loading')}</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{t('auth.submitRegister')}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="text-emerald-800 hover:text-emerald-900 font-semibold text-xs"
            >
              {t('auth.alreadyHaveAccount')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
