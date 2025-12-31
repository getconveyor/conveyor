/**
 * API Client for Conveyor Backend
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RequestOptions {
  token?: string;
  workspaceId?: string;
}

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to handle errors
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
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
    const { token, workspaceId } = options;
    const config: AxiosRequestConfig = {
      headers: {},
    };

    if (token) {
      config.headers!["Authorization"] = `Bearer ${token}`;
    }

    if (workspaceId) {
      config.headers!["X-Workspace-ID"] = workspaceId;
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
