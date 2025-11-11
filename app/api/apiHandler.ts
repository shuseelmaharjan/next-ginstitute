"use client";

import axios, { AxiosRequestConfig } from "axios";
import config from "../config";
import useAuthStore from "./authStore";
import Cookies from "js-cookie";

const apiURL = config.BASE_URL;

console.log("Requesting to API URL:", apiURL);

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiHandlerParams {
  data?: unknown;
  url: string;
  method: HttpMethod;
  onWarning?: (message: string) => void;
  onError?: (message: string) => void;
}

let refreshPromise: Promise<string | null> | null = null;

const REFRESH_ERROR_MESSAGE = "Session has been revoked or expired. Please login again.";

/**
 * Try to refresh accessToken and return it
 */
const fetchNewAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await axios.post(`${apiURL}/api/auth/refresh`, {}, { withCredentials: true });

      if (res.status === 200 && res.data?.success && res.data.data?.accessToken) {
        const newToken = res.data.data.accessToken;

        // Save to localStorage
        localStorage.setItem("accessToken", newToken);

        // Save to global state
        const setAccessToken = useAuthStore.getState().setAccessToken;
        setAccessToken(newToken);

        return newToken;
      }

      return null;
    } catch (err) {
      console.error("Token refresh failed", err);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/**
 * Send API request with current accessToken
 */
const sendApiRequest = async <T>(
  method: HttpMethod,
  url: string,
  data?: unknown,
  token?: string | null
): Promise<T> => {
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(data instanceof FormData ? {} : { "Content-Type": "application/json" }),
  };

  const axiosConfig: AxiosRequestConfig = {
    method,
    url: apiURL + url,
    data: data as any,
    headers,
    withCredentials: true,
  };

  const response = await axios<T>(axiosConfig);
  return response.data;
};

// Helper to safely extract accessToken from various response shapes without using `any`
const extractTokenFromResponse = (res: unknown): string | undefined => {
  if (!res || typeof res !== 'object') return undefined;
  const r = res as Record<string, unknown>;
  const data = r['data'];
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const at = d['accessToken'];
    if (typeof at === 'string') return at;
  }
  const atRoot = r['accessToken'];
  if (typeof atRoot === 'string') return atRoot;
  return undefined;
};

/**
 * Main API handler
 */
export default async function apiHandler<T = unknown>({
  data,
  url,
  method,
  onWarning,
  onError,
}: ApiHandlerParams): Promise<T> {
  const { accessToken, setAccessToken } = useAuthStore.getState();
  let token = accessToken;

  try {
    // 1️⃣ Prefer token from cookie (as requested)
    if (typeof window !== "undefined") {
      const cookieToken = Cookies.get("accessToken");
      if (cookieToken) {
        token = cookieToken;
        // keep auth store in sync
        setAccessToken(cookieToken);
      }
    }

    // 2️⃣ If no token available, call API without Authorization header.
    if (!token) {
      const response = await sendApiRequest<T>(method, url, data, undefined);

      // If server provided an accessToken in response body, persist it to store/localStorage
      const possibleToken = extractTokenFromResponse(response);
      if (possibleToken) {
        try {
          localStorage.setItem("accessToken", possibleToken);
        } catch {}
        setAccessToken(possibleToken);
      }

      return response;
    }

    // 3️⃣ If token exists, proceed with Authorization header
    // 1️⃣ No token in state? Try from localStorage (legacy fallback)
    if (!accessToken && typeof window !== "undefined") {
      const storedToken = localStorage.getItem("accessToken");
      if (storedToken) {
        setAccessToken(storedToken);
        token = storedToken;
      }
    }

    // 4️⃣ Proceed with request using token
    const response = await sendApiRequest<T>(method, url, data, token);

    // 5️⃣ If session expired response → refresh and retry
    const responseObj = response as unknown as { success?: boolean; message?: string };
    if (
      responseObj.success === false &&
      responseObj.message === REFRESH_ERROR_MESSAGE
    ) {
      const refreshedToken = await fetchNewAccessToken();
      if (!refreshedToken) throw new Error("Session expired. Please login again.");

      return await sendApiRequest<T>(method, url, data, refreshedToken);
    }

    return response;

  } catch (error: unknown) {
    // Extract backend error message if available without using `any`
    let message = "Unexpected error occurred";
    if (typeof error === 'object' && error !== null) {
      const e = error as Record<string, unknown>;
      const resp = e['response'];
      if (resp && typeof resp === 'object') {
        const respObj = resp as Record<string, unknown>;
        const respData = respObj['data'];
        if (respData && typeof respData === 'object') {
          const rd = respData as Record<string, unknown>;
          const m = rd['message'];
          if (typeof m === 'string') message = m;
        }
      }
      const m2 = e['message'];
      if (typeof m2 === 'string') message = m2;
    }

    if (message === REFRESH_ERROR_MESSAGE) {
      onWarning?.(message);
    } else {
      onError?.(message);
    }

    throw new Error(message);
  }
}
