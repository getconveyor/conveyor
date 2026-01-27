import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  streamingApi,
  StreamSource,
  StreamPipeline,
  StreamEvent,
  StreamAlert,
  StreamCheckpoint,
  StreamMetrics,
  StreamDashboard,
  SourceMetrics,
} from "@/lib/api/streaming";

// Stream Sources
export function useStreamSources(params?: { type?: string; status?: string }) {
  return useQuery<StreamSource[]>({
    queryKey: ["stream-sources", params],
    queryFn: () => streamingApi.getSources(params),
    staleTime: 30 * 1000,
  });
}

export function useStreamSource(id: string | null) {
  return useQuery<StreamSource>({
    queryKey: ["stream-source", id],
    queryFn: () => streamingApi.getSource(id!),
    enabled: !!id,
  });
}

export function useCreateStreamSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: streamingApi.createSource,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["stream-sources"] }),
  });
}

export function useUpdateStreamSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StreamSource> }) =>
      streamingApi.updateSource(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["stream-sources"] }),
  });
}

export function useDeleteStreamSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => streamingApi.deleteSource(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["stream-sources"] }),
  });
}

export function useStreamSourceMetrics(id: string | null) {
  return useQuery<SourceMetrics>({
    queryKey: ["stream-source-metrics", id],
    queryFn: () => streamingApi.getSourceMetrics(id!),
    enabled: !!id,
  });
}

// Stream Pipelines
export function useStreamPipelines(params?: {
  status?: string;
  source?: string;
}) {
  return useQuery<StreamPipeline[]>({
    queryKey: ["stream-pipelines", params],
    queryFn: () => streamingApi.getPipelines(params),
    staleTime: 30 * 1000,
  });
}

export function useStreamPipeline(id: string | null) {
  return useQuery<StreamPipeline>({
    queryKey: ["stream-pipeline", id],
    queryFn: () => streamingApi.getPipeline(id!),
    enabled: !!id,
  });
}

export function useCreateStreamPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: streamingApi.createPipeline,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["stream-pipelines"] }),
  });
}

export function useUpdateStreamPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StreamPipeline> }) =>
      streamingApi.updatePipeline(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["stream-pipelines"] }),
  });
}

export function useDeleteStreamPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => streamingApi.deletePipeline(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["stream-pipelines"] }),
  });
}

export function useStreamPipelineMetrics(id: string | null) {
  return useQuery<StreamMetrics>({
    queryKey: ["stream-pipeline-metrics", id],
    queryFn: () => streamingApi.getPipelineMetrics(id!),
    enabled: !!id,
  });
}

export function useStreamPipelineCheckpoints(id: string | null) {
  return useQuery<StreamCheckpoint[]>({
    queryKey: ["stream-pipeline-checkpoints", id],
    queryFn: () => streamingApi.getPipelineCheckpoints(id!),
    enabled: !!id,
  });
}

// Stream Events
export function useStreamEvents(params?: {
  pipeline?: string;
  type?: string;
  hours?: number;
}) {
  return useQuery<StreamEvent[]>({
    queryKey: ["stream-events", params],
    queryFn: () => streamingApi.getEvents(params),
    staleTime: 30 * 1000,
  });
}

// Stream Alerts
export function useStreamAlerts(params?: {
  pipeline?: string;
  severity?: string;
  active?: boolean;
}) {
  return useQuery<StreamAlert[]>({
    queryKey: ["stream-alerts", params],
    queryFn: () => streamingApi.getAlerts(params),
    staleTime: 30 * 1000,
  });
}

export function useStreamAlert(id: string | null) {
  return useQuery<StreamAlert>({
    queryKey: ["stream-alert", id],
    queryFn: () => streamingApi.getAlert(id!),
    enabled: !!id,
  });
}

export function useCreateStreamAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: streamingApi.createAlert,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["stream-alerts"] }),
  });
}

export function useUpdateStreamAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StreamAlert> }) =>
      streamingApi.updateAlert(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["stream-alerts"] }),
  });
}

export function useDeleteStreamAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => streamingApi.deleteAlert(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["stream-alerts"] }),
  });
}

// Dashboard
export function useStreamDashboard() {
  return useQuery<StreamDashboard>({
    queryKey: ["stream-dashboard"],
    queryFn: streamingApi.getDashboard,
    staleTime: 30 * 1000,
  });
}
