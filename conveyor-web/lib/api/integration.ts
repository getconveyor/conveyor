import { apiClient, getAuthOptions } from "./client";

// Paginated response type
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Types

export interface Source {
  id: string;
  workspace?: string;
  name: string;
  type: string;
  host?: string;
  port?: string;
  database?: string;
  username?: string;
  ssl?: boolean;
  status: "active" | "inactive" | "error" | "testing";
  last_tested: string | null;
  config?: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSourceData {
  name: string;
  type: string;
  host: string;
  port?: string;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  config?: Record<string, any>;
}

export interface SourceType {
  id: string;
  name: string;
  category: "api" | "database" | "cloud" | "file";
  description: string;
  auth_types: string[];
  documentation: string;
  popular?: boolean;
}

export interface DataSource {
  id: string;
  workspace?: string;
  source?: string;
  source_details?: {
    name: string;
    type: string;
  };
  // List view fields
  source_name?: string;
  source_type?: string;

  name: string;
  type: string;
  tables?: Record<string, any>;
  status: "active" | "inactive" | "error" | "syncing";
  last_sync: string | null;
  record_count: number;
  created_at: string;
  updated_at?: string;
}

export interface CreateDataSource {
  name: string;
  description?: string;
  source: string;
  config?: Record<string, any>;
}

export interface Pipeline {
  id: string;
  workspace?: string;
  name: string;
  description?: string;
  status: "active" | "paused" | "error" | "running" | "idle";

  source?: string;
  source_details?: {
    name: string;
    type: string;
  };
  // List view fields
  source_name?: string;

  destination?: string;
  destination_details?: {
    name: string;
    type: string;
  };
  // List view fields
  destination_name?: string;

  schedule?: string;
  last_run: string | null;
  next_run: string | null;
  run_count: number;
  success_rate: number;
  records_processed?: number;
  config?: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  is_scheduled: boolean;
}

export interface CreatePipelineData {
  name: string;
  description?: string;
  source: string;
  destination: string;
  config?: Record<string, any>;
  schedule?: string;
}

export interface PipelineRun {
  id: string;
  pipeline?: string;
  pipeline_name?: string;
  status: "pending" | "running" | "success" | "failed" | "cancelled";
  start_time: string | null;
  end_time: string | null;
  duration: number | null;
  records_processed: number | null;
  bytes_processed?: number | null;
  errors?: Record<string, any> | null;
  metrics?: Record<string, any> | null;
  triggered_by?: "manual" | "schedule" | "api";
  created_at: string;
}

export interface Schedule {
  id: string;
  workspace?: string;
  pipeline?: string;
  pipeline_name?: string;
  name: string;
  schedule_type: ScheduleType;
  schedule_config: ScheduleConfig;
  schedule_description?: string;
  cron_expression: string;
  timezone?: string;
  enabled: boolean;
  last_run: string | null;
  next_run: string | null;
  created_at?: string;
  updated_at?: string;
}

// Schedule types for user-friendly configuration
export type ScheduleType =
  | "manual"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "cron";

export interface ScheduleConfig {
  // For hourly
  interval?: number; // Every N hours (1-24)

  // For daily, weekly, monthly
  hour?: number; // 0-23
  minute?: number; // 0-59

  // For weekly
  days?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat

  // For monthly
  day?: number; // 1-31

