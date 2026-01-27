import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DataAsset, DataLineage, CatalogSummary } from "@/lib/api/governance";

import { governanceApi } from "@/lib/api/governance";

// Data Assets
export function useDataAssets(params?: {
  type?: string;
  certified?: boolean;
  search?: string;
  tags?: string;
}) {
  return useQuery<DataAsset[]>({
    queryKey: ["data-assets", params],
    queryFn: () => governanceApi.getAssets(params),
    staleTime: 30 * 1000,
  });
}

export function useDataAsset(id: string | null) {
  return useQuery<DataAsset>({
    queryKey: ["data-asset", id],
    queryFn: () => governanceApi.getAsset(id!),
    enabled: !!id,
  });
}

export function useCreateDataAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DataAsset>) => governanceApi.createAsset(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["data-assets"] }),
  });
}

export function useUpdateDataAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DataAsset> }) =>
      governanceApi.updateAsset(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["data-assets"] }),
  });
}

export function useDeleteDataAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => governanceApi.deleteAsset(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["data-assets"] }),
  });
}

export function useCatalogSummary() {
  return useQuery<CatalogSummary>({
    queryKey: ["catalog-summary"],
    queryFn: governanceApi.getCatalogSummary,
    staleTime: 30 * 1000,
  });
}

// Data Lineage
export function useDataLineage(params?: { asset?: string }) {
  return useQuery<DataLineage[]>({
    queryKey: ["data-lineage", params],
    queryFn: () => governanceApi.getLineage(params),
    staleTime: 30 * 1000,
  });
}

// Add similar hooks for policies, quality rules, etc. as needed
