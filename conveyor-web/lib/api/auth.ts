/**
 * Authentication API Service
 */

import apiClient from './client';

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar?: string;
  role: 'admin' | 'developer' | 'analyst' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  preferences: Record<string, any>;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterData {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  avatar?: string;
  preferences?: Record<string, any>;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/api/auth/register/', data);
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/api/auth/login/', data);
  }

  /**
   * Logout user (blacklist refresh token)
   */
  async logout(refreshToken: string, accessToken: string): Promise<void> {
    return apiClient.post(
      '/api/auth/logout/',
      { refresh_token: refreshToken },
      { token: accessToken }
    );
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ access: string }> {
    return apiClient.post<{ access: string }>('/api/auth/token/refresh/', {
      refresh: refreshToken,
    });
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(token: string): Promise<User> {
    return apiClient.get<User>('/api/users/me/', { token });
  }

  /**
   * Update current user profile
   */
  async updateProfile(
    data: UpdateProfileData,
    token: string
  ): Promise<User> {
    return apiClient.patch<User>('/api/users/update_profile/', data, {
      token,
    });
  }

  /**
   * Change password
   */
  async changePassword(
    data: ChangePasswordData,
    token: string
  ): Promise<{ detail: string }> {
    return apiClient.post<{ detail: string }>(
      '/api/users/change_password/',
      data,
      { token }
    );
  }

  /**
   * Get user preferences
   */
  async getPreferences(token: string): Promise<Record<string, any>> {
    return apiClient.get<Record<string, any>>('/api/users/preferences/', {
      token,
    });
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    preferences: Record<string, any>,
    token: string,
    merge = true
  ): Promise<Record<string, any>> {
    const method = merge ? 'patch' : 'put';
    return apiClient[method]<Record<string, any>>(
      '/api/users/update_preferences/',
      preferences,
      { token }
    );
  }
}

export const authService = new AuthService();
export default authService;
