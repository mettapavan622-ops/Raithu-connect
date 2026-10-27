import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sprout,
  ShoppingBag,
  Sparkles,
  UserCheck,
  LogOut,
  LogIn,
  ShieldCheck,
  Tractor,
  Layers,
  ChevronDown,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { LanguageSelector } from './LanguageSelector';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
  onOpenCart,
}) => {
  const { t } = useTranslation();
  const { user, logout, demoLogin } = useAuth();
  const { totalItemsCount } = useCart();
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    onNavigate('/marketplace');
  };

  const handleDemoSelect = async (role: 'farmer' | 'buyer' | 'admin', email?: string) => {
    setShowDemoMenu(false);
    await demoLogin(role, email);
    if (role === 'farmer') onNavigate('/farmer/dashboard');
    else if (role === 'buyer') onNavigate('/buyer/dashboard');
    else if (role === 'admin') onNavigate('/admin/dashboard');
  };

  return (
    <header className="sticky top-0 z-40 bg-emerald-950 text-stone-100 border-b border-emerald-900 shadow-sm">
      {/* Top Disclaimer Notice */}
      <div className="bg-amber-900/70 border-b border-amber-800/40 text-amber-200 text-xs py-1.5 px-4 text-center font-medium">
        <span>🌾 {t('common.demoNotice')}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onNavigate('/marketplace')}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-700/90 border border-emerald-500/40 flex items-center justify-center text-emerald-200 group-hover:bg-emerald-600 transition-colors shadow-inner">
              <Sprout className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl font-bold tracking-tight text-stone-50">
                  {t('common.appName')}
                </span>
                <span className="text-[10px] uppercase tracking-wider bg-emerald-800 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-semibold">
                  రైతు
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-sans tracking-wide">
                {t('common.tagline')}
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => onNavigate('/marketplace')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                currentPath === '/marketplace' || currentPath === '/'
                  ? 'bg-emerald-850 text-emerald-200 shadow-sm border border-emerald-700/50'
                  : 'text-stone-300 hover:text-stone-100 hover:bg-emerald-900/50'
              }`}
            >
              {t('nav.marketplace')}
            </button>

            <button
              onClick={() => onNavigate('/surplus')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                currentPath === '/surplus'
                  ? 'bg-amber-950/80 text-amber-200 border border-amber-700/50'
                  : 'text-amber-300 hover:text-amber-100 hover:bg-amber-950/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('nav.surplus')}</span>
            </button>

            {/* Role Scoped Links */}
            {user?.role === 'farmer' && (
              <button
                onClick={() => onNavigate('/farmer/dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  currentPath.startsWith('/farmer')
                    ? 'bg-emerald-850 text-emerald-200 border border-emerald-700/50'
                    : 'text-stone-300 hover:text-stone-100 hover:bg-emerald-900/50'
                }`}
              >
                <Tractor className="w-4 h-4 text-emerald-400" />
                <span>{t('nav.farmerDashboard')}</span>
              </button>
            )}

            {user?.role === 'buyer' && (
              <button
                onClick={() => onNavigate('/buyer/dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  currentPath.startsWith('/buyer')
                    ? 'bg-emerald-850 text-emerald-200 border border-emerald-700/50'
                    : 'text-stone-300 hover:text-stone-100 hover:bg-emerald-900/50'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>{t('nav.buyerDashboard')}</span>
              </button>
            )}

            {user?.role === 'admin' && (
              <button
                onClick={() => onNavigate('/admin/dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  currentPath.startsWith('/admin')
                    ? 'bg-slate-900 text-amber-300 border border-amber-500/50'
                    : 'text-amber-400 hover:text-amber-200 hover:bg-slate-900/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>{t('nav.adminDashboard')}</span>
              </button>
            )}
          </nav>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Multilingual Selector */}
            <LanguageSelector variant="header" isLoggedIn={!!user} />

            {/* Quick Demo Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="flex items-center gap-1 text-xs bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 px-2.5 py-1.5 rounded-md border border-emerald-700/50 transition-colors cursor-pointer"
                title="Switch demo profile"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">{t('nav.quickDemo')}</span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
              </button>

              {showDemoMenu && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-stone-900 border border-stone-700 rounded-xl shadow-xl py-2 z-50 text-xs text-stone-200"
                  onClick={() => setShowDemoMenu(false)}
                >
                  <div className="px-3 py-1 font-semibold text-stone-400 border-b border-stone-800 text-[11px] uppercase tracking-wider">
                    {t('auth.quickDemoLogins')}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDemoSelect('farmer', 'mallikarjun.farmer@raithu.in')}
                    className="w-full text-left px-3 py-2 hover:bg-stone-800 flex flex-col cursor-pointer"
                  >
                    <span className="font-semibold text-emerald-400">Mallikarjun Rao (Farmer)</span>
                    <span className="text-[10px] text-stone-400">Shamshabad Mandal &bull; Mangoes &amp; Veg</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoSelect('farmer', 'lakshmi.farmer@raithu.in')}
                    className="w-full text-left px-3 py-2 hover:bg-stone-800 flex flex-col cursor-pointer"
                  >
                    <span className="font-semibold text-emerald-400">Lakshmi Devi (Farmer)</span>
                    <span className="text-[10px] text-stone-400">Ibrahimpatnam &bull; Fresh Greens</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoSelect('buyer', 'priya.buyer@hyd.in')}
                    className="w-full text-left px-3 py-2 hover:bg-stone-800 flex flex-col cursor-pointer"
                  >
                    <span className="font-semibold text-amber-300">Priya Sharma (Buyer)</span>
                    <span className="text-[10px] text-stone-400">Household consumer pickup</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoSelect('buyer', 'chef.anand@deccanbiryani.in')}
                    className="w-full text-left px-3 py-2 hover:bg-stone-800 flex flex-col cursor-pointer"
                  >
                    <span className="font-semibold text-amber-300">Chef Anand (Restaurant Buyer)</span>
                    <span className="text-[10px] text-stone-400">Deccan Biryani House kitchen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoSelect('admin', 'admin@raithuconnect.telangana.gov')}
                    className="w-full text-left px-3 py-2 hover:bg-stone-800 flex flex-col border-t border-stone-800 mt-1 cursor-pointer"
                  >
                    <span className="font-semibold text-red-400">Dr. Ramana (Agri Admin)</span>
                    <span className="text-[10px] text-stone-400">Platform moderation officer</span>
                  </button>
                </div>
              )}
            </div>

            {/* Cart Button */}
            <button
              type="button"
              onClick={onOpenCart}
              className="relative p-2 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-stone-200 transition-colors border border-emerald-700/40 cursor-pointer"
              aria-label="View pickup cart"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-300" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-stone-950 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* Auth / Account Controls */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-emerald-800/60">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-stone-200 leading-tight">
                    {user.fullName}
                  </div>
                  <span className={`text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.2 rounded font-semibold ${
                    user.role === 'farmer'
                      ? 'bg-emerald-800 text-emerald-300'
                      : user.role === 'admin'
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-stone-800 text-stone-300'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg hover:bg-emerald-900 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                  title={t('nav.logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onNavigate('/login')}
                  className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold px-2.5 py-1.5 rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t('nav.login')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/register')}
                  className="hidden sm:flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t('nav.register')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center justify-around py-2 border-t border-emerald-900/70 text-xs">
          <button
            type="button"
            onClick={() => onNavigate('/marketplace')}
            className={`py-1 px-2 rounded cursor-pointer ${currentPath === '/marketplace' || currentPath === '/' ? 'text-emerald-300 font-bold' : 'text-stone-400'}`}
          >
            {t('nav.marketplace')}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/surplus')}
            className={`py-1 px-2 rounded cursor-pointer ${currentPath === '/surplus' ? 'text-amber-300 font-bold' : 'text-stone-400'}`}
          >
            {t('nav.surplus')}
          </button>
          {user?.role === 'farmer' && (
            <button
              type="button"
              onClick={() => onNavigate('/farmer/dashboard')}
              className={`py-1 px-2 rounded cursor-pointer ${currentPath.startsWith('/farmer') ? 'text-emerald-300 font-bold' : 'text-stone-400'}`}
            >
              {t('nav.dashboard')}
            </button>
          )}
          {user?.role === 'buyer' && (
            <button
              type="button"
              onClick={() => onNavigate('/buyer/dashboard')}
              className={`py-1 px-2 rounded cursor-pointer ${currentPath.startsWith('/buyer') ? 'text-emerald-300 font-bold' : 'text-stone-400'}`}
            >
              {t('nav.dashboard')}
            </button>
          )}
          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => onNavigate('/admin/dashboard')}
              className={`py-1 px-2 rounded cursor-pointer ${currentPath.startsWith('/admin') ? 'text-amber-300 font-bold' : 'text-stone-400'}`}
            >
              {t('nav.adminDashboard')}
            </button>
          )}
          {!user && (
            <button
              type="button"
              onClick={() => onNavigate('/register')}
              className={`py-1 px-2 rounded cursor-pointer ${currentPath === '/register' ? 'text-emerald-300 font-bold' : 'text-stone-400'}`}
            >
              {t('nav.register')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
