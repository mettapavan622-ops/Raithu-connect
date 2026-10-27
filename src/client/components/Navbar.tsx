import React from 'react';
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
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuth: () => void;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenCart,
}) => {
  const { user, logout, demoLogin } = useAuth();
  const { totalItemsCount } = useCart();
  const [showDemoMenu, setShowDemoMenu] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-emerald-950 text-stone-100 border-b border-emerald-900 shadow-sm">
      {/* Disclaimer Top Bar */}
      <div className="bg-amber-900/60 border-b border-amber-800/40 text-amber-200 text-xs py-1.5 px-4 text-center font-medium">
        <span>🌾 Demo Prototype for Hyderabad &amp; Telangana Rural Mandals — </span>
        <span className="font-semibold underline">Cash on pickup &amp; simulated payments only. Delivery is not arranged by this app.</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onNavigate('marketplace')}
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-700/80 border border-emerald-500/30 flex items-center justify-center text-emerald-200 group-hover:bg-emerald-600 transition-colors shadow-inner">
              <Sprout className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl font-bold tracking-tight text-stone-50">
                  RaithuConnect
                </span>
                <span className="text-[10px] uppercase tracking-wider bg-emerald-800 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-semibold">
                  రైతు
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-sans tracking-wide">
                Local Harvest, Direct Trade
              </p>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => onNavigate('marketplace')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'marketplace'
                  ? 'bg-emerald-850 text-emerald-200 shadow-sm border border-emerald-700/50'
                  : 'text-stone-300 hover:text-stone-100 hover:bg-emerald-900/50'
              }`}
            >
              Marketplace
            </button>

            <button
              onClick={() => onNavigate('surplus')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentView === 'surplus'
                  ? 'bg-amber-950/80 text-amber-200 border border-amber-700/50'
                  : 'text-amber-300 hover:text-amber-100 hover:bg-amber-950/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Surplus Corner
            </button>

            {user?.role === 'farmer' && (
              <>
                <button
                  onClick={() => onNavigate('farmer_dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    currentView === 'farmer_dashboard'
                      ? 'bg-emerald-850 text-emerald-200 border border-emerald-700/50'
                      : 'text-stone-300 hover:text-stone-100 hover:bg-emerald-900/50'
                  }`}
                >
                  <Tractor className="w-4 h-4 text-emerald-400" />
                  Farmer Dashboard
                </button>
              </>
            )}

            {user?.role === 'buyer' && (
              <button
                onClick={() => onNavigate('buyer_orders')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'buyer_orders'
                    ? 'bg-emerald-850 text-emerald-200 border border-emerald-700/50'
                    : 'text-stone-300 hover:text-stone-100 hover:bg-emerald-900/50'
                }`}
              >
                My Orders
              </button>
            )}

            {user?.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin_moderation')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentView === 'admin_moderation'
                    ? 'bg-red-950/80 text-red-200 border border-red-700/50'
                    : 'text-red-300 hover:text-red-100 hover:bg-red-950/40'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-red-400" />
                Admin Moderation
              </button>
            )}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {/* 1-Click Demo Selector */}
            <div className="relative">
              <button
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="flex items-center gap-1 text-xs bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 px-2.5 py-1.5 rounded border border-emerald-700/50 transition-colors"
                title="Switch demo account"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Demo Switcher</span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
              </button>

              {showDemoMenu && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-stone-900 border border-stone-700 rounded-lg shadow-xl py-2 z-50 text-xs text-stone-200"
                  onClick={() => setShowDemoMenu(false)}
                >
                  <div className="px-3 py-1 font-semibold text-stone-400 border-b border-stone-800 text-[11px] uppercase tracking-wider">
                    Sign in with Demo Accounts
                  </div>
                  <button
                    onClick={() => demoLogin('farmer', 'mallikarjun.farmer@raithu.in')}
                    className="w-full text-left px-3 py-2 hover:bg-stone-800 flex flex-col"
                  >
                    <span className="font-medium text-emerald-400">Mallikarjun Rao (Farmer)</span>
                    <span className="text-[10px] text-stone-400">Shamshabad Mandal • Mangoes &amp; Veg</span>
                  </button>
                  <button
                    onClick={() => demoLogin('farmer', 'lakshmi.farmer@raithu.in')}
                    className="w-full text-left px-3 py-2 hover:bg-stone-800 flex flex-col"
                  >
                    <span className="font-medium text-emerald-400">Lakshmi Devi (Farmer)</span>
                    <span className="text-[10px] text-stone-400">Ibrahimpatnam • Fresh Leafy Greens</span>
                  </button>
                  <button
                    onClick={() => demoLogin('buyer', 'priya.buyer@hyd.in')}
                    className="w-full text-left px-3 py-2 hover:bg-stone-800 flex flex-col"
                  >
                    <span className="font-medium text-amber-300">Priya Sharma (Household Buyer)</span>
                    <span className="text-[10px] text-stone-400">Direct household fresh pickup</span>
                  </button>
                  <button
                    onClick={() => demoLogin('buyer', 'chef.anand@deccanbiryani.in')}
                    className="w-full text-left px-3 py-2 hover:bg-stone-800 flex flex-col"
                  >
                    <span className="font-medium text-amber-300">Chef Anand (Restaurant Buyer)</span>
                    <span className="text-[10px] text-stone-400">Deccan Biryani House kitchen orders</span>
                  </button>
                  <button
                    onClick={() => demoLogin('admin', 'admin@raithuconnect.telangana.gov')}
                    className="w-full text-left px-3 py-2 hover:bg-stone-800 flex flex-col border-t border-stone-800 mt-1"
                  >
                    <span className="font-medium text-red-400">Dr. Ramana (Agri Admin)</span>
                    <span className="text-[10px] text-stone-400">Marketplace moderation officer</span>
                  </button>
                </div>
              )}
            </div>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-stone-200 transition-colors border border-emerald-700/40"
              aria-label="View pickup cart"
            >
              <ShoppingBag className="w-5 h-5 text-emerald-300" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-stone-950 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* User Profile / Auth State */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-emerald-800/60">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-stone-200 leading-tight">
                    {user.fullName}
                  </div>
                  <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.2 rounded bg-emerald-800 text-emerald-300">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded hover:bg-emerald-900 text-stone-400 hover:text-stone-200 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-semibold px-3 py-1.5 rounded-md text-xs transition-colors shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-emerald-900/70 text-xs">
          <button
            onClick={() => onNavigate('marketplace')}
            className={`py-1 px-2 rounded ${currentView === 'marketplace' ? 'text-emerald-300 font-semibold' : 'text-stone-400'}`}
          >
            Marketplace
          </button>
          <button
            onClick={() => onNavigate('surplus')}
            className={`py-1 px-2 rounded ${currentView === 'surplus' ? 'text-amber-300 font-semibold' : 'text-stone-400'}`}
          >
            Surplus
          </button>
          {user?.role === 'farmer' && (
            <button
              onClick={() => onNavigate('farmer_dashboard')}
              className={`py-1 px-2 rounded ${currentView === 'farmer_dashboard' ? 'text-emerald-300 font-semibold' : 'text-stone-400'}`}
            >
              Dashboard
            </button>
          )}
          {user?.role === 'buyer' && (
            <button
              onClick={() => onNavigate('buyer_orders')}
              className={`py-1 px-2 rounded ${currentView === 'buyer_orders' ? 'text-emerald-300 font-semibold' : 'text-stone-400'}`}
            >
              Orders
            </button>
          )}
          {user?.role === 'admin' && (
            <button
              onClick={() => onNavigate('admin_moderation')}
              className={`py-1 px-2 rounded ${currentView === 'admin_moderation' ? 'text-red-300 font-semibold' : 'text-stone-400'}`}
            >
              Admin
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
