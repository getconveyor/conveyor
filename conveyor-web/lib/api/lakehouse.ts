import { apiClient, getAuthOptions } from "./client";

export interface ExecuteQueryRequest {
  query: string;
  namespace?: string;
  schema?: string;
  name?: string;
  limit?: number;
}

export interface ExecuteQueryResponse {
  query_id: string;
  status: "finished" | "failed";
  columns: string[];
  data: Record<string, any>[];
  rows_returned: number;
  execution_time_ms: number;
  execution_time_display: string;
  error?: string;
}

export interface IcebergTable {
  namespace: string;
  schema: string;
  layer: "bronze" | "silver" | "gold";
  schema_namespace: string;
  table_name: string;
  full_name: string;
  row_count: number | null;
}

export interface TablesResponse {
  namespace: string;
  tables: IcebergTable[];
  total_tables: number;
}

export interface QueryHistory {
  id: string;
  workspace_id: string;
  user: string;
  user_email: string;
  name: string | null;
  query_text: string;
  namespace: string;
  schema: string | null;
  status: "running" | "finished" | "failed" | "cancelled";
  rows_returned: number | null;
  execution_time_ms: number | null;
  execution_time_display: string;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

/**
 * Execute a Trino SQL query
 */
export async function executeQuery(
  data: ExecuteQueryRequest
): Promise<ExecuteQueryResponse> {
  return apiClient.post<ExecuteQueryResponse>(
    "/api/lakehouse/queries/execute/",
    data,
    getAuthOptions()
  );
}

/**
 * List Iceberg tables, optionally filtered by layer
 */
export async function listTables(params?: {
  namespace?: string;
  schema?: string;
  layer?: "bronze" | "silver" | "gold";
}): Promise<TablesResponse> {
  return apiClient.get<TablesResponse>("/api/lakehouse/queries/tables/", {
    params,
    ...getAuthOptions(),
  });
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Get query history
 */
export async function getQueryHistory(): Promise<QueryHistory[]> {
  const response = await apiClient.get<PaginatedResponse<QueryHistory>>(
    "/api/lakehouse/history/",
    getAuthOptions()
  );
  return response.results || [];
}

/**
 * Get a specific query from history
 */
export async function getQuery(id: string): Promise<QueryHistory> {
  return apiClient.get<QueryHistory>(
    `/api/lakehouse/history/${id}/`,
    getAuthOptions()
  );
}

/**
 * Delete a query from history
 */
export async function deleteQuery(id: string): Promise<void> {
  await apiClient.delete(
    `/api/lakehouse/history/${id}/delete_query/`,
    getAuthOptions()
  );
}
