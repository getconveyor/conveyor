import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNamespaces,
  getNamespaceSchemas,
  createNamespace,
  deleteNamespace,
  Namespace,
  SchemaTreeNode,
  CreateNamespaceRequest,
  NamespaceActionResponse,
} from "@/lib/api/warehouse";

export function useNamespaces() {
  return useQuery<Namespace[]>({
    queryKey: ["namespaces"],
    queryFn: getNamespaces,
    staleTime: 30 * 1000,
  });
}

export function useNamespaceSchemas(namespaceName: string | null) {
  return useQuery<SchemaTreeNode[]>({
    queryKey: ["namespace-schemas", namespaceName],
    queryFn: () => getNamespaceSchemas(namespaceName!),
    enabled: !!namespaceName,
  });
}

export function useCreateNamespace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateNamespaceRequest) => createNamespace(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["namespaces"] }),
  });
}

export function useDeleteNamespace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (namespaceName: string) => deleteNamespace(namespaceName),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["namespaces"] }),
  });
}
