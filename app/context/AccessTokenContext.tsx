"use client";

import React, { createContext, useContext, useCallback, useRef, useState, useEffect, useMemo } from "react";
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

type AccessTokenContextType = {
  getAccessToken: () => Promise<string | null>;
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  clearAuth: () => void;
};

// 3 hours in seconds (for cookie expiry)
const ACCESS_TOKEN_EXPIRE_HOURS = 3;
const ACCESS_TOKEN_EXPIRE_SECONDS = ACCESS_TOKEN_EXPIRE_HOURS * 60 * 60;

const AccessTokenContext = createContext<AccessTokenContextType>({
  getAccessToken: async () => null,
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  clearAuth: () => {},
});

export const AccessTokenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  // Helper to check for session cookie
  const hasSession = () => Cookies.get("session") === "true";

  // Helper to check if token is expired (with buffer)
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
      return exp < (now + bufferTime);
    } catch {
      return true; // Consider invalid tokens as expired
    }
  };

  // Helper to store username and email in sessionStorage
  const setSessionUserInfo = (username: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("username", username);
    }
  };

  // Helper to clear authentication
  const clearAuth = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("username");
    }
    Cookies.remove("accessToken");
  }, []);

  // The main function to get a valid access token
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!hasSession()) {
      clearAuth();
      return null;
    }

    // If we have a valid non-expired token, return it immediately
    if (accessToken && !isTokenExpired(accessToken)) {
      return accessToken;
    }

    // Prevent duplicate refresh requests
    if (refreshPromiseRef.current) {
      return await refreshPromiseRef.current;
    }

    setLoading(true);
    setError(null);

    refreshPromiseRef.current = axios
      .post(
        `${config.BASE_URL}/api/auth/refresh`,
        {},
        { withCredentials: true }
      )
      .then((res) => {
        if (res.data?.success && res.data.data?.accessToken && res.data.data?.user) {
          const token = res.data.data.accessToken;
          const userInfo = res.data.data.user;

          setAccessToken(token);
          setUser(userInfo);
          setIsAuthenticated(true);

          // Set accessToken cookie for 3 hours
          Cookies.set("accessToken", token, {
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            expires: ACCESS_TOKEN_EXPIRE_SECONDS / (60 * 60 * 24), // days (fractional)
          });

          // Set username and email in sessionStorage (replace if exists)
          setSessionUserInfo(userInfo.username);

          return token;
        } else {
          setError(res.data?.message || "Failed to refresh token");
          clearAuth();
          return null;
        }
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Failed to refresh token");
        clearAuth();
        return null;
      })
      .finally(() => {
        setLoading(false);
        refreshPromiseRef.current = null;
      });

    return await refreshPromiseRef.current;
  }, [accessToken, clearAuth]);

  // Initialize authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (initialized) return;
      
      setLoading(true);
      
      // First check if we have a session
      if (!hasSession()) {
        clearAuth();
        setLoading(false);
        setInitialized(true);
        return;
      }

      // Check if we have a valid access token in cookies
      const existingToken = Cookies.get("accessToken");
      if (existingToken && !isTokenExpired(existingToken)) {
        // Try to get user info from session storage
        const cachedUserProfile = sessionStorage.getItem('userProfile');
        if (cachedUserProfile) {
          try {
            const userInfo = JSON.parse(cachedUserProfile);
            setAccessToken(existingToken);
            setUser(userInfo);
            setIsAuthenticated(true);
            setLoading(false);
            setInitialized(true);
            return;
          } catch (parseError) {
            console.warn('Failed to parse cached user profile');
          }
        }
      }

      // If no valid token or user info, try to refresh
      try {
        const token = await getAccessToken();
        if (token) {
          setIsAuthenticated(true);
        } else {
          clearAuth();
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        clearAuth();
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();
  }, [initialized]); // Remove getAccessToken and clearAuth from dependencies

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    getAccessToken,
    user,
    loading,
    error,
    isAuthenticated,
    clearAuth
  }), [getAccessToken, user, loading, error, isAuthenticated, clearAuth]);

  return (
    <AccessTokenContext.Provider value={contextValue}>
      {children}
    </AccessTokenContext.Provider>
  );
};

export function useAccessToken() {
  return useContext(AccessTokenContext);
}