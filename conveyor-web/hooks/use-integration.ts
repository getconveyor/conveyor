import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Source,
  CreateSourceData,
  SourceType,
  DataSource,
  CreateDataSource,
  Pipeline,
  CreatePipelineData,
  PipelineRun,
  Schedule,
  CreateScheduleData,
  SourceSchema,
} from "@/lib/api/integration";
import { integrationApi } from "@/lib/api/integration";

// Sources
export function useSources() {
  return useQuery<Source[]>({
    queryKey: ["sources"],
    queryFn: integrationApi.getSources,
    staleTime: 30 * 1000,
  });
}

export function useSourceCatalog() {
  return useQuery<{ source_types: SourceType[] }>({
    queryKey: ["source-catalog"],
    queryFn: integrationApi.getSourceCatalog,
    staleTime: 30 * 1000,
  });
}

export function useSource(id: string | null) {
  return useQuery<Source>({
    queryKey: ["source", id],
    queryFn: () => integrationApi.getSource(id!),
    enabled: !!id,
  });
}

export function useSourceSchema(sourceId: string | null) {
  return useQuery<SourceSchema>({
    queryKey: ["source-schema", sourceId],
    queryFn: () => integrationApi.getSourceSchema(sourceId!),
    enabled: !!sourceId,
  });
}

export function useCreateSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSourceData) => integrationApi.createSource(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sources"] }),
  });
}

export function useUpdateSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Source> }) =>
      integrationApi.updateSource(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sources"] }),
  });
}

export function useDeleteSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => integrationApi.deleteSource(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sources"] }),
  });
}

export function useTestSource() {
  return useMutation({
    mutationFn: (id: string) => integrationApi.testSource(id),
  });
}

export function usePreviewSourceData() {
  return useMutation({
    mutationFn: ({
      id,
      stream,
      limit,
    }: {
      id: string;
      stream: string;
      limit?: number;
    }) => integrationApi.previewSourceData(id, stream, limit),
  });
}

// Data Sources
export function useDataSources() {
  return useQuery<DataSource[]>({
    queryKey: ["data-sources"],
    queryFn: integrationApi.getDataSources,
    staleTime: 30 * 1000,
  });
}

export function useDataSource(id: string | null) {
  return useQuery<DataSource>({
    queryKey: ["data-source", id],
    queryFn: () => integrationApi.getDataSource(id!),
    enabled: !!id,
  });
}

export function useSyncDataSource() {
  return useMutation({
    mutationFn: (id: string) => integrationApi.syncDataSource(id),
  });
}

export function useCreateDataSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDataSource) =>
      integrationApi.createDataSource(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["data-sources"] }),
  });
}

export function useUpdateDataSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DataSource> }) =>
      integrationApi.updateDataSource(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["data-sources"] }),
  });
}

export function useDeleteDataSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => integrationApi.deleteDataSource(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["data-sources"] }),
  });
}

// Pipelines
export function usePipelines() {
  return useQuery<Pipeline[]>({
    queryKey: ["pipelines"],
    queryFn: integrationApi.getPipelines,
    staleTime: 30 * 1000,
  });
}

export function usePipeline(id: string | null) {
  return useQuery<Pipeline>({
    queryKey: ["pipeline", id],
    queryFn: () => integrationApi.getPipeline(id!),
    enabled: !!id,
  });
}

export function useCreatePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePipelineData) =>
      integrationApi.createPipeline(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pipelines"] }),
  });
}

export function useUpdatePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pipeline> }) =>
      integrationApi.updatePipeline(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pipelines"] }),
  });
}

export function useDeletePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => integrationApi.deletePipeline(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pipelines"] }),
  });
}

export function useTriggerPipeline() {
  return useMutation({
    mutationFn: (id: string) => integrationApi.triggerPipeline(id),
  });
}

export function usePausePipeline() {
  return useMutation({
    mutationFn: (id: string) => integrationApi.pausePipeline(id),
  });
}

export function useResumePipeline() {
  return useMutation({
    mutationFn: (id: string) => integrationApi.resumePipeline(id),
  });
}

export function usePipelineStats(id: string | null) {
  return useQuery<any>({
    queryKey: ["pipeline-stats", id],
    queryFn: () => integrationApi.getPipelineStats(id!),
    enabled: !!id,
  });
}

// Pipeline Runs
export function usePipelineRuns(pipelineId?: string) {
  return useQuery<PipelineRun[]>({
    queryKey: ["pipeline-runs", pipelineId],
    queryFn: () => integrationApi.getPipelineRuns(pipelineId),
    staleTime: 30 * 1000,
  });
}

export function usePipelineRun(id: string | null) {
  return useQuery<PipelineRun>({
    queryKey: ["pipeline-run", id],
    queryFn: () => integrationApi.getPipelineRun(id!),
    enabled: !!id,
  });
}

export function useCancelPipelineRun() {
  return useMutation({
    mutationFn: (id: string) => integrationApi.cancelPipelineRun(id),
  });
}

// Schedules
export function useSchedules() {
  return useQuery<Schedule[]>({
    queryKey: ["schedules"],
    queryFn: integrationApi.getSchedules,
    staleTime: 30 * 1000,
  });
}

export function useSchedule(id: string | null) {
  return useQuery<Schedule>({
    queryKey: ["schedule", id],
    queryFn: () => integrationApi.getSchedule(id!),
    enabled: !!id,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateScheduleData) =>
      integrationApi.createSchedule(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedules"] }),
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Schedule> }) =>
      integrationApi.updateSchedule(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedules"] }),
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => integrationApi.deleteSchedule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedules"] }),
  });
}

export function useEnableSchedule() {
  return useMutation({
    mutationFn: (id: string) => integrationApi.enableSchedule(id),
  });
}

export function useDisableSchedule() {
  return useMutation({
    mutationFn: (id: string) => integrationApi.disableSchedule(id),
  });
}
