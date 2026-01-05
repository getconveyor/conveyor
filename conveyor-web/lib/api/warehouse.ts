import { apiClient, getAuthOptions } from "./client";

export interface Catalog {
  name: string;
  connector: string;
  file: string;
  is_system: boolean;
  is_default: boolean;
}

export interface CatalogsResponse {
  catalogs: Catalog[];
}

export interface CreateCatalogRequest {
  name: string;
}

export interface CatalogActionResponse {
  message: string;
  error?: string;
}

/**
 * Get all catalogs
 */
export async function getCatalogs(): Promise<Catalog[]> {
  const response = await apiClient.get<CatalogsResponse>(
    "/api/lakehouse/catalogs/",
    getAuthOptions()
  );
  return response.catalogs || [];
}

/**
 * Create a new catalog
 */
export async function createCatalog(
  data: CreateCatalogRequest
): Promise<CatalogActionResponse> {
  return apiClient.post<CatalogActionResponse>(
    "/api/lakehouse/catalogs/",
    data,
    getAuthOptions()
  );
}

/**
 * Delete a catalog
 */
export async function deleteCatalog(
  catalogName: string
): Promise<CatalogActionResponse> {
  return apiClient.delete<CatalogActionResponse>(
    `/api/lakehouse/catalogs/${catalogName}/`,
    getAuthOptions()
  );
}
