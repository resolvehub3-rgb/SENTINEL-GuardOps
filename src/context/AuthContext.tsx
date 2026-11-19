import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, getStoredToken, setStoredToken } from '../services/api';
import type { AuthUser, UserRole } from '../types/guardops';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<AuthUser>;
  loginToPortal: (role: UserRole) => Promise<AuthUser>;
  registerCompany: (payload: {
    companyName: string;
    contactName: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const autostartRole = params.get('role') as UserRole | null;
        if (
          params.get('autostart') === '1' &&
          autostartRole &&
          ['company', 'supervisor', 'guard', 'admin'].includes(autostartRole)
        ) {
          const res = await authApi.portalLogin(autostartRole);
          setStoredToken(res.token);
          if (active) setUser(res.user);
          return;
        }

        if (getStoredToken()) {
          const res = await authApi.me();
          if (active) setUser(res.user);
        } else {
          // Try existing HttpOnly cookie session if present
          const res = await authApi.me();
          if (active) setUser(res.user);
        }
      } catch {
        setStoredToken(null);
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    void init();
    return () => {
      active = false;
    };
  }, []);

  const loginWithCredentials = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setStoredToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const loginToPortal = useCallback(async (role: UserRole) => {
    const res = await authApi.portalLogin(role);
    setStoredToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const registerCompany = useCallback(
    async (payload: {
      companyName: string;
      contactName: string;
      email: string;
      password: string;
      phone?: string;
    }) => {
      const res = await authApi.registerCompany(payload);
      setStoredToken(res.token);
      setUser(res.user);
      return res.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout error
    } finally {
      setStoredToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithCredentials,
        loginToPortal,
        registerCompany,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
