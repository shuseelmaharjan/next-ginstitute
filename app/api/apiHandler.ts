"use client";

import axios, { AxiosRequestConfig } from "axios";
import config from "../config";
import Cookies from "js-cookie";
import type { ApiResponse } from "../types/api";

const apiURL = config.BASE_URL;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiHandlerParams {
    data?: unknown;
    url: string;
    method: HttpMethod;
    onWarning?: (message: string) => void;
    onError?: (message: string) => void;
    responseType?: 'json' | 'blob'; // Add response type option
}

const sendApiRequest = async <T>(
    method: HttpMethod,
    url: string,
    data?: unknown,
    responseType?: 'json' | 'blob',
): Promise<T> => {
    const token = Cookies.get("accessToken");
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
        ...(responseType === 'blob' ? { responseType: 'blob' } : {}),
    };

    const response = await axios<T>(axiosConfig);
    return response.data;
};

export default async function apiHandler<TData = unknown>({
                                                              data,
                                                              url,
                                                              method,
                                                              onWarning,
                                                              onError,
                                                              responseType = 'json',
                                                          }: ApiHandlerParams): Promise<ApiResponse<TData>> {
    try {
        if (responseType === 'blob') {
            // For blob responses, return the blob directly wrapped in success response
            const response = await sendApiRequest<TData>(method, url, data, responseType);
            return { success: true, data: response } as ApiResponse<TData>;
        } else {
            // Backend should return ApiResponse<TData> for JSON responses
            const response = await sendApiRequest<ApiResponse<TData>>(method, url, data, responseType);
            return response;
        }
    } catch (error: unknown) {
        let message = "Unexpected error occurred";

        if (typeof error === "object" && error !== null) {
            const e = error as Record<string, unknown>;
            const resp = e["response"];
            if (resp && typeof resp === "object") {
                const respObj = resp as Record<string, unknown>;
                const respData = respObj["data"];
                if (respData && typeof respData === "object") {
                    const rd = respData as Record<string, unknown>;
                    const m = rd["message"];
                    if (typeof m === "string") message = m;
                }
            }
            const m2 = e["message"];
            if (typeof m2 === "string") message = m2;
        }

        onError?.(message);
        return { success: false, message } as ApiResponse<TData>;
    }
}
