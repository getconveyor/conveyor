import { apiClient, getAuthOptions } from './client';

// Types
export interface Notebook {
  id: string;
  workspace: string;
  name: string;
  description: string;
  language: string;
  kernel: string;
  content: {
    cells: Array<{
      cell_type: string;
      source: string;
      outputs: any[];
    }>;
  };
  cell_count: number;
  status: 'idle' | 'running' | 'error';
  last_executed: string | null;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNotebookData {
  name: string;
  description?: string;
  language: string;
}

export interface UpdateNotebookData {
  name?: string;
  description?: string;
  content?: Notebook['content'];
}

// API Functions
export const transformationApi = {
  // Notebooks
  async getNotebooks(language?: string): Promise<Notebook[]> {
    const params = language ? { language } : {};
    return apiClient.get('/api/transformation/notebooks/', { ...getAuthOptions(), params });
  },

  async getNotebook(id: string): Promise<Notebook> {
    return apiClient.get(`/api/transformation/notebooks/${id}/`, getAuthOptions());
  },

  async createNotebook(data: CreateNotebookData): Promise<Notebook> {
    return apiClient.post('/api/transformation/notebooks/', data, getAuthOptions());
  },

  async updateNotebook(id: string, data: UpdateNotebookData): Promise<Notebook> {
    return apiClient.patch(`/api/transformation/notebooks/${id}/`, data, getAuthOptions());
  },

  async deleteNotebook(id: string): Promise<void> {
    await apiClient.delete(`/api/transformation/notebooks/${id}/`, getAuthOptions());
  },

  async runNotebook(id: string): Promise<{ status: string; message: string; notebook_id: string; executed_at: string }> {
    return apiClient.post(`/api/transformation/notebooks/${id}/run/`, {}, getAuthOptions());
  },

  async duplicateNotebook(id: string): Promise<Notebook> {
    return apiClient.post(`/api/transformation/notebooks/${id}/duplicate/`, {}, getAuthOptions());
  },

  async exportNotebook(id: string): Promise<{ filename: string; content: any }> {
    return apiClient.get(`/api/transformation/notebooks/${id}/export/`, getAuthOptions());
  },
};
