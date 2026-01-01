import { apiClient } from './client'

// Paginated response type
interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Types
export interface ApiKey {
  id: string
  name: string
  permissions: string[]
  last_used: string | null
  expires_at: string | null
  created_at: string
}

export interface ApiKeyWithKey extends ApiKey {
  key: string
}

export interface CreateApiKeyData {
  name: string
  permissions?: string[]
  expires_at?: string
}

export interface UpdateApiKeyData {
  name?: string
  permissions?: string[]
  expires_at?: string
}

// API Client
export const apiKeyApi = {
  async getApiKeys(): Promise<ApiKey[]> {
    const response = await apiClient.get<PaginatedResponse<ApiKey>>('/api/auth/api-keys/')
    return response.results
  },

  async getApiKey(keyId: string): Promise<ApiKey> {
    return apiClient.get(`/api/auth/api-keys/${keyId}/`)
  },

  async createApiKey(data: CreateApiKeyData): Promise<ApiKeyWithKey> {
    return apiClient.post('/api/auth/api-keys/', data)
  },

  async updateApiKey(keyId: string, data: UpdateApiKeyData): Promise<ApiKey> {
    return apiClient.patch(`/api/auth/api-keys/${keyId}/`, data)
  },

  async deleteApiKey(keyId: string): Promise<void> {
    return apiClient.delete(`/api/auth/api-keys/${keyId}/`)
  },
}
