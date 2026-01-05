/**
 * Analytics API client for dashboards, reports, and data exploration
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

export interface Widget {
  id: string;
  dashboard: string;
  name: string;
  widget_type:
    | "line_chart"
    | "bar_chart"
    | "pie_chart"
    | "area_chart"
    | "scatter_plot"
    | "table"
    | "metric"
    | "text"
    | "map"
    | "heatmap"
    | "gauge";
  query_id: string | null;
  query_text: string;
  data_source: Record<string, any>;
  config: Record<string, any>;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  cache_duration_seconds: number;
  last_cached_at: string | null;
  cached_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Dashboard {
  id: string;
  workspace: string;
  name: string;
  description: string;
  slug: string;
  layout: Record<string, any>;
  theme: string;
  auto_refresh: boolean;
  refresh_interval_seconds: number;
  is_public: boolean;
  is_template: boolean;
  owner: string | null;
  owner_name: string | null;
  created_by: string | null;
  created_by_name: string | null;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
  widget_count: number;
  widgets?: Widget[];
}

export interface SavedQuery {
  id: string;
  workspace: string;
  name: string;
  description: string;
  query_text: string;
  catalog: string;
  schema_name: string;
  parameters: Array<{ name: string; type: string; default?: any }>;
  tags: string[];
  folder: string;
  is_public: boolean;
  owner: string | null;
  owner_name: string | null;
  execution_count: number;
  last_executed_at: string | null;
  avg_execution_time_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface ReportExecution {
  id: string;
  report: string;
  status: "pending" | "running" | "completed" | "failed";
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  file_url: string;
  file_size_bytes: number | null;
  delivered: boolean;
  delivery_error: string | null;
  error_message: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  workspace: string;
  name: string;
  description: string;
  source_type: "dashboard" | "query" | "custom";
  dashboard: string | null;
  dashboard_name: string | null;
  query: string | null;
  query_name: string | null;
  format: "pdf" | "excel" | "csv" | "html";
  schedule: string;
  timezone: string;
  enabled: boolean;
  delivery_method: "email" | "slack" | "storage";
  delivery_config: Record<string, any>;
  last_generated_at: string | null;
  last_delivered_at: string | null;
  next_run_at: string | null;
  owner: string | null;
  owner_name: string | null;
  created_at: string;
  updated_at: string;
  recent_executions?: ReportExecution[];
}

export interface Exploration {
  id: string;
  workspace: string;
  user: string;
  user_name: string;
  name: string;
  state: Record<string, any>;
  source_type: string;
  source_reference: string;
  cell_count: number;
  last_cell_executed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  total_dashboards: number;
  public_dashboards: number;
  template_dashboards: number;
  total_widgets: number;
  most_viewed: Dashboard[];
}

export interface QuerySummary {
  total_queries: number;
  public_queries: number;
  total_executions: number;
  avg_execution_time_ms: number;
}

export interface ReportSummary {
  total_reports: number;
  enabled_reports: number;
  reports_by_format: Record<string, number>;
  reports_by_delivery: Record<string, number>;
}

// API Client
export const analyticsApi = {
  // Dashboards
  async getDashboards(params?: {
    public?: boolean;
    template?: boolean;
    search?: string;
  }): Promise<Dashboard[]> {
    const response = await apiClient.get<PaginatedResponse<Dashboard>>(
      "/api/analytics/dashboards/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getDashboard(id: string): Promise<Dashboard> {
    return apiClient.get<Dashboard>(
      `/api/analytics/dashboards/${id}/`,
      getAuthOptions()
    );
  },

  async createDashboard(data: Partial<Dashboard>): Promise<Dashboard> {
    return apiClient.post<Dashboard>(
      "/api/analytics/dashboards/",
      data,
      getAuthOptions()
    );
  },

  async updateDashboard(
    id: string,
    data: Partial<Dashboard>
  ): Promise<Dashboard> {
    return apiClient.patch<Dashboard>(
      `/api/analytics/dashboards/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteDashboard(id: string): Promise<void> {
    return apiClient.delete(
      `/api/analytics/dashboards/${id}/`,
      getAuthOptions()
    );
  },

  async duplicateDashboard(id: string, name: string): Promise<Dashboard> {
    return apiClient.post<Dashboard>(
      `/api/analytics/dashboards/${id}/duplicate/`,
      { name },
      getAuthOptions()
    );
  },

  async recordDashboardView(id: string): Promise<void> {
    return apiClient.post(
      `/api/analytics/dashboards/${id}/view/`,
      {},
      getAuthOptions()
    );
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    return apiClient.get<DashboardSummary>(
      "/api/analytics/dashboards/summary/",
      getAuthOptions()
    );
  },

  // Widgets
  async getWidgets(dashboardId: string): Promise<Widget[]> {
    const response = await apiClient.get<PaginatedResponse<Widget>>(
      "/api/analytics/widgets/",
      {
        ...getAuthOptions(),
        params: { dashboard: dashboardId },
      }
    );
    return response.results;
  },

  async getWidget(id: string): Promise<Widget> {
    return apiClient.get<Widget>(
      `/api/analytics/widgets/${id}/`,
      getAuthOptions()
    );
  },

  async createWidget(
    dashboardId: string,
    data: Partial<Widget>
  ): Promise<Widget> {
    return apiClient.post<Widget>(
      "/api/analytics/widgets/",
      { ...data, dashboard: dashboardId },
      getAuthOptions()
    );
  },

  async updateWidget(id: string, data: Partial<Widget>): Promise<Widget> {
    return apiClient.patch<Widget>(
      `/api/analytics/widgets/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteWidget(id: string): Promise<void> {
    return apiClient.delete(`/api/analytics/widgets/${id}/`, getAuthOptions());
  },

  async refreshWidget(id: string): Promise<Widget> {
    return apiClient.post<Widget>(
      `/api/analytics/widgets/${id}/refresh/`,
      {},
      getAuthOptions()
    );
  },

  // Saved Queries
  async getQueries(params?: {
    folder?: string;
    public?: boolean;
    search?: string;
  }): Promise<SavedQuery[]> {
    const response = await apiClient.get<PaginatedResponse<SavedQuery>>(
      "/api/analytics/queries/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getQuery(id: string): Promise<SavedQuery> {
    return apiClient.get<SavedQuery>(
      `/api/analytics/queries/${id}/`,
      getAuthOptions()
    );
  },

  async createQuery(data: Partial<SavedQuery>): Promise<SavedQuery> {
    return apiClient.post<SavedQuery>(
      "/api/analytics/queries/",
      data,
      getAuthOptions()
    );
  },

  async updateQuery(
    id: string,
    data: Partial<SavedQuery>
  ): Promise<SavedQuery> {
    return apiClient.patch<SavedQuery>(
      `/api/analytics/queries/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteQuery(id: string): Promise<void> {
    return apiClient.delete(`/api/analytics/queries/${id}/`, getAuthOptions());
  },

  async executeQuery(
    id: string,
    params?: Record<string, any>
  ): Promise<{ data: any[]; columns: string[] }> {
    return apiClient.post(
      `/api/analytics/queries/${id}/execute/`,
      { params },
      getAuthOptions()
    );
  },

  async getQueryFolders(): Promise<string[]> {
    return apiClient.get<string[]>(
      "/api/analytics/queries/folders/",
      getAuthOptions()
    );
  },

  async getQuerySummary(): Promise<QuerySummary> {
    return apiClient.get<QuerySummary>(
      "/api/analytics/queries/summary/",
      getAuthOptions()
    );
  },

  // Reports
  async getReports(params?: {
    enabled?: boolean;
    format?: string;
  }): Promise<Report[]> {
    const response = await apiClient.get<PaginatedResponse<Report>>(
      "/api/analytics/reports/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getReport(id: string): Promise<Report> {
    return apiClient.get<Report>(
      `/api/analytics/reports/${id}/`,
      getAuthOptions()
    );
  },

  async createReport(data: Partial<Report>): Promise<Report> {
    return apiClient.post<Report>(
      "/api/analytics/reports/",
      data,
      getAuthOptions()
    );
  },

  async updateReport(id: string, data: Partial<Report>): Promise<Report> {
    return apiClient.patch<Report>(
      `/api/analytics/reports/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteReport(id: string): Promise<void> {
    return apiClient.delete(`/api/analytics/reports/${id}/`, getAuthOptions());
  },

  async runReport(id: string): Promise<ReportExecution> {
    return apiClient.post<ReportExecution>(
      `/api/analytics/reports/${id}/run/`,
      {},
      getAuthOptions()
    );
  },

  async toggleReportEnabled(id: string): Promise<Report> {
    return apiClient.post<Report>(
      `/api/analytics/reports/${id}/toggle_enabled/`,
      {},
      getAuthOptions()
    );
  },

  async getReportSummary(): Promise<ReportSummary> {
    return apiClient.get<ReportSummary>(
      "/api/analytics/reports/summary/",
      getAuthOptions()
    );
  },

  // Report Executions
  async getReportExecutions(reportId: string): Promise<ReportExecution[]> {
    const response = await apiClient.get<PaginatedResponse<ReportExecution>>(
      "/api/analytics/executions/",
      {
        ...getAuthOptions(),
        params: { report: reportId },
      }
    );
    return response.results;
  },

  async getReportExecution(id: string): Promise<ReportExecution> {
    return apiClient.get<ReportExecution>(
      `/api/analytics/executions/${id}/`,
      getAuthOptions()
    );
  },

  // Explorations
  async getExplorations(): Promise<Exploration[]> {
    const response = await apiClient.get<PaginatedResponse<Exploration>>(
      "/api/analytics/explorations/",
      getAuthOptions()
    );
    return response.results;
  },

  async getExploration(id: string): Promise<Exploration> {
    return apiClient.get<Exploration>(
      `/api/analytics/explorations/${id}/`,
      getAuthOptions()
    );
  },

  async createExploration(data: Partial<Exploration>): Promise<Exploration> {
    return apiClient.post<Exploration>(
      "/api/analytics/explorations/",
      data,
      getAuthOptions()
    );
  },

  async updateExploration(
    id: string,
    data: Partial<Exploration>
  ): Promise<Exploration> {
    return apiClient.patch<Exploration>(
      `/api/analytics/explorations/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteExploration(id: string): Promise<void> {
    return apiClient.delete(
      `/api/analytics/explorations/${id}/`,
      getAuthOptions()
    );
  },
};

export default analyticsApi;
