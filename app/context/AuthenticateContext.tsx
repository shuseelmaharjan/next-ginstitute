"use client";

import React, { createContext, useContext, useCallback, useState, useEffect, useMemo } from "react";
import Cookies from "js-cookie";

type User = {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
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
  // Helper to check for session cookie
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

  const refreshUser = useCallback(() => {
    if (!hasSession()) {
      clearAuth();
      return;
    }
    const cookieUser = readUserFromCookie();
    if (cookieUser) {
      setUser(cookieUser);
      setIsAuthenticated(true);
    } else {
      // If no user cookie but session exists, leave as unauthenticated until next successful refresh elsewhere
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [hasSession, readUserFromCookie, clearAuth]);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      if (initialized) return;
      
      setLoading(true);
      setError(null);

      try {
        if (!hasSession()) {
          clearAuth();
        } else {
          refreshUser();
        }
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
  }, [initialized, hasSession, refreshUser, clearAuth]);

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