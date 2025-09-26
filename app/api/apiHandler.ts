"use client";

import axios, { AxiosRequestConfig } from "axios";
import config from "../config";
import useAuthStore from "./authStore";

const apiURL = config.BASE_URL;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiHandlerParams {
  data?: any;
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
  data: any,
  token: string
): Promise<T> => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(data instanceof FormData ? {} : { "Content-Type": "application/json" }),
  };

  const axiosConfig: AxiosRequestConfig = {
    method,
    url: apiURL + url,
    data,
    headers,
    withCredentials: true,
  };

  const response = await axios<T>(axiosConfig);
  return response.data;
};

/**
 * Main API handler
 */
export default async function apiHandler<T = any>({
  data,
  url,
  method,
  onWarning,
  onError,
}: ApiHandlerParams): Promise<T> {
  const { accessToken, setAccessToken } = useAuthStore.getState();
  let token = accessToken;

  try {
    // 1️⃣ No token in state? Try from localStorage
    if (!token) {
      const storedToken = localStorage.getItem("accessToken");
      if (storedToken) {
        setAccessToken(storedToken);
        token = storedToken;
      }
    }

    // 2️⃣ Still no token? Try to fetch a new one
    if (!token) {
      token = await fetchNewAccessToken();
      if (!token) throw new Error("Unable to retrieve access token.");
    }

    // 3️⃣ Proceed with request
    const response = await sendApiRequest<T>(method, url, data, token);

    // 4️⃣ If session expired response → refresh and retry
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

  } catch (error: any) {
    const message = error?.message || "Unexpected error occurred";

    if (message === REFRESH_ERROR_MESSAGE) {
      onWarning?.(message);
    } else {
      onError?.(message);
    }

    throw new Error(message);
  }
}
