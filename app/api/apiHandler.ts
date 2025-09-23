import axios, { AxiosRequestConfig } from "axios";
import config from "./../config";
import Cookies from 'js-cookie';

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

// Function to handle logout when session is revoked
const handleSessionRevoked = () => {
    // Clear all authentication cookies
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    
    // Redirect to login page
    window.location.href = '/login';
};

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

                // Handle session revocation (401 errors with specific messages)
                if (error.response.status === 401) {
                    const message = errorMessage.toLowerCase();
                    if (message.includes('session has been revoked') || 
                        message.includes('session not found') || 
                        message.includes('invalid or expired access token')) {
                        handleSessionRevoked();
                        return Promise.reject(new Error('Session revoked. Redirecting to login...'));
                    }
                }

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
