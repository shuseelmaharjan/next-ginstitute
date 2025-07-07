import axios, { AxiosRequestConfig } from "axios";
import config from "./../config";

const apiURL = config.BASE_URL;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiHandlerParams {
    data?: any;
    url: string;
    method: HttpMethod;
    accessToken?: string;
    onWarning?: (message: string) => void;
    onError?: (message: string) => void;
}

export default async function apiHandler<T = any>({
    data,
    url,
    method,
    accessToken,
    onWarning,
    onError,
}: ApiHandlerParams): Promise<T> {
    try {
        const headers: Record<string, string> = {
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
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
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                const errorMessage =
                    (error.response.data as any)?.message || "Error response from server";

                onWarning?.(errorMessage);
                onError?.(errorMessage);

                throw new Error(errorMessage);
            } else {
                onError?.("No response received");
                throw new Error("No response received");
            }
        } else {
            onError?.("Unexpected error occurred");
            throw new Error("Unexpected error occurred");
        }
    }
}
