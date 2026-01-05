/**
 * Data Science API client for ML experiments, models, and feature store
 */

import { apiClient, getAuthOptions } from "./client";

// Paginated response type
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Types matching backend models

export interface Experiment {
  id: string;
  workspace: string;
  name: string;
  description: string;
  tags: string | null;
  status: "active" | "archived";
  created_by: string | null;
  created_by_name: string | null;
  run_count: number;
  created_at: string;
  updated_at: string;
}

export interface ExperimentRun {
  id: string;
  experiment: string;
  experiment_name: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  parameters: Record<string, any>;
  metrics: Record<string, any>;
  artifacts: Record<string, any>;
  start_time: string | null;
  end_time: string | null;
  error_message: string | null;
  created_at: string;
}

export interface MLModel {
  id: string;
  workspace: string;
  name: string;
  description: string;
  model_type: string;
  framework: string | null;
  tags: string | null;
  created_by: string | null;
  created_by_name: string | null;
  version_count: number;
  latest_version: {
    version_number: number;
    stage: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface ModelVersion {
  id: string;
  model: string;
  model_name: string;
  version_number: number;
  description: string;
  artifact_path: string | null;
  metrics: Record<string, any>;
  parameters: Record<string, any>;
  stage: "none" | "staging" | "production" | "archived";
  run: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeatureGroup {
  id: string;
  workspace: string;
  name: string;
  description: string;
  entity_type: string;
  features: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
  feature_count: number;
  online_enabled: boolean;
  offline_enabled: boolean;
  source_table: string | null;
  primary_key: string | null;
  event_time_column: string | null;
  ttl_minutes: number | null;
  tags: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeatureView {
  id: string;
  workspace: string;
  name: string;
  description: string;
  feature_group: string;
  feature_group_name: string;
  features: string[];
  query: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingDataset {
  id: string;
  workspace: string;
  name: string;
  description: string;
  feature_view: string;
  feature_view_name: string;
  version: number;
  query: string | null;
  storage_path: string | null;
  format: string;
  statistics: Record<string, any>;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

export interface ExperimentSummary {
  total_experiments: number;
  active_experiments: number;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
}

export interface ModelRegistrySummary {
  total_models: number;
  total_versions: number;
  production_models: number;
  staging_models: number;
  models_by_framework: Record<string, number>;
}

export interface FeatureStoreSummary {
  total_feature_groups: number;
  total_features: number;
  total_feature_views: number;
  total_training_datasets: number;
  online_enabled_groups: number;
}

export interface RunComparison {
  runs: ExperimentRun[];
  metrics_comparison: Record<string, Record<string, any>>;
  params_comparison: Record<string, Record<string, any>>;
}

// API Client
export const dataScienceApi = {
  // Experiments
  async getExperiments(params?: {
    status?: string;
    search?: string;
  }): Promise<Experiment[]> {
    const response = await apiClient.get<PaginatedResponse<Experiment>>(
      "/api/data-science/experiments/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getExperiment(id: string): Promise<Experiment> {
    return apiClient.get<Experiment>(
      `/api/data-science/experiments/${id}/`,
      getAuthOptions()
    );
  },

  async createExperiment(data: Partial<Experiment>): Promise<Experiment> {
    return apiClient.post<Experiment>(
      "/api/data-science/experiments/",
      data,
      getAuthOptions()
    );
  },

  async updateExperiment(
    id: string,
    data: Partial<Experiment>
  ): Promise<Experiment> {
    return apiClient.patch<Experiment>(
      `/api/data-science/experiments/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteExperiment(id: string): Promise<void> {
    return apiClient.delete(
      `/api/data-science/experiments/${id}/`,
      getAuthOptions()
    );
  },

  async getExperimentSummary(): Promise<ExperimentSummary> {
    return apiClient.get<ExperimentSummary>(
      "/api/data-science/experiments/summary/",
      getAuthOptions()
    );
  },

  // Experiment Runs
  async getRuns(params?: {
    experiment?: string;
    status?: string;
  }): Promise<ExperimentRun[]> {
    const response = await apiClient.get<PaginatedResponse<ExperimentRun>>(
      "/api/data-science/runs/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getRun(id: string): Promise<ExperimentRun> {
    return apiClient.get<ExperimentRun>(
      `/api/data-science/runs/${id}/`,
      getAuthOptions()
    );
  },

  async createRun(data: Partial<ExperimentRun>): Promise<ExperimentRun> {
    return apiClient.post<ExperimentRun>(
      "/api/data-science/runs/",
      data,
      getAuthOptions()
    );
  },

  async startRun(id: string): Promise<ExperimentRun> {
    return apiClient.post<ExperimentRun>(
      `/api/data-science/runs/${id}/start/`,
      {},
      getAuthOptions()
    );
  },

  async completeRun(
    id: string,
    metrics?: Record<string, any>
  ): Promise<ExperimentRun> {
    return apiClient.post<ExperimentRun>(
      `/api/data-science/runs/${id}/complete/`,
      { metrics },
      getAuthOptions()
    );
  },

  async failRun(id: string, error: string): Promise<ExperimentRun> {
    return apiClient.post<ExperimentRun>(
      `/api/data-science/runs/${id}/fail/`,
      { error },
      getAuthOptions()
    );
  },

  async logRunMetrics(
    id: string,
    metrics: Record<string, any>
  ): Promise<{ metrics: Record<string, any> }> {
    return apiClient.patch<{ metrics: Record<string, any> }>(
      `/api/data-science/runs/${id}/log_metrics/`,
      { metrics },
      getAuthOptions()
    );
  },

  async logRunParams(
    id: string,
    parameters: Record<string, any>
  ): Promise<{ parameters: Record<string, any> }> {
    return apiClient.patch<{ parameters: Record<string, any> }>(
      `/api/data-science/runs/${id}/log_params/`,
      { parameters },
      getAuthOptions()
    );
  },

  async compareRuns(runIds: string[]): Promise<RunComparison> {
    return apiClient.get<RunComparison>("/api/data-science/runs/compare/", {
      ...getAuthOptions(),
      params: { runs: runIds.join(",") },
    });
  },

  // ML Models
  async getModels(params?: {
    framework?: string;
    type?: string;
    search?: string;
  }): Promise<MLModel[]> {
    const response = await apiClient.get<PaginatedResponse<MLModel>>(
      "/api/data-science/models/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getModel(id: string): Promise<MLModel> {
    return apiClient.get<MLModel>(
      `/api/data-science/models/${id}/`,
      getAuthOptions()
    );
  },

  async createModel(data: Partial<MLModel>): Promise<MLModel> {
    return apiClient.post<MLModel>(
      "/api/data-science/models/",
      data,
      getAuthOptions()
    );
  },

  async updateModel(id: string, data: Partial<MLModel>): Promise<MLModel> {
    return apiClient.patch<MLModel>(
      `/api/data-science/models/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteModel(id: string): Promise<void> {
    return apiClient.delete(
      `/api/data-science/models/${id}/`,
      getAuthOptions()
    );
  },

  async getModelRegistrySummary(): Promise<ModelRegistrySummary> {
    return apiClient.get<ModelRegistrySummary>(
      "/api/data-science/models/summary/",
      getAuthOptions()
    );
  },

  // Model Versions
  async getModelVersions(params?: {
    model?: string;
    stage?: string;
  }): Promise<ModelVersion[]> {
    const response = await apiClient.get<PaginatedResponse<ModelVersion>>(
      "/api/data-science/versions/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getModelVersion(id: string): Promise<ModelVersion> {
    return apiClient.get<ModelVersion>(
      `/api/data-science/versions/${id}/`,
      getAuthOptions()
    );
  },

  async createModelVersion(data: Partial<ModelVersion>): Promise<ModelVersion> {
    return apiClient.post<ModelVersion>(
      "/api/data-science/versions/",
      data,
      getAuthOptions()
    );
  },

  async transitionModelVersionStage(
    id: string,
    stage: "none" | "staging" | "production" | "archived"
  ): Promise<ModelVersion> {
    return apiClient.post<ModelVersion>(
      `/api/data-science/versions/${id}/transition_stage/`,
      { stage },
      getAuthOptions()
    );
  },

  // Feature Groups
  async getFeatureGroups(params?: {
    entity_type?: string;
    online?: boolean;
  }): Promise<FeatureGroup[]> {
    const response = await apiClient.get<PaginatedResponse<FeatureGroup>>(
      "/api/data-science/feature-groups/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getFeatureGroup(id: string): Promise<FeatureGroup> {
    return apiClient.get<FeatureGroup>(
      `/api/data-science/feature-groups/${id}/`,
      getAuthOptions()
    );
  },

  async createFeatureGroup(data: Partial<FeatureGroup>): Promise<FeatureGroup> {
    return apiClient.post<FeatureGroup>(
      "/api/data-science/feature-groups/",
      data,
      getAuthOptions()
    );
  },

  async updateFeatureGroup(
    id: string,
    data: Partial<FeatureGroup>
  ): Promise<FeatureGroup> {
    return apiClient.patch<FeatureGroup>(
      `/api/data-science/feature-groups/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteFeatureGroup(id: string): Promise<void> {
    return apiClient.delete(
      `/api/data-science/feature-groups/${id}/`,
      getAuthOptions()
    );
  },

  async previewFeatureGroup(
    id: string,
    limit?: number
  ): Promise<{
    columns: any[];
    rows: any[];
    total_rows: number;
  }> {
    return apiClient.get(`/api/data-science/feature-groups/${id}/preview/`, {
      ...getAuthOptions(),
      params: { limit },
    });
  },

  async getFeatureStoreSummary(): Promise<FeatureStoreSummary> {
    return apiClient.get<FeatureStoreSummary>(
      "/api/data-science/feature-groups/summary/",
      getAuthOptions()
    );
  },

  // Feature Views
  async getFeatureViews(params?: {
    feature_group?: string;
  }): Promise<FeatureView[]> {
    const response = await apiClient.get<PaginatedResponse<FeatureView>>(
      "/api/data-science/feature-views/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getFeatureView(id: string): Promise<FeatureView> {
    return apiClient.get<FeatureView>(
      `/api/data-science/feature-views/${id}/`,
      getAuthOptions()
    );
  },

  async createFeatureView(data: Partial<FeatureView>): Promise<FeatureView> {
    return apiClient.post<FeatureView>(
      "/api/data-science/feature-views/",
      data,
      getAuthOptions()
    );
  },

  async updateFeatureView(
    id: string,
    data: Partial<FeatureView>
  ): Promise<FeatureView> {
    return apiClient.patch<FeatureView>(
      `/api/data-science/feature-views/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteFeatureView(id: string): Promise<void> {
    return apiClient.delete(
      `/api/data-science/feature-views/${id}/`,
      getAuthOptions()
    );
  },

  // Training Datasets
  async getTrainingDatasets(params?: {
    feature_view?: string;
  }): Promise<TrainingDataset[]> {
    const response = await apiClient.get<PaginatedResponse<TrainingDataset>>(
      "/api/data-science/training-datasets/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getTrainingDataset(id: string): Promise<TrainingDataset> {
    return apiClient.get<TrainingDataset>(
      `/api/data-science/training-datasets/${id}/`,
      getAuthOptions()
    );
  },

  async createTrainingDataset(
    data: Partial<TrainingDataset>
  ): Promise<TrainingDataset> {
    return apiClient.post<TrainingDataset>(
      "/api/data-science/training-datasets/",
      data,
      getAuthOptions()
    );
  },

  async deleteTrainingDataset(id: string): Promise<void> {
    return apiClient.delete(
      `/api/data-science/training-datasets/${id}/`,
      getAuthOptions()
    );
  },

  async downloadTrainingDataset(
    id: string
  ): Promise<{ url: string; format: string; expires_in: number }> {
    return apiClient.get(
      `/api/data-science/training-datasets/${id}/download/`,
      getAuthOptions()
    );
  },

  async getTrainingDatasetStatistics(id: string): Promise<Record<string, any>> {
    return apiClient.get(
      `/api/data-science/training-datasets/${id}/statistics/`,
      getAuthOptions()
    );
  },
};

export default dataScienceApi;
