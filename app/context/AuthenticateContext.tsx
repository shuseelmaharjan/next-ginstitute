"use client";

import React, { createContext, useContext, useCallback, useState, useEffect, useMemo } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import config from "../config";

type User = {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
};

type WhoIsMeServerUser = Partial<User> & { id?: number } | null;

type WhoIsMeResponse = {
  success: boolean;
  session: boolean;
  message?: string;
  data?: WhoIsMeServerUser | null;
};

type AuthenticateContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  clearAuth: () => void;
  refreshUser: () => void;
};

const AuthenticateContext = createContext<AuthenticateContextType>({
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  clearAuth: () => {},
  refreshUser: () => {},
});

export const AuthenticateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Helper to check for session cookie (kept for cleanup/fallback)
  const hasSession = useCallback(() => typeof window !== 'undefined' && Cookies.get('session') === 'true', []);

  // Clear authentication
  const clearAuth = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("username");
      localStorage.removeItem("accessToken");
      Cookies.remove("_ud");
      Cookies.remove("session");
    }
  }, []);

  const readUserFromCookie = useCallback((): User | null => {
    try {
      const userData = Cookies.get("_ud");
      if (!userData) return null;
      return JSON.parse(atob(userData));
    } catch {
      return null;
    }
  }, []);

  // Call server to get current session/user
  const fetchWhoIsMe = useCallback(async (): Promise<WhoIsMeResponse> => {
    try {
      // Build URL from config.BASE_URL (fall back to relative path if not set)
      const base = (config?.BASE_URL || "").replace(/\/$/, "");
      const url = base ? `${base}/api/auth/v1/who-is-me` : `/api/auth/v1/who-is-me`;

      const response = await axios.get<WhoIsMeResponse>(url, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      const body: WhoIsMeResponse = response.data;

      // expected shapes:
      // { success: true, session: false, message: 'No active session found' }
      // { success: true, session: true, message: 'Active session found', data: { ...user } }

      if (body && body.success && body.session && body.data) {
        const data = body.data as WhoIsMeServerUser;
        // Ensure types align - use safe type checks and defaults
        const serverUser: User = {
          id: typeof data?.id === 'number' ? data.id : 0,
          username: typeof data?.username === 'string' ? data.username : '',
          email: typeof data?.email === 'string' ? data.email : '',
          name: typeof data?.name === 'string' ? data.name : '',
          role: typeof data?.role === 'string' ? data.role : '',
          isActive: typeof data?.isActive === 'boolean' ? data.isActive : true,
        };
        setUser(serverUser);
        setIsAuthenticated(true);
        setError(null);
        // Mirror into cookie for quick reads elsewhere
        try {
          if (typeof window !== 'undefined') {
            Cookies.set('_ud', btoa(JSON.stringify(serverUser)), { sameSite: 'lax' });
          }
        } catch {
          // ignore cookie set failures
        }
        return body;
      }

      // session false
      clearAuth();
      return body;
    } catch (err: unknown) {
      console.error('who-is-me failed', err);
      setError('Failed to validate session');
      // If request fails but cookie exists, attempt to read cookie as fallback
      if (hasSession()) {
        const cookieUser = readUserFromCookie();
        if (cookieUser) {
          setUser(cookieUser);
          setIsAuthenticated(true);
          return { success: true, session: true, data: cookieUser };
        }
      }
      clearAuth();
      return { success: false, session: false };
    }
  }, [clearAuth, hasSession, readUserFromCookie]);

  const refreshUser = useCallback(() => {
    // Make a server call to refresh
    (async () => {
      setLoading(true);
      await fetchWhoIsMe();
      setLoading(false);
    })();
  }, [fetchWhoIsMe]);

  // Initialize auth state - call server who-is-me once on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (initialized) return;

      setLoading(true);
      setError(null);

      try {
        await fetchWhoIsMe();
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setError('Failed to initialize authentication');
        clearAuth();
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();
  }, [initialized, fetchWhoIsMe, clearAuth]);

  // Memoize context value
  const contextValue = useMemo(() => ({
    user,
    loading,
    error,
    isAuthenticated,
    clearAuth,
    refreshUser
  }), [user, loading, error, isAuthenticated, clearAuth, refreshUser]);

  return (
    <AuthenticateContext.Provider value={contextValue}>
      {children}
    </AuthenticateContext.Provider>
  );
};

export function useAuthenticate() {
  return useContext(AuthenticateContext);
}