import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, FarmerProfile } from '../../shared/types';
import { apiFetch, setCsrfToken } from '../api';

interface AuthContextType {
  user: User | null;
  farmerProfile: FarmerProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: (role: 'farmer' | 'buyer' | 'admin', email?: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = async () => {
    try {
      const data = await apiFetch('/api/auth/me');
      setUser(data.user || null);
      setFarmerProfile(data.farmerProfile || null);
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

  const login = async (email: string, password: string) => {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
    setFarmerProfile(data.farmerProfile || null);
    if (data.csrfToken) setCsrfToken(data.csrfToken);
  };

  const demoLogin = async (role: 'farmer' | 'buyer' | 'admin', email?: string) => {
    const data = await apiFetch('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role, email }),
    });
    setUser(data.user);
    setFarmerProfile(data.farmerProfile || null);
    if (data.csrfToken) setCsrfToken(data.csrfToken);
  };

  const register = async (formData: any) => {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    setUser(data.user);
    setFarmerProfile(data.farmerProfile || null);
    if (data.csrfToken) setCsrfToken(data.csrfToken);
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setFarmerProfile(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        farmerProfile,
        loading,
        login,
        demoLogin,
        register,
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
