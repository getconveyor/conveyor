import { apiClient, getAuthOptions } from "./client";

// Paginated response type
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Types matching backend models

export interface DataLakeFile {
  id: string;
  workspace?: string;
  folder?: string;
  name: string;
  path: string;
  format: "parquet" | "csv" | "json" | "avro" | "orc" | "delta" | "table";
  size: number;
  size_display: string;
  rows?: number;
  columns?: number;
  storage_url?: string;
  schema?: string;
  schema_name?: string;
  uploaded_by?: string;
  uploaded_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  workspace?: string;
  name: string;
  path: string;
  parent?: string;
  size: number;
  file_count: number;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Schema {
  id: string;
  workspace?: string;
  name: string;
  description: string;
  version: string;
  schema_definition: Record<string, any>;
  tables: number;
  columns: number;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface StorageZone {
  id: string;
  workspace?: string;
  name: string;
  zone_type: "hot" | "warm" | "cold";
  status: "active" | "inactive" | "maintenance";
  total_capacity: number;
  used_storage: number;
  available_storage: number;
  usage_percentage: number;
  file_count: number;
  total_capacity_display: string;
  used_storage_display: string;
  available_storage_display: string;
  created_at: string;
  updated_at: string;
}

export interface StorageStats {
  total_files: number;
  total_folders: number;
  total_size: number;
  total_size_display: string;
  files_by_format: Record<string, number>;
  recent_files: DataLakeFile[];
}

export interface DashboardStats {
  stats: {
    total_files: number;
    total_folders: number;
    total_schemas: number;
    total_size: number;
    total_size_display: string;
  };
  recent_files: DataLakeFile[];
  storage_by_format: Record<
    string,
    {
      count: number;
      size: number;
      percentage: number;
    }
  >;
  storage_zones: StorageZone[];
}

export interface FolderContents {
  files: DataLakeFile[];
  folders: Folder[];
}

export interface FileUploadData {
  file: File;
  name?: string;
  folder?: string;
  format?: string;
  schema?: string;
}

export interface CreateFolderData {
  name: string;
  path: string;
  parent?: string;
}

export interface CreateSchemaData {
  name: string;
  description?: string;
  version: string;
  schema_definition?: Record<string, any>;
}

export interface CreateStorageZoneData {
  name: string;
  zone_type: "hot" | "warm" | "cold";
  total_capacity: number;
}

// API Client
export const dataLakeApi = {
  // Files
  async getFiles(params?: {
    search?: string;
    format?: string;
    folder?: string;
  }): Promise<DataLakeFile[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append("search", params.search);
    if (params?.format) queryParams.append("format", params.format);
    if (params?.folder) queryParams.append("folder", params.folder);

    const query = queryParams.toString();
    const response = await apiClient.get<PaginatedResponse<DataLakeFile>>(
      `/api/data-lake/files/${query ? `?${query}` : ""}`,
      getAuthOptions()
    );
    return response.results;
  },

  async getFile(id: string): Promise<DataLakeFile> {
    return apiClient.get(`/api/data-lake/files/${id}/`, getAuthOptions());
  },

  async uploadFile(data: FileUploadData): Promise<DataLakeFile> {
    const formData = new FormData();
    formData.append("file", data.file);
    if (data.name) formData.append("name", data.name);
    if (data.folder) formData.append("folder", data.folder);
    if (data.format) formData.append("format", data.format);
    if (data.schema) formData.append("schema", data.schema);

    return apiClient.uploadFile(
      "/api/data-lake/files/upload/",
      formData,
      getAuthOptions()
    );
  },

  async updateFile(
    id: string,
    data: Partial<DataLakeFile>
  ): Promise<DataLakeFile> {
    return apiClient.patch(
      `/api/data-lake/files/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteFile(id: string): Promise<void> {
    return apiClient.delete(`/api/data-lake/files/${id}/`, getAuthOptions());
  },

  async downloadFile(
    id: string
  ): Promise<{
    id: string;
    name: string;
    download_url: string;
    size: number;
    format: string;
    expires_in: number;
  }> {
    return apiClient.get(
      `/api/data-lake/files/${id}/download/`,
      getAuthOptions()
    );
  },

  async previewFile(id: string): Promise<any> {
    return apiClient.get(
      `/api/data-lake/files/${id}/preview/`,
      getAuthOptions()
    );
  },

  // Folders
  async getFolders(): Promise<Folder[]> {
    const response = await apiClient.get<PaginatedResponse<Folder>>("/api/data-lake/folders/", getAuthOptions());
    return response.results;
  },

  async getFolder(id: string): Promise<Folder> {
    return apiClient.get(`/api/data-lake/folders/${id}/`, getAuthOptions());
  },

  async createFolder(data: CreateFolderData): Promise<Folder> {
    return apiClient.post("/api/data-lake/folders/", data, getAuthOptions());
  },

  async updateFolder(id: string, data: Partial<Folder>): Promise<Folder> {
    return apiClient.patch(
      `/api/data-lake/folders/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteFolder(id: string): Promise<void> {
    return apiClient.delete(`/api/data-lake/folders/${id}/`, getAuthOptions());
  },

  async getFolderContents(id: string): Promise<FolderContents> {
    return apiClient.get(
      `/api/data-lake/folders/${id}/contents/`,
      getAuthOptions()
    );
  },

  // Schemas
  async getSchemas(params?: { search?: string }): Promise<Schema[]> {
    const query = params?.search ? `?search=${params.search}` : "";
    const response = await apiClient.get<PaginatedResponse<Schema>>(`/api/data-lake/schemas/${query}`, getAuthOptions());
    return response.results;
  },

  async getSchema(id: string): Promise<Schema> {
    return apiClient.get(`/api/data-lake/schemas/${id}/`, getAuthOptions());
  },

  async createSchema(data: CreateSchemaData): Promise<Schema> {
    return apiClient.post("/api/data-lake/schemas/", data, getAuthOptions());
  },

  async updateSchema(id: string, data: Partial<Schema>): Promise<Schema> {
    return apiClient.patch(
      `/api/data-lake/schemas/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteSchema(id: string): Promise<void> {
    return apiClient.delete(`/api/data-lake/schemas/${id}/`, getAuthOptions());
  },

  async duplicateSchema(
    id: string,
    data: { name?: string; version?: string }
  ): Promise<Schema> {
    return apiClient.post(
      `/api/data-lake/schemas/${id}/duplicate/`,
      data,
      getAuthOptions()
    );
  },

  async getSchemaTables(id: string): Promise<DataLakeFile[]> {
    return apiClient.get(
      `/api/data-lake/schemas/${id}/tables/`,
      getAuthOptions()
    );
  },

  // Storage Zones
  async getStorageZones(): Promise<StorageZone[]> {
    const response = await apiClient.get<PaginatedResponse<StorageZone>>("/api/data-lake/storage-zones/", getAuthOptions());
    return response.results;
  },

  async getStorageZone(id: string): Promise<StorageZone> {
    return apiClient.get(
      `/api/data-lake/storage-zones/${id}/`,
      getAuthOptions()
    );
  },

  async createStorageZone(data: CreateStorageZoneData): Promise<StorageZone> {
    return apiClient.post(
      "/api/data-lake/storage-zones/",
      data,
      getAuthOptions()
    );
  },

  async updateStorageZone(
    id: string,
    data: Partial<StorageZone>
  ): Promise<StorageZone> {
    return apiClient.patch(
      `/api/data-lake/storage-zones/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteStorageZone(id: string): Promise<void> {
    return apiClient.delete(
      `/api/data-lake/storage-zones/${id}/`,
      getAuthOptions()
    );
  },

  async updateStorageZoneMetrics(
    id: string,
    usedStorage: number
  ): Promise<StorageZone> {
    return apiClient.post(
      `/api/data-lake/storage-zones/${id}/update_metrics/`,
      { used_storage: usedStorage },
      getAuthOptions()
    );
  },

  // Statistics
  async getStats(): Promise<StorageStats> {
    return apiClient.get("/api/data-lake/stats/", getAuthOptions());
  },

  async getDashboard(): Promise<DashboardStats> {
    return apiClient.get("/api/data-lake/stats/dashboard/", getAuthOptions());
  },
};
