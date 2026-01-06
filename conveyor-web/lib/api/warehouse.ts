import { apiClient, getAuthOptions } from "./client";

export interface Namespace {
  name: string;
  connector: string;
  file: string;
  is_system: boolean;
  is_default: boolean;
}

export interface NamespacesResponse {
  namespaces: Namespace[];
}

export interface CreateNamespaceRequest {
  name: string;
}

export interface NamespaceActionResponse {
  message: string;
  error?: string;
}

export interface SchemaTreeNode {
  id: string;
  name: string;
  type: "namespace" | "layer" | "schema" | "table" | "column";
  layer?: "bronze" | "silver" | "gold";
  dataType?: string;
  isPrimaryKey?: boolean;
  isNullable?: boolean;
  children?: SchemaTreeNode[];
}

export interface NamespaceSchemasResponse {
  namespace: string;
  schema_tree: SchemaTreeNode[];
}

/**
 * Get all namespaces
 */
export async function getNamespaces(): Promise<Namespace[]> {
  const response = await apiClient.get<NamespacesResponse>(
    "/api/lakehouse/namespaces/",
    getAuthOptions()
  );
  return response.namespaces || [];
}

/**
 * Get schemas for a namespace (for schema browser)
 */
export async function getNamespaceSchemas(
  namespaceName: string
): Promise<SchemaTreeNode[]> {
  const response = await apiClient.get<NamespaceSchemasResponse>(
    `/api/lakehouse/namespaces/${namespaceName}/schemas/`,
    getAuthOptions()
  );
  return response.schema_tree || [];
}

/**
 * Create a new namespace
 */
export async function createNamespace(
  data: CreateNamespaceRequest
): Promise<NamespaceActionResponse> {
  return apiClient.post<NamespaceActionResponse>(
    "/api/lakehouse/namespaces/",
    data,
    getAuthOptions()
  );
}

/**
 * Delete a namespace
 */
export async function deleteNamespace(
  namespaceName: string
): Promise<NamespaceActionResponse> {
  return apiClient.delete<NamespaceActionResponse>(
    `/api/lakehouse/namespaces/${namespaceName}/`,
    getAuthOptions()
  );
}
