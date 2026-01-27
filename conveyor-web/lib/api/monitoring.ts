/**
 * Monitoring API client for system health, alerts, audit logs, and metrics
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

export interface SystemHealth {
  id: string;
  service: string;
  status: "healthy" | "unhealthy" | "degraded" | "unknown";
  response_time_ms: number | null;
  cpu_usage: number | null;
  memory_usage: number | null;
  disk_usage: number | null;
  details: Record<string, any>;
  error_message: string | null;
  checked_at: string;
}

export interface Alert {
  id: string;
  workspace: string | null;
  title: string;
  description: string;
  alert_type: string;
  severity: "critical" | "error" | "warning" | "info";
  status: "active" | "acknowledged" | "resolved" | "dismissed";
  source: string;
  resource_id: string | null;
  resource_type: string | null;
  metadata: Record<string, any>;
  acknowledged_by: string | null;
  acknowledged_by_name: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  workspace: string;
  user: string | null;
  user_email: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  changes: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface MetricSnapshot {
  id: string;
  workspace: string | null;
  metric_type: string;
  period: string;
  period_start: string;
  period_end: string;
  data: Record<string, any>;
  created_at: string;
}

export interface AlertSummary {
  total: number;
  active: number;
  by_severity: {
    critical: number;
    error: number;
    warning: number;
    info: number;
  };
  by_type: Array<{ alert_type: string; count: number }>;
}

export interface SystemOverview {
  total_pipelines: number;
  running_pipelines: number;
  failed_pipelines: number;
  total_sources: number;
  active_sources: number;
  queries_today: number;
  storage_used_bytes: number;
  records_processed: number;
}

export interface AuditLogSummary {
  total_actions_24h: number;
  by_action: Array<{ action: string; count: number }>;
  by_resource: Array<{ resource_type: string; count: number }>;
  by_user: Array<{ user__email: string; count: number }>;
}

// API Client
export const monitoringApi = {
  // System Health
  async getServerHealth(): Promise<SystemHealth> {
    return apiClient.get<SystemHealth>("/health/");
  },

  // System Health
  async getCurrentHealth(): Promise<SystemHealth[]> {
    return apiClient.get<SystemHealth[]>(
      "/api/monitoring/health/current/",
      getAuthOptions()
    );
  },

  async getHealthHistory(
    service: string,
    hours: number = 24
  ): Promise<SystemHealth[]> {
    const response = await apiClient.get<PaginatedResponse<SystemHealth>>(
      "/api/monitoring/health/history/",
      {
        ...getAuthOptions(),
        params: { service, hours },
      }
    );
    return response.results;
  },

  // Alerts
  async getAlerts(params?: {
    status?: string;
    severity?: string;
    type?: string;
  }): Promise<Alert[]> {
    const response = await apiClient.get<PaginatedResponse<Alert>>(
      "/api/monitoring/alerts/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getAlert(id: string): Promise<Alert> {
    return apiClient.get<Alert>(
      `/api/monitoring/alerts/${id}/`,
      getAuthOptions()
    );
  },

  async acknowledgeAlert(id: string): Promise<Alert> {
    return apiClient.post<Alert>(
      `/api/monitoring/alerts/${id}/acknowledge/`,
      {},
      getAuthOptions()
    );
  },

  async resolveAlert(id: string): Promise<Alert> {
    return apiClient.post<Alert>(
      `/api/monitoring/alerts/${id}/resolve/`,
      {},
      getAuthOptions()
    );
  },

  async dismissAlert(id: string): Promise<Alert> {
    return apiClient.post<Alert>(
      `/api/monitoring/alerts/${id}/dismiss/`,
      {},
      getAuthOptions()
    );
  },

  async getAlertSummary(): Promise<AlertSummary> {
    return apiClient.get<AlertSummary>(
      "/api/monitoring/alerts/summary/",
      getAuthOptions()
    );
  },

  // Audit Logs
  async getAuditLogs(params?: {
    user?: string;
    action?: string;
    resource_type?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<AuditLog[]> {
    const response = await apiClient.get<PaginatedResponse<AuditLog>>(
      "/api/monitoring/audit-logs/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getAuditLogSummary(): Promise<AuditLogSummary> {
    return apiClient.get<AuditLogSummary>(
      "/api/monitoring/audit-logs/summary/",
      getAuthOptions()
    );
  },

  // Metrics
  async getMetrics(params?: {
    metric_type?: string;
    period?: string;
  }): Promise<MetricSnapshot[]> {
    const response = await apiClient.get<PaginatedResponse<MetricSnapshot>>(
      "/api/monitoring/metrics/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getSystemOverview(): Promise<SystemOverview> {
    return apiClient.get<SystemOverview>(
      "/api/monitoring/metrics/overview/",
      getAuthOptions()
    );
  },

  // Global Search
  async globalSearch(params: {
    q: string;
    types?: string;
    limit?: number;
  }): Promise<{
    query: string;
    total_results: number;
    results: Array<{
      id: string;
      type: string;
      name: string;
      description: string;
      url: string;
      relevance_score: number;
      [key: string]: any;
    }>;
  }> {
    return apiClient.get("/api/monitoring/search/", {
      ...getAuthOptions(),
      params,
    });
  },
};

export default monitoringApi;
