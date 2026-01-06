import { apiClient, getAuthOptions } from "./client";

// Paginated response type
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Types
export interface Notebook {
  id: string;
  workspace: string;
  name: string;
  description: string;
  language: string;
  kernel: string;
  framework:
    | "scikit-learn"
    | "tensorflow"
    | "pytorch"
    | "huggingface"
    | "xgboost"
    | "general";
  content: {
    cells: Array<{
      cell_type: string;
      source: string;
      outputs: any[];
    }>;
  };
  cell_count: number;
  status: "idle" | "running" | "error";
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
  framework?: string;
}

export interface UpdateNotebookData {
  name?: string;
  description?: string;
  content?: Notebook["content"];
  framework?: string;
}

export interface Transformation {
  id: string;
  workspace: string;
  pipeline: string | null;
  name: string;
  description: string;
  type:
    | "filter"
    | "map"
    | "aggregate"
    | "join"
    | "pivot"
    | "unpivot"
    | "custom";
  config: Record<string, any>;
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
  status: "active" | "inactive" | "error";
  order: number;
  last_run: string | null;
  records_processed: number;
  avg_execution_time: number;
  created_by: string | null;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface TransformationRule {
  id: string;
  transformation: string;
  name: string;
  description: string;
  rule_type:
    | "rename"
    | "cast"
    | "calculate"
    | "filter"
    | "replace"
    | "split"
    | "merge"
    | "custom";
  config: Record<string, any>;
  enabled: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface DataQualityCheck {
  id: string;
  workspace: string;
  name: string;
  description: string;
  check_type: string;
  table_name: string;
  column_name: string | null;
  expression: string;
  threshold: number;
  severity: "critical" | "high" | "medium" | "low";
  is_active: boolean;
  schedule: string | null;
  last_run: string | null;
  created_by: string | null;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface DataQualityResult {
  id: string;
  check: string;
  check_name?: string;
  passed: boolean;
  actual_value: string | null;
  expected_value: string | null;
  records_checked: number;
  records_failed: number;
  failure_percentage: number;
  error_message: string | null;
  execution_time_ms: number;
  executed_at: string;
}

// API Functions
export const transformationApi = {
  // Notebooks
  async getNotebooks(params?: {
    language?: string;
    framework?: string;
  }): Promise<Notebook[]> {
    const response = await apiClient.get<PaginatedResponse<Notebook>>(
      "/api/transformation/notebooks/",
      { ...getAuthOptions(), params }
    );
    return response.results || response;
  },

  async getNotebook(id: string): Promise<Notebook> {
    return apiClient.get(
      `/api/transformation/notebooks/${id}/`,
      getAuthOptions()
    );
  },

  async createNotebook(data: CreateNotebookData): Promise<Notebook> {
    return apiClient.post(
      "/api/transformation/notebooks/",
      data,
      getAuthOptions()
    );
  },

  async updateNotebook(
    id: string,
    data: UpdateNotebookData
  ): Promise<Notebook> {
    return apiClient.patch(
      `/api/transformation/notebooks/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteNotebook(id: string): Promise<void> {
    await apiClient.delete(
      `/api/transformation/notebooks/${id}/`,
      getAuthOptions()
    );
  },

  async runNotebook(id: string): Promise<{
    status: string;
    message: string;
    notebook_id: string;
    executed_at: string;
  }> {
    return apiClient.post(
      `/api/transformation/notebooks/${id}/run/`,
      {},
      getAuthOptions()
    );
  },

  async duplicateNotebook(id: string): Promise<Notebook> {
    return apiClient.post(
      `/api/transformation/notebooks/${id}/duplicate/`,
      {},
      getAuthOptions()
    );
  },

  async exportNotebook(
    id: string
  ): Promise<{ filename: string; content: any }> {
    return apiClient.get(
      `/api/transformation/notebooks/${id}/export/`,
      getAuthOptions()
    );
  },

  // Transformations
  async getTransformations(params?: {
    pipeline?: string;
    type?: string;
    status?: string;
  }): Promise<Transformation[]> {
    const response = await apiClient.get<PaginatedResponse<Transformation>>(
      "/api/transformation/transformations/",
      { ...getAuthOptions(), params }
    );
    return response.results;
  },

  async getTransformation(id: string): Promise<Transformation> {
    return apiClient.get<Transformation>(
      `/api/transformation/transformations/${id}/`,
      getAuthOptions()
    );
  },

  async createTransformation(
    data: Partial<Transformation>
  ): Promise<Transformation> {
    return apiClient.post<Transformation>(
      "/api/transformation/transformations/",
      data,
      getAuthOptions()
    );
  },

  async updateTransformation(
    id: string,
    data: Partial<Transformation>
  ): Promise<Transformation> {
    return apiClient.patch<Transformation>(
      `/api/transformation/transformations/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteTransformation(id: string): Promise<void> {
    return apiClient.delete(
      `/api/transformation/transformations/${id}/`,
      getAuthOptions()
    );
  },

  async executeTransformation(
    id: string
  ): Promise<{ status: string; message: string; records_processed: number }> {
    return apiClient.post(
      `/api/transformation/transformations/${id}/execute/`,
      {},
      getAuthOptions()
    );
  },

  // Transformation Rules
  async getTransformationRules(
    transformationId?: string
  ): Promise<TransformationRule[]> {
    const params = transformationId ? { transformation: transformationId } : {};
    const response = await apiClient.get<PaginatedResponse<TransformationRule>>(
      "/api/transformation/transformation-rules/",
      { ...getAuthOptions(), params }
    );
    return response.results;
  },

  async getTransformationRule(id: string): Promise<TransformationRule> {
    return apiClient.get<TransformationRule>(
      `/api/transformation/transformation-rules/${id}/`,
      getAuthOptions()
    );
  },

  async createTransformationRule(
    data: Partial<TransformationRule>
  ): Promise<TransformationRule> {
    return apiClient.post<TransformationRule>(
      "/api/transformation/transformation-rules/",
      data,
      getAuthOptions()
    );
  },

  async updateTransformationRule(
    id: string,
    data: Partial<TransformationRule>
  ): Promise<TransformationRule> {
    return apiClient.patch<TransformationRule>(
      `/api/transformation/transformation-rules/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteTransformationRule(id: string): Promise<void> {
    return apiClient.delete(
      `/api/transformation/transformation-rules/${id}/`,
      getAuthOptions()
    );
  },

  // Data Quality Checks
  async getQualityChecks(params?: {
    check_type?: string;
    severity?: string;
    is_active?: boolean;
  }): Promise<DataQualityCheck[]> {
    const response = await apiClient.get<PaginatedResponse<DataQualityCheck>>(
      "/api/transformation/quality-checks/",
      { ...getAuthOptions(), params }
    );
    return response.results;
  },

  async getQualityCheck(id: string): Promise<DataQualityCheck> {
    return apiClient.get<DataQualityCheck>(
      `/api/transformation/quality-checks/${id}/`,
      getAuthOptions()
    );
  },

  async createQualityCheck(
    data: Partial<DataQualityCheck>
  ): Promise<DataQualityCheck> {
    return apiClient.post<DataQualityCheck>(
      "/api/transformation/quality-checks/",
      data,
      getAuthOptions()
    );
  },

  async updateQualityCheck(
    id: string,
    data: Partial<DataQualityCheck>
  ): Promise<DataQualityCheck> {
    return apiClient.patch<DataQualityCheck>(
      `/api/transformation/quality-checks/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteQualityCheck(id: string): Promise<void> {
    return apiClient.delete(
      `/api/transformation/quality-checks/${id}/`,
      getAuthOptions()
    );
  },

  async runQualityCheck(id: string): Promise<DataQualityResult> {
    return apiClient.post<DataQualityResult>(
      `/api/transformation/quality-checks/${id}/run/`,
      {},
      getAuthOptions()
    );
  },

  // Data Quality Results
  async getQualityResults(params?: {
    check?: string;
    passed?: boolean;
  }): Promise<DataQualityResult[]> {
    const response = await apiClient.get<PaginatedResponse<DataQualityResult>>(
      "/api/transformation/quality-results/",
      { ...getAuthOptions(), params }
    );
    return response.results;
  },

  async getQualityResult(id: string): Promise<DataQualityResult> {
    return apiClient.get<DataQualityResult>(
      `/api/transformation/quality-results/${id}/`,
      getAuthOptions()
    );
  },

  // Jobs - Get notebooks that have been executed (transformation jobs)
  async getJobs(): Promise<Notebook[]> {
    const response = await apiClient.get<PaginatedResponse<Notebook>>(
      "/api/transformation/notebooks/",
      getAuthOptions()
    );
    // Return all notebooks sorted by last_executed (most recent first)
    const notebooks = response.results || response;
    return notebooks
      .filter((n: Notebook) => n.last_executed !== null)
      .sort((a: Notebook, b: Notebook) => {
        const dateA = a.last_executed ? new Date(a.last_executed).getTime() : 0;
        const dateB = b.last_executed ? new Date(b.last_executed).getTime() : 0;
        return dateB - dateA;
      });
  },

  // Get all notebooks (for job scheduling)
  async getSchedulableNotebooks(): Promise<Notebook[]> {
    const response = await apiClient.get<PaginatedResponse<Notebook>>(
      "/api/transformation/notebooks/",
      getAuthOptions()
    );
    return response.results || response;
  },
};

export default transformationApi;
