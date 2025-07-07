"use client";

import React, { createContext, useContext, useCallback, useRef, useState } from "react";
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
};

// 3 hours in seconds (for cookie expiry)
const ACCESS_TOKEN_EXPIRE_HOURS = 3;
const ACCESS_TOKEN_EXPIRE_SECONDS = ACCESS_TOKEN_EXPIRE_HOURS * 60 * 60;

const AccessTokenContext = createContext<AccessTokenContextType>({
  getAccessToken: async () => null,
  user: null,
  loading: false,
  error: null,
});

export const AccessTokenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  // Helper to check for session cookie
  const hasSession = () => Cookies.get("session") === "true";

  // Helper to store username and email in sessionStorage
  const setSessionUserInfo = (username: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("username", username);
    }
  };

  // The main function to get a valid access token
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!hasSession()) {
      setAccessToken(null);
      setUser(null);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("username");
      }
      Cookies.remove("accessToken");
      return null;
    }

    if (accessToken) {
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
          setAccessToken(null);
          setUser(null);
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("username");
          }
          Cookies.remove("accessToken");
          return null;
        }
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Failed to refresh token");
        setAccessToken(null);
        setUser(null);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("username");
        }
        Cookies.remove("accessToken");
        return null;
      })
      .finally(() => {
        setLoading(false);
        refreshPromiseRef.current = null;
      });

    return await refreshPromiseRef.current;
  }, [accessToken]);

  return (
    <AccessTokenContext.Provider value={{ getAccessToken, user, loading, error }}>
      {children}
    </AccessTokenContext.Provider>
  );
};

export function useAccessToken() {
  return useContext(AccessTokenContext);
}