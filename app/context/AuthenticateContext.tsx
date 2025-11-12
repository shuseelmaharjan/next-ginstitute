"use client";

import React, { createContext, useContext, useCallback, useState, useEffect, useMemo } from "react";
// Using sessionStorage for storing the user record (no cookies/encryption)
import axios from "axios";
import config from "../config";

type User = {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  profilePicture?: string;
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

  // Helper to check for sessionStorage user (used for fallback)
  // consider either a stored user or an explicit 'session' flag
  const hasSession = useCallback(() => {
    if (typeof window === 'undefined') return false;
    try {
      return !!(sessionStorage.getItem('user') || sessionStorage.getItem('session'));
    } catch {
      return false;
    }
  }, []);

  // Clear authentication
  const clearAuth = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("user");
      // remove session flag when clearing auth
      try { sessionStorage.removeItem("session"); } catch {}
    }
  }, []);

  const readUserFromSession = useCallback((): User | null => {
    try {
      if (typeof window === 'undefined') return null;
      const raw = sessionStorage.getItem('user');
      if (!raw) return null;
      return JSON.parse(raw) as User;
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
          profilePicture: typeof data?.profilePicture === 'string' ? data.profilePicture : undefined,
        };
        setUser(serverUser);
        setIsAuthenticated(true);
        setError(null);
        // Replace any existing sessionStorage 'user' record with the fresh server-provided user
        try {
          if (typeof window !== 'undefined') {
            // remove first as requested, then set
            sessionStorage.removeItem('user');
            sessionStorage.setItem('user', JSON.stringify(serverUser));
            // mark that a valid session exists (string 'true') so other code can quickly check
            try { sessionStorage.setItem('session', 'true'); } catch {}
          }
        } catch {
          // ignore sessionStorage failures
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
        const storedUser = readUserFromSession();
        if (storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
          // If we restored user from sessionStorage, also ensure session flag is set
          if (typeof window !== 'undefined') {
            try { sessionStorage.setItem('session', 'true'); } catch {}
          }
          return { success: true, session: true, data: storedUser };
        }
      }
      clearAuth();
      return { success: false, session: false };
    }
  }, [clearAuth, hasSession, readUserFromSession]);

  const refreshUser = useCallback(async () => {
    // Make a server call to refresh
    setLoading(true);
    await fetchWhoIsMe();
    setLoading(false);
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