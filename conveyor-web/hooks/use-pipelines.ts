import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { integrationApi, Pipeline, CreatePipelineData } from "@/lib/api/integration";
import { showErrorToast, showSuccessToast } from "@/lib/error-handler";

// Query Keys
export const pipelineKeys = {
  all: ["pipelines"] as const,
  lists: () => [...pipelineKeys.all, "list"] as const,
  list: (filters: string) => [...pipelineKeys.lists(), { filters }] as const,
  details: () => [...pipelineKeys.all, "detail"] as const,
  detail: (id: string) => [...pipelineKeys.details(), id] as const,
};

// Get all pipelines
export function usePipelines(params?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: pipelineKeys.list(JSON.stringify(params)),
    queryFn: async () => {
      const pipelines = await integrationApi.getPipelines();

      // Filter on client side if needed
      if (params?.status || params?.search) {
        return pipelines.filter((p) => {
          const matchesStatus = !params.status || p.status === params.status;
          const matchesSearch = !params.search ||
            p.name.toLowerCase().includes(params.search.toLowerCase());
          return matchesStatus && matchesSearch;
        });
      }

      return pipelines;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Get single pipeline
export function usePipeline(id: string | null) {
  return useQuery({
    queryKey: pipelineKeys.detail(id || ""),
    queryFn: () => integrationApi.getPipeline(id!),
    enabled: !!id,
  });
}

// Create pipeline mutation
export function useCreatePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePipelineData) => integrationApi.createPipeline(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      showSuccessToast("Pipeline created successfully");
    },
    onError: (error) => {
      showErrorToast(error, "Failed to create pipeline");
    },
  });
}

// Update pipeline mutation
export function useUpdatePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pipeline> }) =>
      integrationApi.updatePipeline(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.detail(variables.id) });
      showSuccessToast("Pipeline updated successfully");
    },
    onError: (error) => {
      showErrorToast(error, "Failed to update pipeline");
    },
  });
}

// Delete pipeline mutation
export function useDeletePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => integrationApi.deletePipeline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      showSuccessToast("Pipeline deleted successfully");
    },
    onError: (error) => {
      showErrorToast(error, "Failed to delete pipeline");
    },
  });
}

// Pause pipeline mutation
export function usePausePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => integrationApi.pausePipeline(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.detail(id) });
      showSuccessToast("Pipeline paused");
    },
    onError: (error) => {
      showErrorToast(error, "Failed to pause pipeline");
    },
  });
}

// Resume pipeline mutation
export function useResumePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => integrationApi.resumePipeline(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.detail(id) });
      showSuccessToast("Pipeline resumed");
    },
    onError: (error) => {
      showErrorToast(error, "Failed to resume pipeline");
    },
  });
}
