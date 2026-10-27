import React, { useState } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  ShieldCheck,
  Tractor,
  ShoppingBag,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, demoLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [role, setRole] = useState<'farmer' | 'buyer'>('farmer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Farmer optional profile fields
  const [farmName, setFarmName] = useState('');
  const [villageMandal, setVillageMandal] = useState('Chevella Mandal');
  const [district, setDistrict] = useState('Ranga Reddy');
  const [bio, setBio] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(loginEmail, loginPassword);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register({
        role,
        fullName,
        email,
        phone,
        password,
        farmName: role === 'farmer' ? farmName : undefined,
        villageMandal: role === 'farmer' ? villageMandal : undefined,
        district: role === 'farmer' ? district : undefined,
        bio: role === 'farmer' ? bio : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check form inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (roleType: 'farmer' | 'buyer' | 'admin', demoEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      await demoLogin(roleType, demoEmail);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-emerald-950 text-stone-100 px-6 py-4 flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg font-bold">
              {mode === 'login' ? 'Sign In to RaithuConnect' : 'Create RaithuConnect Account'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-emerald-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-stone-200 bg-stone-50">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold border-b-2 text-center transition-colors ${
              mode === 'login'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold border-b-2 text-center transition-colors ${
              mode === 'register'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Register (Farmer / Buyer)
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {/* 1-Click Demo Profiles Panel */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase font-bold text-stone-500 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                1-Click Seeded Demo Logins
              </span>
              <span className="text-[10px] text-stone-400">Instant Role Access</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoSignIn('farmer', 'mallikarjun.farmer@raithu.in')}
                className="p-2 text-left bg-white hover:bg-emerald-50 rounded-lg border border-stone-200 hover:border-emerald-500 transition-colors"
              >
                <div className="font-bold text-emerald-900">Mallikarjun Rao (Farmer)</div>
                <div className="text-[10px] text-stone-500">Shamshabad • Mangoes &amp; Veg</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSignIn('farmer', 'lakshmi.farmer@raithu.in')}
                className="p-2 text-left bg-white hover:bg-emerald-50 rounded-lg border border-stone-200 hover:border-emerald-500 transition-colors"
              >
                <div className="font-bold text-emerald-900">Lakshmi Devi (Farmer)</div>
                <div className="text-[10px] text-stone-500">Ibrahimpatnam • Greens Specialist</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSignIn('buyer', 'priya.buyer@hyd.in')}
                className="p-2 text-left bg-white hover:bg-amber-50 rounded-lg border border-stone-200 hover:border-amber-500 transition-colors"
              >
                <div className="font-bold text-amber-900">Priya Sharma (Buyer)</div>
                <div className="text-[10px] text-stone-500">Household consumer pickup</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSignIn('admin', 'admin@raithuconnect.telangana.gov')}
                className="p-2 text-left bg-white hover:bg-red-50 rounded-lg border border-stone-200 hover:border-red-500 transition-colors"
              >
                <div className="font-bold text-red-900">Dr. Ramana (Admin)</div>
                <div className="text-[10px] text-stone-500">Marketplace moderation officer</div>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. mallikarjun.farmer@raithu.in"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-700 text-stone-900"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-700 text-stone-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white font-bold rounded-lg transition-colors shadow-sm text-sm"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1.5">Select Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('farmer')}
                    className={`p-3 rounded-lg border text-left flex items-center gap-2 transition-colors ${
                      role === 'farmer'
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-stone-200 bg-white text-stone-700'
                    }`}
                  >
                    <Tractor className="w-4 h-4 text-emerald-700" />
                    <span>Farmer / Grower</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('buyer')}
                    className={`p-3 rounded-lg border text-left flex items-center gap-2 transition-colors ${
                      role === 'buyer'
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-stone-200 bg-white text-stone-700'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-700" />
                    <span>Buyer / Consumer</span>
                  </button>
                </div>
                <p className="text-[10px] text-stone-500 mt-1">
                  * Public registration is restricted to Farmer or Buyer roles. Admin roles must be seeded or created administratively.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Reddy"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Phone (10 digits)</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9849012345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
                  />
                </div>
              </div>

              {role === 'farmer' && (
                <div className="pt-2 border-t border-stone-200 space-y-3">
                  <span className="font-bold text-stone-800 text-[11px] uppercase tracking-wider block">
                    Farmer Farm Information
                  </span>

                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">Farm Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Reddy Natural Farms"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">Village / Mandal</label>
                      <input
                        type="text"
                        placeholder="e.g. Shamshabad Mandal"
                        value={villageMandal}
                        onChange={(e) => setVillageMandal(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">District</label>
                      <input
                        type="text"
                        placeholder="e.g. Ranga Reddy"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white font-bold rounded-lg transition-colors shadow-sm text-sm"
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
