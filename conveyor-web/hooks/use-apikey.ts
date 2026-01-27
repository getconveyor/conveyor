import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiKey,
  ApiKeyWithKey,
  CreateApiKeyData,
  UpdateApiKeyData,
} from "@/lib/api/apikey";
import { apiKeyApi } from "@/lib/api/apikey";

export function useApiKeys() {
  return useQuery<ApiKey[]>({
    queryKey: ["api-keys"],
    queryFn: apiKeyApi.getApiKeys,
    staleTime: 30 * 1000,
  });
}

export function useApiKey(keyId: string | null) {
  return useQuery<ApiKey>({
    queryKey: ["api-key", keyId],
    queryFn: () => apiKeyApi.getApiKey(keyId!),
    enabled: !!keyId,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateApiKeyData) => apiKeyApi.createApiKey(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["api-keys"] }),
  });
}

export function useUpdateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ keyId, data }: { keyId: string; data: UpdateApiKeyData }) =>
      apiKeyApi.updateApiKey(keyId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["api-keys"] }),
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) => apiKeyApi.deleteApiKey(keyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["api-keys"] }),
  });
}
