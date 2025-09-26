"use client";

import axios, { AxiosRequestConfig } from "axios";
import config from "../config";

const apiURL = config.BASE_URL;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiClientParams {
  url: string;
  method: HttpMethod;
  data?: any;
  onError?: (message: string) => void;
}

export default async function apiClient<T = any>({
  url,
  method,
  data,
  onError,
}: ApiClientParams): Promise<T> {
  try {
    const axiosConfig: AxiosRequestConfig = {
      method,
      url: apiURL + url,
      data,
      headers: data instanceof FormData ? undefined : { "Content-Type": "application/json" },
      withCredentials: true,
    };

    const response = await axios<T>(axiosConfig);
    return response.data;
  } catch (error: any) {
    let message = "Unexpected error occurred";

    if (axios.isAxiosError(error)) {
      if (error.response) {
        message = (error.response.data as any)?.message || "Error response from server";
      } else {
        message = "No response from server";
      }
    }

    if (onError) onError(message);
    throw new Error(message);
  }
}