  // For cron
  expression?: string; // Raw cron expression
}

export interface CreateScheduleData {
  pipeline: string;
  name: string;
  schedule_type: ScheduleType;
  schedule_config: ScheduleConfig;
  timezone?: string;
  enabled?: boolean;
}

// Schema Discovery Types
export interface StreamInfo {
  name: string;
  schema?: string; // database schema (e.g., 'public')
  key_properties?: string[];
  replication_method?: string;
  row_count?: number;
}

export interface SourceSchema {
  source_id: string;
  connector_type: string;
  streams: StreamInfo[];
  schemas: Record<string, any>;
  timestamp: string;
}

// API Client
export const integrationApi = {
  // Sources
  async getSources(): Promise<Source[]> {
    const response = await apiClient.get<PaginatedResponse<Source>>(
      "/api/integration/sources/",
      getAuthOptions()
    );
    return response.results;
  },

  async getSource(id: string): Promise<Source> {
    return apiClient.get(`/api/integration/sources/${id}/`, getAuthOptions());
  },

  async getSourceCatalog(): Promise<{
    source_types: SourceType[];
  }> {
    return apiClient.get("/api/integration/sources/catalog/", getAuthOptions());
  },

  async createSource(data: CreateSourceData): Promise<Source> {
    return apiClient.post("/api/integration/sources/", data, getAuthOptions());
  },

  async updateSource(id: string, data: Partial<Source>): Promise<Source> {
    return apiClient.patch(
      `/api/integration/sources/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteSource(id: string): Promise<void> {
    return apiClient.delete(
      `/api/integration/sources/${id}/`,
      getAuthOptions()
    );
  },

  async testSource(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(
      `/api/integration/sources/${id}/test/`,
      {},
      getAuthOptions()
    );
  },

  async getSourceSchema(id: string): Promise<SourceSchema> {
    return apiClient.get<SourceSchema>(
      `/api/integration/sources/${id}/schema/`,
      getAuthOptions()
    );
  },

  // Data Sources
  async getDataSources(): Promise<DataSource[]> {
    const response = await apiClient.get<PaginatedResponse<DataSource>>(
      "/api/integration/data-sources/",
      getAuthOptions()
    );
    return response.results;
  },

  async getDataSource(id: string): Promise<DataSource> {
    return apiClient.get(
      `/api/integration/data-sources/${id}/`,
      getAuthOptions()
    );
  },

  async syncDataSource(id: string): Promise<void> {
    return apiClient.post(
      `/api/integration/data-sources/${id}/sync/`,
      getAuthOptions()
    );
  },

  async createDataSource(data: CreateDataSource): Promise<DataSource> {
    return apiClient.post(
      "/api/integration/data-sources/",
      data,
      getAuthOptions()
    );
  },

  async updateDataSource(
    id: string,
    data: Partial<DataSource>
  ): Promise<DataSource> {
    return apiClient.patch(
      `/api/integration/data-sources/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteDataSource(id: string): Promise<void> {
    return apiClient.delete(
      `/api/integration/data-sources/${id}/`,
      getAuthOptions()
    );
  },

  // Pipelines
  async getPipelines(): Promise<Pipeline[]> {
    const response = await apiClient.get<PaginatedResponse<Pipeline>>(
      "/api/integration/pipelines/",
      getAuthOptions()
    );
    return response.results;
  },

  async getPipeline(id: string): Promise<Pipeline> {
    return apiClient.get(`/api/integration/pipelines/${id}/`, getAuthOptions());
  },

  async createPipeline(data: CreatePipelineData): Promise<Pipeline> {
    return apiClient.post(
      "/api/integration/pipelines/",
      data,
      getAuthOptions()
    );
  },

  async updatePipeline(id: string, data: Partial<Pipeline>): Promise<Pipeline> {
    return apiClient.patch(
      `/api/integration/pipelines/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deletePipeline(id: string): Promise<void> {
    return apiClient.delete(
      `/api/integration/pipelines/${id}/`,
      getAuthOptions()
    );
  },

  async triggerPipeline(id: string): Promise<PipelineRun> {
    return apiClient.post(
      `/api/integration/pipelines/${id}/run/`,
      {},
      getAuthOptions()
    );
  },

  async pausePipeline(id: string): Promise<void> {
    return apiClient.post(
      `/api/integration/pipelines/${id}/pause/`,
      {},
      getAuthOptions()
    );
  },

  async resumePipeline(id: string): Promise<void> {
    return apiClient.post(
      `/api/integration/pipelines/${id}/resume/`,
      {},
      getAuthOptions()
    );
  },

  async getPipelineStats(id: string): Promise<any> {
    return apiClient.get(
      `/api/integration/pipelines/${id}/stats/`,
      getAuthOptions()
    );
  },

  // Pipeline Runs
  async getPipelineRuns(pipelineId?: string): Promise<PipelineRun[]> {
    const query = pipelineId ? `?pipeline=${pipelineId}` : "";
    const response = await apiClient.get<PaginatedResponse<PipelineRun>>(
      `/api/integration/pipeline-runs/${query}`,
      getAuthOptions()
    );
    return response.results;
  },

  async getPipelineRun(id: string): Promise<PipelineRun> {
    return apiClient.get(
      `/api/integration/pipeline-runs/${id}/`,
      getAuthOptions()
    );
  },

  async cancelPipelineRun(id: string): Promise<void> {
    return apiClient.post(
      `/api/integration/pipeline-runs/${id}/cancel/`,
      {},
      getAuthOptions()
    );
  },

  // Schedules
  async getSchedules(): Promise<Schedule[]> {
    const response = await apiClient.get<PaginatedResponse<Schedule>>(
      "/api/integration/schedules/",
      getAuthOptions()
    );
    return response.results;
  },

  async getSchedule(id: string): Promise<Schedule> {
    return apiClient.get(`/api/integration/schedules/${id}/`, getAuthOptions());
  },

  async createSchedule(data: CreateScheduleData): Promise<Schedule> {
    return apiClient.post(
      "/api/integration/schedules/",
      data,
      getAuthOptions()
    );
  },

  async updateSchedule(id: string, data: Partial<Schedule>): Promise<Schedule> {
    return apiClient.patch(
      `/api/integration/schedules/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteSchedule(id: string): Promise<void> {
    return apiClient.delete(
      `/api/integration/schedules/${id}/`,
      getAuthOptions()
    );
  },

  async enableSchedule(id: string): Promise<void> {
    return apiClient.post(
      `/api/integration/schedules/${id}/enable/`,
      {},
      getAuthOptions()
    );
  },

  async disableSchedule(id: string): Promise<void> {
    return apiClient.post(
      `/api/integration/schedules/${id}/disable/`,
      {},
      getAuthOptions()
    );
  },
};
