"use client";

import React, { createContext, useContext, useCallback, useRef, useState, useEffect, useMemo } from "react";
import axios from "axios";
import config from "../config";
import Cookies from "js-cookie";

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

  // Helper to check for session
  const hasSession = useCallback(() => {
    return typeof window !== "undefined" && Cookies.get("session") === "true";
  }, []);

  // Improved token validation with better error handling
  const isTokenValid = useCallback((token: string | null): boolean => {
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
      
      return exp > (now + bufferTime);
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }, []);

  // Helper to store user information
  const setSessionUserInfo = useCallback((username: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("username", username);
    }
  }, []);

  const setUserInfoInCookies = useCallback((user: User) => {
    if (typeof window !== "undefined") {
      const userData = JSON.stringify(user);
      const encryptedData = btoa(userData);
      Cookies.set("_ud", encryptedData, {
        expires: 1,
        secure: false,
        sameSite: "Lax",
      });
    }
  }, []);

  // Clear authentication
  const clearAuth = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("username");
      sessionStorage.removeItem("accessToken");
      Cookies.remove("_ud");
      Cookies.remove("session");
    }
  }, []);

  // The main function to get a valid access token - FIXED VERSION
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    // Check session first
    if (!hasSession()) {
      clearAuth();
      return null;
    }

    // Check if we already have a valid token in state
    if (accessToken && isTokenValid(accessToken)) {
      return accessToken;
    }

    // Check sessionStorage for valid token
    let sessionToken: string | null = null;
    if (typeof window !== "undefined") {
      sessionToken = sessionStorage.getItem("accessToken");
      if (sessionToken && isTokenValid(sessionToken)) {
        setAccessToken(sessionToken);
        return sessionToken;
      }
    }

    // Check cookies for valid token
    let cookieToken: string | null = null;
    if (typeof window !== "undefined") {
      cookieToken = Cookies.get("accessToken") || null;
      if (cookieToken && isTokenValid(cookieToken)) {
        setAccessToken(cookieToken);
        sessionStorage.setItem("accessToken", cookieToken);
        return cookieToken;
      }
    }

    // If no valid token exists, try to refresh
    try {
      // Prevent multiple simultaneous refresh requests
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

            // Validate the new token
            if (!isTokenValid(token)) {
              throw new Error("Received invalid token from refresh");
            }

            // Update all state consistently
            setAccessToken(token);
            setUser(userInfo);
            setIsAuthenticated(true);

            // Update storage
            if (typeof window !== "undefined") {
              sessionStorage.setItem("accessToken", token);
              Cookies.set("accessToken", token, {
                expires: 1/24, // 1 hour
                secure: false,
                sameSite: "Lax",
              });
              setSessionUserInfo(userInfo.username);
              setUserInfoInCookies(userInfo);
            }

            return token;
          } else {
            throw new Error(res.data?.message || "Failed to refresh token");
          }
        })
        .catch((error) => {
          const errorMessage = error?.response?.data?.message || "Failed to refresh token";
          setError(errorMessage);
          clearAuth();
          return null;
        })
        .finally(() => {
          refreshPromiseRef.current = null;
          setLoading(false);
        });

      return await refreshPromiseRef.current;
    } catch (error) {
      console.error('Error in getAccessToken:', error);
      setError(error instanceof Error ? error.message : "Unknown error");
      clearAuth();
      return null;
    }
  }, [accessToken, hasSession, isTokenValid, clearAuth, setSessionUserInfo, setUserInfoInCookies]);

  // Initialize authentication state on mount - SIMPLIFIED VERSION
  useEffect(() => {
    const initializeAuth = async () => {
      if (initialized) return;
      
      setLoading(true);
      setError(null);

      try {
        // Check session first
        if (!hasSession()) {
          clearAuth();
          setInitialized(true);
          setLoading(false);
          return;
        }

        // Check for existing valid token
        let existingToken: string | null = null;
        
        if (typeof window !== "undefined") {
          existingToken = sessionStorage.getItem("accessToken");
        }

        if (existingToken && isTokenValid(existingToken)) {
          setAccessToken(existingToken);
          setIsAuthenticated(true);
          
          // Try to get user info from cookies
          try {
            const userData = Cookies.get("_ud");
            if (userData) {
              const decodedUser = JSON.parse(atob(userData));
              setUser(decodedUser);
            }
          } catch (error) {
            console.warn('Failed to parse user data from cookies');
          }
        } else {
          // No valid token, try to refresh
          await getAccessToken();
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
  }, [initialized, hasSession, isTokenValid, getAccessToken, clearAuth]);

  // Memoize context value
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