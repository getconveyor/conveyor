import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ExecuteQueryRequest,
  ExecuteQueryResponse,
  IcebergTable,
  TablesResponse,
  QueryHistory,
  executeQuery,
  listTables,
  getQueryHistory,
  getQuery,
  deleteQuery,
} from "@/lib/api/lakehouse";

export function useLakehouseQuery(query: string) {
  return useQuery<ExecuteQueryResponse>({
    queryKey: ["lakehouse-query", query],
    queryFn: () => executeQuery({ query }),
    enabled: !!query,
    staleTime: 30 * 1000,
  });
}

export function useLakehouseTables(params?: {
  namespace?: string;
  schema?: string;
  layer?: "bronze" | "silver" | "gold";
}) {
  return useQuery<TablesResponse>({
    queryKey: ["lakehouse-tables", params],
    queryFn: () => listTables(params),
    staleTime: 30 * 1000,
  });
}

export function useLakehouseQueryHistory() {
  return useQuery<QueryHistory[]>({
    queryKey: ["lakehouse-query-history"],
    queryFn: getQueryHistory,
    staleTime: 30 * 1000,
  });
}

export function useLakehouseQueryById(id: string | null) {
  return useQuery<QueryHistory>({
    queryKey: ["lakehouse-query", id],
    queryFn: () => getQuery(id!),
    enabled: !!id,
  });
}

export function useDeleteLakehouseQuery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteQuery(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["lakehouse-query-history"] }),
  });
}
