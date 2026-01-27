import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Experiment,
  ExperimentRun,
  MLModel,
  ModelVersion,
  FeatureGroup,
  FeatureDefinition,
  FeatureEngineeringJob,
  FeatureEngineeringRun,
  FeatureMaterialization,
  OnlineFeatureStore,
  FeatureStatistics,
} from "@/lib/api/datascience";
import { dataScienceApi } from "@/lib/api/datascience";

// Experiments
export function useExperiments(params?: { status?: string; search?: string }) {
  return useQuery<Experiment[]>({
    queryKey: ["experiments", params],
    queryFn: () => dataScienceApi.getExperiments(params),
    staleTime: 30 * 1000,
  });
}

export function useExperiment(id: string | null) {
  return useQuery<Experiment>({
    queryKey: ["experiment", id],
    queryFn: () => dataScienceApi.getExperiment(id!),
    enabled: !!id,
  });
}

export function useCreateExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Experiment>) =>
      dataScienceApi.createExperiment(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["experiments"] }),
  });
}

export function useUpdateExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Experiment> }) =>
      dataScienceApi.updateExperiment(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["experiments"] }),
  });
}

export function useDeleteExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataScienceApi.deleteExperiment(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["experiments"] }),
  });
}

export function useExperimentSummary() {
  return useQuery({
    queryKey: ["experiment-summary"],
    queryFn: dataScienceApi.getExperimentSummary,
  });
}

// Experiment Runs
export function useExperimentRuns(params?: {
  experiment?: string;
  status?: string;
}) {
  return useQuery<ExperimentRun[]>({
    queryKey: ["experiment-runs", params],
    queryFn: () => dataScienceApi.getRuns(params),
    staleTime: 30 * 1000,
  });
}

export function useExperimentRun(id: string | null) {
  return useQuery<ExperimentRun>({
    queryKey: ["experiment-run", id],
    queryFn: () => dataScienceApi.getRun(id!),
    enabled: !!id,
  });
}

export function useCreateExperimentRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ExperimentRun>) =>
      dataScienceApi.createRun(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["experiment-runs"] }),
  });
}

// Models
export function useModels(params?: { search?: string; framework?: string }) {
  return useQuery<MLModel[]>({
    queryKey: ["models", params],
    queryFn: () => dataScienceApi.getModels(params),
    staleTime: 30 * 1000,
  });
}

export function useModelVersions(params?: { model?: string; status?: string }) {
  return useQuery<ModelVersion[]>({
    queryKey: ["model-versions", params],
    queryFn: () => dataScienceApi.getModelVersions(params),
    staleTime: 30 * 1000,
  });
}

export function useDeployModelVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataScienceApi.deployModelVersion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-versions"] });
      queryClient.invalidateQueries({ queryKey: ["models"] });
    },
  });
}

export function useUndeployModelVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataScienceApi.undeployModelVersion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-versions"] });
      queryClient.invalidateQueries({ queryKey: ["models"] });
    },
  });
}

export function useServingInfo(versionId: string | null) {
  return useQuery({
    queryKey: ["serving-info", versionId],
    queryFn: () => dataScienceApi.getServingInfo(versionId!),
    enabled: !!versionId,
  });
}

export function useCreateFeatureGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FeatureGroup>) =>
      dataScienceApi.createFeatureGroup(data),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["feature-groups"] });
    },
  });
}

export function useFeatureGroups(params?: {
  entity_type?: string;
  online?: boolean;
}) {
  return useQuery<FeatureGroup[]>({
    queryKey: ["feature-groups", params],
    queryFn: () => dataScienceApi.getFeatureGroups(params),
    staleTime: 30 * 1000,
  });
}

export function useFeatureGroup(id: string | null) {
  return useQuery<FeatureGroup>({
    queryKey: ["feature-group", id],
    queryFn: () => dataScienceApi.getFeatureGroup(id!),
    enabled: !!id,
  });
}

export function useFeatureDefinitions(params?: { feature_group?: string }) {
  return useQuery<FeatureDefinition[]>({
    queryKey: ["feature-definitions", params],
    queryFn: () => dataScienceApi.getFeatureDefinitions(params),
    staleTime: 30 * 1000,
  });
}

export function useFeatureMaterializations(params?: {
  feature_group?: string;
}) {
  return useQuery<FeatureMaterialization[]>({
    queryKey: ["feature-materializations", params],
    queryFn: () => dataScienceApi.getFeatureMaterializations(params),
    staleTime: 30 * 1000,
  });
}

export function useMaterializeFeatures() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: any }) =>
      dataScienceApi.materializeFeatures(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-materializations"] });
    },
  });
}

export function useSyncOnlineFeatures() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => dataScienceApi.syncOnlineFeatures(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-groups"] });
    },
  });
}

export function useDeleteFeatureGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => dataScienceApi.deleteFeatureGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-groups"] });
    },
  });
}

export function useCreateFeatureEngineeringJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FeatureEngineeringJob>) =>
      dataScienceApi.createFeatureEngineeringJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-engineering-jobs"] });
    },
  });
}
