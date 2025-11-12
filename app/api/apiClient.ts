"use client";

import axios, { AxiosRequestConfig } from "axios";
import config from "../config";

const apiURL = config.BASE_URL;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiClientParams {
  url: string;
  method: HttpMethod;
  data?: unknown;
  onError?: (message: string) => void;
  headers?: Record<string, string>;
}

export default async function apiClient<T = unknown>({
  url,
  method,
  data,
  onError,
  headers,
}: ApiClientParams): Promise<T> {
  try {
    // Build headers: if user provided headers merge them, and only set Content-Type when
    // not using FormData and when Content-Type isn't already provided.
    const isFormData = data instanceof FormData;
    const finalHeaders: Record<string, string> | undefined = (() => {
      const provided = headers ? { ...headers } : {};
      if (isFormData) {
        // let browser set Content-Type with boundary
        return Object.keys(provided).length ? provided : undefined;
      }
      // ensure Content-Type exists when not FormData
      if (!provided["Content-Type"]) provided["Content-Type"] = "application/json";
      return provided;
    })();

    const axiosConfig: AxiosRequestConfig = {
      method,
      url: apiURL + url,
      data: data as unknown as AxiosRequestConfig["data"],
      headers: finalHeaders,
      withCredentials: true,
    };

    const response = await axios<T>(axiosConfig);
    return response.data;
  } catch (error: unknown) {
    let message = "Unexpected error occurred";

    if (axios.isAxiosError(error)) {
      if (error.response) {
        const respData = error.response.data as { message?: string } | undefined;
        message = respData?.message || "Error response from server";
      } else {
        message = "No response from server";
      }
    }

    if (onError) onError(message);
    throw new Error(message);
  }
}
