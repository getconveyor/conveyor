/**
 * Streaming API client for real-time analytics - stream sources, pipelines, events, alerts
 */

import { apiClient, getAuthOptions } from "./client";

// Paginated response type
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Types matching backend models

export interface StreamSource {
  id: string;
  workspace: string;
  name: string;
  description: string;
  source_type:
    | "kafka"
    | "kinesis"
    | "pubsub"
    | "eventhub"
    | "websocket"
    | "other";
  connection_config?: Record<string, any>;
  schema_config: Record<string, any>;
  status: "active" | "inactive" | "error";
  error_message: string | null;
  metrics: Record<string, any>;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface StreamPipeline {
  id: string;
  workspace: string;
  name: string;
  description: string;
  source: string;
  source_name: string;
  transformations: Record<string, any>[];
  destination_config: Record<string, any>;
  parallelism: number;
  checkpoint_interval_ms: number;
  status: "running" | "stopped" | "error" | "starting" | "stopping";
  error_message: string | null;
  started_at: string | null;
  stopped_at: string | null;
  metrics: Record<string, any>;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface StreamCheckpoint {
  id: string;
  pipeline: string;
  pipeline_name: string;
  checkpoint_id: string;
  state: Record<string, any>;
  offset: Record<string, any>;
  created_at: string;
}

export interface StreamEvent {
  id: string;
  pipeline: string;
  pipeline_name: string;
  event_type: string;
  event_data: Record<string, any>;
  event_time: string;
  processing_time: string | null;
  watermark: string | null;
  created_at: string;
}

export interface StreamAlert {
  id: string;
  workspace: string;
  pipeline: string | null;
  pipeline_name: string | null;
  name: string;
  description: string;
  condition: string;
  threshold: number;
  window_size_seconds: number;
  severity: "critical" | "error" | "warning" | "info";
  notification_channels: Record<string, any>;
  is_active: boolean;
  last_triggered: string | null;
  trigger_count: number;
  created_at: string;
  updated_at: string;
}

export interface StreamMetrics {
  throughput_per_second: number;
  latency_ms: number;
  records_processed: number;
  records_failed: number;
  backpressure: number;
  checkpoint_duration_ms: number;
  uptime_seconds: number;
}

export interface StreamDashboard {
  total_pipelines: number;
  running_pipelines: number;
  failed_pipelines: number;
  total_sources: number;
  active_sources: number;
  total_throughput: number;
  avg_latency_ms: number;
  active_alerts: number;
}

export interface SourceMetrics {
  throughput_per_second: number;
  records_received: number;
  bytes_received: number;
  errors: number;
}

// API Client
export const streamingApi = {
  // Stream Sources
  async getSources(params?: {
    type?: string;
    status?: string;
  }): Promise<StreamSource[]> {
    const response = await apiClient.get<PaginatedResponse<StreamSource>>(
      "/api/streaming/sources/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getSource(id: string): Promise<StreamSource> {
    return apiClient.get<StreamSource>(
      `/api/streaming/sources/${id}/`,
      getAuthOptions()
    );
  },

  async createSource(data: Partial<StreamSource>): Promise<StreamSource> {
    return apiClient.post<StreamSource>(
      "/api/streaming/sources/",
      data,
      getAuthOptions()
    );
  },

  async updateSource(
    id: string,
    data: Partial<StreamSource>
  ): Promise<StreamSource> {
    return apiClient.patch<StreamSource>(
      `/api/streaming/sources/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteSource(id: string): Promise<void> {
    return apiClient.delete(`/api/streaming/sources/${id}/`, getAuthOptions());
  },

  async testSourceConnection(
    id: string
  ): Promise<{ status: string; message: string }> {
    return apiClient.post<{ status: string; message: string }>(
      `/api/streaming/sources/${id}/test_connection/`,
      {},
      getAuthOptions()
    );
  },

  async getSourceMetrics(id: string): Promise<SourceMetrics> {
    return apiClient.get<SourceMetrics>(
      `/api/streaming/sources/${id}/metrics/`,
      getAuthOptions()
    );
  },

  // Stream Pipelines
  async getPipelines(params?: {
    status?: string;
    source?: string;
  }): Promise<StreamPipeline[]> {
    const response = await apiClient.get<PaginatedResponse<StreamPipeline>>(
      "/api/streaming/pipelines/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getPipeline(id: string): Promise<StreamPipeline> {
    return apiClient.get<StreamPipeline>(
      `/api/streaming/pipelines/${id}/`,
      getAuthOptions()
    );
  },

  async createPipeline(data: Partial<StreamPipeline>): Promise<StreamPipeline> {
    return apiClient.post<StreamPipeline>(
      "/api/streaming/pipelines/",
      data,
      getAuthOptions()
    );
  },

  async updatePipeline(
    id: string,
    data: Partial<StreamPipeline>
  ): Promise<StreamPipeline> {
    return apiClient.patch<StreamPipeline>(
      `/api/streaming/pipelines/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deletePipeline(id: string): Promise<void> {
    return apiClient.delete(
      `/api/streaming/pipelines/${id}/`,
      getAuthOptions()
    );
  },

  async startPipeline(id: string): Promise<StreamPipeline> {
    return apiClient.post<StreamPipeline>(
      `/api/streaming/pipelines/${id}/start/`,
      {},
      getAuthOptions()
    );
  },

  async stopPipeline(id: string): Promise<StreamPipeline> {
    return apiClient.post<StreamPipeline>(
      `/api/streaming/pipelines/${id}/stop/`,
      {},
      getAuthOptions()
    );
  },

  async restartPipeline(id: string): Promise<StreamPipeline> {
    return apiClient.post<StreamPipeline>(
      `/api/streaming/pipelines/${id}/restart/`,
      {},
      getAuthOptions()
    );
  },

  async getPipelineMetrics(id: string): Promise<StreamMetrics> {
    return apiClient.get<StreamMetrics>(
      `/api/streaming/pipelines/${id}/metrics/`,
      getAuthOptions()
    );
  },

  async getPipelineCheckpoints(id: string): Promise<StreamCheckpoint[]> {
    return apiClient.get<StreamCheckpoint[]>(
      `/api/streaming/pipelines/${id}/checkpoints/`,
      getAuthOptions()
    );
  },

  async createPipelineCheckpoint(id: string): Promise<StreamCheckpoint> {
    return apiClient.post<StreamCheckpoint>(
      `/api/streaming/pipelines/${id}/create_checkpoint/`,
      {},
      getAuthOptions()
    );
  },

  // Stream Events
  async getEvents(params?: {
    pipeline?: string;
    type?: string;
    hours?: number;
  }): Promise<StreamEvent[]> {
    const response = await apiClient.get<PaginatedResponse<StreamEvent>>(
      "/api/streaming/events/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  // Stream Alerts
  async getAlerts(params?: {
    pipeline?: string;
    severity?: string;
    active?: boolean;
  }): Promise<StreamAlert[]> {
    const response = await apiClient.get<PaginatedResponse<StreamAlert>>(
      "/api/streaming/alerts/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getAlert(id: string): Promise<StreamAlert> {
    return apiClient.get<StreamAlert>(
      `/api/streaming/alerts/${id}/`,
      getAuthOptions()
    );
  },

  async createAlert(data: Partial<StreamAlert>): Promise<StreamAlert> {
    return apiClient.post<StreamAlert>(
      "/api/streaming/alerts/",
      data,
      getAuthOptions()
    );
  },

  async updateAlert(
    id: string,
    data: Partial<StreamAlert>
  ): Promise<StreamAlert> {
    return apiClient.patch<StreamAlert>(
      `/api/streaming/alerts/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteAlert(id: string): Promise<void> {
    return apiClient.delete(`/api/streaming/alerts/${id}/`, getAuthOptions());
  },

  async toggleAlert(id: string): Promise<StreamAlert> {
    return apiClient.post<StreamAlert>(
      `/api/streaming/alerts/${id}/toggle_active/`,
      {},
      getAuthOptions()
    );
  },

  async testAlert(id: string): Promise<{ status: string; message: string }> {
    return apiClient.post<{ status: string; message: string }>(
      `/api/streaming/alerts/${id}/test/`,
      {},
      getAuthOptions()
    );
  },

  // Dashboard
  async getDashboard(): Promise<StreamDashboard> {
    const response = await apiClient.get<StreamDashboard[]>(
      "/api/streaming/dashboard/",
      getAuthOptions()
    );
    // Dashboard endpoint returns array with single item
    return Array.isArray(response) ? response[0] : response;
  },
};

export default streamingApi;
