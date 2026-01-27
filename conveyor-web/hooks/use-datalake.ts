import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Folder,
  Schema,
  StorageZone,
  StorageStats,
  DashboardStats,
  FolderContents,
  FileUploadData,
  CreateFolderData,
  CreateSchemaData,
  CreateStorageZoneData,
  DataLakeFile,
} from "@/lib/api/datalake";

import { dataLakeApi as datalakeApi } from "@/lib/api/datalake";

// Files
export function useDataLakeFiles(params?: {
  search?: string;
  format?: string;
  folder?: string;
}) {
  return useQuery<DataLakeFile[]>({
    queryKey: ["datalake-files", params],
    queryFn: () => datalakeApi.getFiles(params),
    staleTime: 30 * 1000,
  });
}

export function useDataLakeFile(id: string | null) {
  return useQuery<DataLakeFile>({
    queryKey: ["datalake-file", id],
    queryFn: () => datalakeApi.getFile(id!),
    enabled: !!id,
  });
}

export function useUploadDataLakeFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FileUploadData) => datalakeApi.uploadFile(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["datalake-files"] }),
  });
}

export function useUpdateDataLakeFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DataLakeFile> }) =>
      datalakeApi.updateFile(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["datalake-files"] }),
  });
}

export function useDeleteDataLakeFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => datalakeApi.deleteFile(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["datalake-files"] }),
  });
}

export function useDownloadDataLakeFile(id: string | null) {
  return useQuery({
    queryKey: ["datalake-file-download", id],
    queryFn: () => datalakeApi.downloadFile(id!),
    enabled: !!id,
  });
}

export function usePreviewDataLakeFile(id: string | null) {
  return useQuery({
    queryKey: ["datalake-file-preview", id],
    queryFn: () => datalakeApi.previewFile(id!),
    enabled: !!id,
  });
}

// Folders
export function useDataLakeFolders() {
  return useQuery<Folder[]>({
    queryKey: ["datalake-folders"],
    queryFn: datalakeApi.getFolders,
    staleTime: 30 * 1000,
  });
}

export function useDataLakeFolder(id: string | null) {
  return useQuery<Folder>({
    queryKey: ["datalake-folder", id],
    queryFn: () => datalakeApi.getFolder(id!),
    enabled: !!id,
  });
}

export function useCreateDataLakeFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFolderData) => datalakeApi.createFolder(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["datalake-folders"] }),
  });
}

export function useUpdateDataLakeFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Folder> }) =>
      datalakeApi.updateFolder(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["datalake-folders"] }),
  });
}

export function useDeleteDataLakeFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => datalakeApi.deleteFolder(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["datalake-folders"] }),
  });
}

export function useDataLakeFolderContents(id: string | null) {
  return useQuery<FolderContents>({
    queryKey: ["datalake-folder-contents", id],
    queryFn: () => datalakeApi.getFolderContents(id!),
    enabled: !!id,
  });
}

// Schemas
export function useDataLakeSchemas(params?: { search?: string }) {
  return useQuery<Schema[]>({
    queryKey: ["datalake-schemas", params],
    queryFn: () => datalakeApi.getSchemas(params),
    staleTime: 30 * 1000,
  });
}

export function useDataLakeSchema(id: string | null) {
  return useQuery<Schema>({
    queryKey: ["datalake-schema", id],
    queryFn: () => datalakeApi.getSchema(id!),
    enabled: !!id,
  });
}

export function useCreateDataLakeSchema() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSchemaData) => datalakeApi.createSchema(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["datalake-schemas"] }),
  });
}

export function useUpdateDataLakeSchema() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Schema> }) =>
      datalakeApi.updateSchema(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["datalake-schemas"] }),
  });
}

export function useDeleteDataLakeSchema() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => datalakeApi.deleteSchema(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["datalake-schemas"] }),
  });
}

export function useDuplicateDataLakeSchema() {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; version?: string };
    }) => datalakeApi.duplicateSchema(id, data),
  });
}

export function useDataLakeSchemaTables(id: string | null) {
  return useQuery<DataLakeFile[]>({
    queryKey: ["datalake-schema-tables", id],
    queryFn: () => datalakeApi.getSchemaTables(id!),
    enabled: !!id,
  });
}

// Storage Zones
export function useStorageZones() {
  return useQuery<StorageZone[]>({
    queryKey: ["storage-zones"],
    queryFn: datalakeApi.getStorageZones,
    staleTime: 30 * 1000,
  });
}

export function useStorageZone(id: string | null) {
  return useQuery<StorageZone>({
    queryKey: ["storage-zone", id],
    queryFn: () => datalakeApi.getStorageZone(id!),
    enabled: !!id,
  });
}

export function useCreateStorageZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStorageZoneData) =>
      datalakeApi.createStorageZone(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["storage-zones"] }),
  });
}

export function useUpdateStorageZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StorageZone> }) =>
      datalakeApi.updateStorageZone(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["storage-zones"] }),
  });
}

export function useDeleteStorageZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => datalakeApi.deleteStorageZone(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["storage-zones"] }),
  });
}

export function useUpdateStorageZoneMetrics() {
  return useMutation({
    mutationFn: ({ id, usedStorage }: { id: string; usedStorage: number }) =>
      datalakeApi.updateStorageZoneMetrics(id, usedStorage),
  });
}

// Stats
export function useStorageStats() {
  return useQuery<StorageStats>({
    queryKey: ["storage-stats"],
    queryFn: datalakeApi.getStats,
    staleTime: 30 * 1000,
  });
}

export function useDatalakeDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["datalake-dashboard-stats"],
    queryFn: datalakeApi.getDashboard,
    staleTime: 30 * 1000,
  });
}
