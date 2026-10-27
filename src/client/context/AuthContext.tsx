import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, FarmerProfile } from '../../shared/types';
import { apiFetch, setCsrfToken } from '../api';
import i18n from '../i18n';

interface AuthContextType {
  user: User | null;
  farmerProfile: FarmerProfile | null;
  loading: boolean;
  login: (email: string, password: string, expectedRole?: 'farmer' | 'buyer') => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  demoLogin: (role: 'farmer' | 'buyer' | 'admin', email?: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<User>;
  updateFarmerProfile: (data: Partial<FarmerProfile>) => Promise<FarmerProfile>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const syncLanguageFromUser = (preferredLanguage?: string) => {
    if (preferredLanguage && ['en', 'te', 'hi'].includes(preferredLanguage)) {
      if (i18n.language !== preferredLanguage) {
        i18n.changeLanguage(preferredLanguage);
      }
    }
  };

  const refreshAuth = async () => {
    try {
      const data = await apiFetch('/api/auth/me');
      setUser(data.user || null);
      setFarmerProfile(data.farmerProfile || null);
      if (data.user?.preferredLanguage) {
        syncLanguageFromUser(data.user.preferredLanguage);
      }
      if (data.csrfToken) {
        setCsrfToken(data.csrfToken);
      }
    } catch (_) {
      setUser(null);
      setFarmerProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const login = async (email: string, password: string, expectedRole?: 'farmer' | 'buyer') => {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, expectedRole }),
    });
    setUser(data.user);
    setFarmerProfile(data.farmerProfile || null);
    if (data.user?.preferredLanguage) {
      syncLanguageFromUser(data.user.preferredLanguage);
    }
    if (data.csrfToken) setCsrfToken(data.csrfToken);
  };

  const adminLogin = async (email: string, password: string) => {
    const data = await apiFetch('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
    setFarmerProfile(null);
    if (data.user?.preferredLanguage) {
      syncLanguageFromUser(data.user.preferredLanguage);
    }
    if (data.csrfToken) setCsrfToken(data.csrfToken);
  };

  const demoLogin = async (role: 'farmer' | 'buyer' | 'admin', email?: string) => {
    const data = await apiFetch('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role, email }),
    });
    setUser(data.user);
    setFarmerProfile(data.farmerProfile || null);
    if (data.user?.preferredLanguage) {
      syncLanguageFromUser(data.user.preferredLanguage);
    }
    if (data.csrfToken) setCsrfToken(data.csrfToken);
  };

  const register = async (formData: any) => {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    setUser(data.user);
    setFarmerProfile(data.farmerProfile || null);
    if (data.user?.preferredLanguage) {
      syncLanguageFromUser(data.user.preferredLanguage);
    }
    if (data.csrfToken) setCsrfToken(data.csrfToken);
  };

  const updateProfile = async (data: Partial<User>): Promise<User> => {
    const res = await apiFetch('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    setUser(res.user);
    if (res.farmerProfile) setFarmerProfile(res.farmerProfile);
    if (data.preferredLanguage) {
      syncLanguageFromUser(data.preferredLanguage);
    }
    return res.user;
  };

  const updateFarmerProfile = async (data: Partial<FarmerProfile>): Promise<FarmerProfile> => {
    const res = await apiFetch('/farmer/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    setFarmerProfile(res.farmerProfile);
    return res.farmerProfile;
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setFarmerProfile(null);
      // Clean caches and local session stores
      try {
        localStorage.removeItem('raithu_cart');
      } catch (_) {}
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        farmerProfile,
        loading,
        login,
        adminLogin,
        demoLogin,
        register,
        updateProfile,
        updateFarmerProfile,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
