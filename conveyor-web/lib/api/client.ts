/**
 * API Client for Conveyor Backend
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import { API_TIMEOUT, API_RETRY_ATTEMPTS } from "@/lib/constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RequestOptions {
  token?: string;
  workspaceId?: string;
  params?: any;
}

interface FailedRequest {
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}

class ApiClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: FailedRequest[] = [];
  private refreshTimeout: NodeJS.Timeout | null = null;
  private maxRetryAttempts = API_RETRY_ATTEMPTS;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: API_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add response interceptor to handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Don't retry token refresh endpoint or if already retried
        const isRefreshEndpoint = originalRequest.url?.includes(
          "/auth/token/refresh"
        );

        // If error is 401 and we haven't tried to refresh yet
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !isRefreshEndpoint
        ) {
          if (this.isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers["Authorization"] = `Bearer ${token}`;
                return this.axiosInstance(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          // Set a timeout for token refresh (5 seconds)
          const refreshPromise = (async () => {
            // Get refresh token from localStorage
            const tokensStr = localStorage.getItem("auth_tokens");
            if (!tokensStr) {
              throw new Error("No refresh token available");
            }

            const tokens = JSON.parse(tokensStr);
            if (!tokens.refresh) {
              throw new Error("Refresh token missing");
            }

            // Refresh the token
            const response = await this.axiosInstance.post<{ access: string }>(
              "/api/auth/token/refresh/",
              { refresh: tokens.refresh },
              { timeout: 5000 } // 5 second timeout for token refresh
            );

            return response.data.access;
          })();

          this.refreshTimeout = setTimeout(() => {
            this.isRefreshing = false;
            this.failedQueue.forEach((promise) => {
              promise.reject(new Error("Token refresh timeout"));
            });
            this.failedQueue = [];
          }, 5000);

          try {
            const newAccessToken = await refreshPromise;

            if (this.refreshTimeout) {
              clearTimeout(this.refreshTimeout);
              this.refreshTimeout = null;
            }

            // Update tokens in localStorage
            const tokensStr = localStorage.getItem("auth_tokens");
            if (tokensStr) {
              const tokens = JSON.parse(tokensStr);
              const updatedTokens = { ...tokens, access: newAccessToken };
              localStorage.setItem("auth_tokens", JSON.stringify(updatedTokens));
            }

            // Update the failed request with new token
            originalRequest.headers[
              "Authorization"
            ] = `Bearer ${newAccessToken}`;

            // Process the queued requests
            this.failedQueue.forEach((promise) => {
              promise.resolve(newAccessToken);
            });
            this.failedQueue = [];

            this.isRefreshing = false;

            // Retry the original request
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.isRefreshing = false;

            // Token refresh failed, clear auth and redirect to login
            this.failedQueue.forEach((promise) => {
              promise.reject(refreshError);
            });
            this.failedQueue = [];

            // Clear auth data
            localStorage.removeItem("auth_tokens");
            localStorage.removeItem("auth_user");
            localStorage.removeItem("currentWorkspaceId");

            // Redirect to login if we're in the browser (only once)
            if (
              typeof window !== "undefined" &&
              !window.location.pathname.includes("/login")
            ) {
              window.location.href = "/login";
            }

            return Promise.reject(refreshError);
          }
        }

        // For other errors, return a formatted error message
        const message =
          (error.response?.data as any)?.message ||
          (error.response?.data as any)?.detail ||
          error.message ||
          "API request failed";
        throw new Error(message);
      }
    );
  }

  private getConfig(options: RequestOptions = {}): AxiosRequestConfig {
    const { token, workspaceId, params } = options;
    const config: AxiosRequestConfig = {
      headers: {},
    };

    if (token) {
      config.headers!["Authorization"] = `Bearer ${token}`;
    }

    if (workspaceId) {
      config.headers!["X-Workspace-ID"] = workspaceId;
    }

    if (params) {
      config.params = params;
    }

    return config;
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const config = this.getConfig(options);

    const response = await this.axiosInstance.get<T>(endpoint, config);
    return response.data;
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const config = this.getConfig(options);
    const response = await this.axiosInstance.post<T>(endpoint, data, config);
    return response.data;
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const config = this.getConfig(options);
    const response = await this.axiosInstance.put<T>(endpoint, data, config);
    return response.data;
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const config = this.getConfig(options);
    const response = await this.axiosInstance.patch<T>(endpoint, data, config);
    return response.data;
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const config = this.getConfig(options);
    const response = await this.axiosInstance.delete<T>(endpoint, config);
    return response.data;
  }

  async uploadFile<T>(
    endpoint: string,
    formData: FormData,
    options: RequestOptions = {}
  ): Promise<T> {
    const { token, workspaceId } = options;
    const config: AxiosRequestConfig = {
      headers: {
        // Don't set Content-Type for FormData - axios will set it with boundary
      },
    };

    if (token) {
      config.headers!["Authorization"] = `Bearer ${token}`;
    }

    if (workspaceId) {
      config.headers!["X-Workspace-ID"] = workspaceId;
    }

    const response = await this.axiosInstance.post<T>(
      endpoint,
      formData,
      config
    );
    return response.data;
  }
}
// Helper to get auth headers
export function getAuthOptions() {
  // Get tokens from localStorage (stored by AuthContext)
  const tokensStr = localStorage.getItem("auth_tokens");
  let token: string | undefined;

  if (tokensStr) {
    try {
      const tokens = JSON.parse(tokensStr);
      token = tokens.access;
    } catch (e) {
      console.error("Failed to parse auth tokens:", e);
    }
  }

  return {
    token,
    workspaceId: localStorage.getItem("currentWorkspaceId") || undefined,
  };
}

export const apiClient = new ApiClient(API_URL);
export default apiClient;
