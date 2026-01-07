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
  row_count: number | null;
  last_updated_at: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeatureDefinition {
  id: string;
  feature_group: string;
  feature_group_name: string;
  name: string;
  description: string;
  dtype:
    | "int"
    | "float"
    | "string"
    | "bool"
    | "datetime"
    | "array"
    | "embedding";
  transform_type:
    | "passthrough"
    | "standard_scale"
    | "min_max_scale"
    | "log_transform"
    | "one_hot"
    | "label_encode"
    | "embedding"
    | "bucketize"
    | "time_since"
    | "date_parts"
    | "rolling_agg"
    | "custom_sql"
    | "custom_python";
  transform_config: Record<string, any>;
  source_columns: string[];
  transformation_expression: string;
  statistics: FeatureStatistics | null;
  importance_score: number | null;
  validation_rules: Array<{ rule_type: string; params: Record<string, any> }>;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeatureEngineeringStep {
  name: string;
  type: string;
  source: string;
  config?: Record<string, any>;
  expression?: string;
}

export interface DataPrepConfig {
  handle_nulls?: {
    strategy:
      | "drop"
      | "fill"
      | "fill_mean"
      | "fill_median"
      | "fill_mode"
      | "fill_forward"
      | "fill_backward";
    fill_value?: any;
    columns?: string[];
  };
  handle_outliers?: {
    method: "clip" | "remove" | "replace_mean" | "replace_median";
    lower?: number;
    upper?: number;
    use_percentile?: boolean;
    columns?: string[];
  };
  deduplicate?: {
    columns?: string[];
    keep?: "first" | "last";
  };
  filter_conditions?: Array<{
    column: string;
    op:
      | "eq"
      | "ne"
      | "gt"
      | "gte"
      | "lt"
      | "lte"
      | "in"
      | "not_in"
      | "is_null"
      | "is_not_null"
      | "contains";
    value: any;
  }>;
}

export interface FeatureEngineeringJob {
  id: string;
  workspace: string;
  name: string;
  description: string;
  source_type: string;
  source_table: string;
  source_query: string;
  target_feature_group: string;
  target_feature_group_name: string;
  transform_mode: "sql" | "python" | "hybrid";
  sql_query: string;
  python_code: string;
  data_prep_config: DataPrepConfig;
  feature_engineering_steps: FeatureEngineeringStep[];
  schedule_type: "manual" | "cron" | "interval" | "event";
  schedule_cron: string;
  schedule_interval_minutes: number | null;
  is_incremental: boolean;
  watermark_column: string;
  last_watermark: Record<string, any> | null;
  backfill_start_date: string | null;
  backfill_end_date: string | null;
  status: "active" | "paused" | "error" | "draft";
  last_run_at: string | null;
  last_run_status: string;
  last_run_duration_seconds: number | null;
  last_run_rows_processed: number | null;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  last_error_message: string;
  last_error_at: string | null;
  owner: string | null;
  owner_name: string | null;
  run_count: number;
  created_at: string;
  updated_at: string;
}

export interface FeatureEngineeringRun {
  id: string;
  job: string;
  job_name: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  current_step: string;
  progress_percent: number;
  rows_read: number;
  rows_processed: number;
  rows_written: number;
  rows_failed: number;
  data_start_time: string | null;
  data_end_time: string | null;
  watermark_value: Record<string, any> | null;
  error_message: string;
  error_traceback: string;
  logs: string;
  celery_task_id: string;
  triggered_by: string | null;
  triggered_by_name: string | null;
  created_at: string;
}

export interface FeatureMaterialization {
  id: string;
  feature_group: string;
  feature_group_name: string;
  engineering_run: string | null;
  store_type: "offline" | "online" | "both";
  status: "pending" | "running" | "completed" | "failed";
  started_at: string | null;
  completed_at: string | null;
  data_start_time: string | null;
  data_end_time: string | null;
  rows_materialized: number;
  features_materialized: number;
  storage_bytes: number | null;
  offline_path: string;
  offline_format: string;
  online_keys_updated: number;
  online_ttl_seconds: number | null;
  error_message: string;
  created_at: string;
}

export interface OnlineFeatureStore {
  id: string;
  workspace: string;
  name: string;
  description: string;
  redis_host: string;
  redis_port: number;
  redis_db: number;
  redis_key_prefix: string;
  default_ttl_seconds: number;
  is_active: boolean;
  last_sync_at: string | null;
  total_keys: number;
  memory_used_bytes: number | null;
  avg_latency_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface FeatureStatistics {
  feature_name?: string;
  dtype?: string;
  count: number;
  non_null_count: number;
  null_count: number;
  null_percentage: number;
  inferred_dtype?: string;
  // Numeric stats
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  std?: number;
  variance?: number;
  q1?: number;
  q3?: number;
  iqr?: number;
  // Categorical stats
  unique_count?: number;
  most_common?: Array<[any, number]>;
  cardinality?: number;
  // Boolean stats
  true_count?: number;
  false_count?: number;
  true_percentage?: number;
  // Datetime stats
  range_days?: number;
  // Histogram
  histogram?: {
    counts: number[];
    bin_edges: number[];
  };
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

  // Model Serving
  async deployModelVersion(id: string): Promise<{
    detail: string;
    deployment_key: string;
    endpoint: string;
  }> {
    return apiClient.post(
      `/api/data-science/versions/${id}/deploy/`,
      {},
      getAuthOptions()
    );
  },

  async undeployModelVersion(id: string): Promise<{ detail: string }> {
    return apiClient.post(
      `/api/data-science/versions/${id}/undeploy/`,
      {},
      getAuthOptions()
    );
  },

  async predict(
    versionId: string,
    data: number[] | number[][] | Record<string, any>
  ): Promise<{
    model: string;
    version: number;
    predictions: any[];
    timestamp: string;
  }> {
    return apiClient.post(
      `/api/data-science/versions/${versionId}/predict/`,
      { data },
      getAuthOptions()
    );
  },

  async batchPredict(
    versionId: string,
    batch: any[][]
  ): Promise<{
    model: string;
    version: number;
    predictions: any[];
    batch_size: number;
    timestamp: string;
  }> {
    return apiClient.post(
      `/api/data-science/versions/${versionId}/batch_predict/`,
      { batch },
      getAuthOptions()
    );
  },

  async getServingInfo(versionId: string): Promise<{
    model_id: string;
    model_name: string;
    version: number;
    is_deployed: boolean;
    deployed_at: string | null;
    framework: string;
    endpoint: string | null;
    batch_endpoint: string | null;
  }> {
    return apiClient.get(
      `/api/data-science/versions/${versionId}/serving_info/`,
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

  // Feature Definitions
  async getFeatureDefinitions(params?: {
    feature_group?: string;
    active?: boolean;
  }): Promise<FeatureDefinition[]> {
    const response = await apiClient.get<PaginatedResponse<FeatureDefinition>>(
      "/api/data-science/feature-definitions/",
      {
        ...getAuthOptions(),
        params,
      }
    );
    return response.results;
  },

  async getFeatureDefinition(id: string): Promise<FeatureDefinition> {
    return apiClient.get<FeatureDefinition>(
      `/api/data-science/feature-definitions/${id}/`,
      getAuthOptions()
    );
  },

  async createFeatureDefinition(
    data: Partial<FeatureDefinition>
  ): Promise<FeatureDefinition> {
    return apiClient.post<FeatureDefinition>(
      "/api/data-science/feature-definitions/",
      data,
      getAuthOptions()
    );
  },

  async updateFeatureDefinition(
    id: string,
    data: Partial<FeatureDefinition>
  ): Promise<FeatureDefinition> {
    return apiClient.patch<FeatureDefinition>(
      `/api/data-science/feature-definitions/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteFeatureDefinition(id: string): Promise<void> {
    return apiClient.delete(
      `/api/data-science/feature-definitions/${id}/`,
      getAuthOptions()
    );
  },

  async bulkCreateFeatureDefinitions(
    definitions: Partial<FeatureDefinition>[]
  ): Promise<{ created: number; ids: string[] }> {
    return apiClient.post(
      "/api/data-science/feature-definitions/bulk_create/",
      { definitions },
      getAuthOptions()
    );
  },

  // Feature Engineering Jobs
  async getFeatureEngineeringJobs(params?: {
    status?: string;
    feature_group?: string;
    search?: string;
  }): Promise<FeatureEngineeringJob[]> {
    const response = await apiClient.get<
      PaginatedResponse<FeatureEngineeringJob>
    >("/api/data-science/feature-engineering-jobs/", {
      ...getAuthOptions(),
      params,
    });
    return response.results;
  },

  async getFeatureEngineeringJob(id: string): Promise<FeatureEngineeringJob> {
    return apiClient.get<FeatureEngineeringJob>(
      `/api/data-science/feature-engineering-jobs/${id}/`,
      getAuthOptions()
    );
  },

  async createFeatureEngineeringJob(
    data: Partial<FeatureEngineeringJob>
  ): Promise<FeatureEngineeringJob> {
    return apiClient.post<FeatureEngineeringJob>(
      "/api/data-science/feature-engineering-jobs/",
      data,
      getAuthOptions()
    );
  },

  async updateFeatureEngineeringJob(
    id: string,
    data: Partial<FeatureEngineeringJob>
  ): Promise<FeatureEngineeringJob> {
    return apiClient.patch<FeatureEngineeringJob>(
      `/api/data-science/feature-engineering-jobs/${id}/`,
      data,
      getAuthOptions()
    );
  },

  async deleteFeatureEngineeringJob(id: string): Promise<void> {
    return apiClient.delete(
      `/api/data-science/feature-engineering-jobs/${id}/`,
      getAuthOptions()
    );
  },

  async runFeatureEngineeringJob(
    id: string,
    asyncExecution: boolean = true
  ): Promise<{
    status: string;
    task_id?: string;
    job_id: string;
    message?: string;
  }> {
    return apiClient.post(
      `/api/data-science/feature-engineering-jobs/${id}/run/`,
      { async_execution: asyncExecution },
      getAuthOptions()
    );
  },

  async pauseFeatureEngineeringJob(
    id: string
  ): Promise<{ status: string; job_id: string }> {
    return apiClient.post(
      `/api/data-science/feature-engineering-jobs/${id}/pause/`,
      {},
      getAuthOptions()
    );
  },

  async resumeFeatureEngineeringJob(
    id: string
  ): Promise<{ status: string; job_id: string }> {
    return apiClient.post(
      `/api/data-science/feature-engineering-jobs/${id}/resume/`,
      {},
      getAuthOptions()
    );
  },

  async getFeatureEngineeringJobRuns(
    id: string
  ): Promise<FeatureEngineeringRun[]> {
    return apiClient.get(
      `/api/data-science/feature-engineering-jobs/${id}/runs/`,
      getAuthOptions()
    );
  },

  async testFeatureEngineeringJob(
    id: string,
    sampleSize?: number
  ): Promise<{
    status: string;
    job_id: string;
    data_prep_config: Record<string, any>;
    feature_engineering_steps: FeatureEngineeringStep[];
  }> {
    return apiClient.post(
      `/api/data-science/feature-engineering-jobs/${id}/test/`,
      {},
      {
        ...getAuthOptions(),
        params: { sample_size: sampleSize },
      }
    );
  },

  // Feature Engineering Runs
  async getFeatureEngineeringRuns(params?: {
    job?: string;
    status?: string;
  }): Promise<FeatureEngineeringRun[]> {
    const response = await apiClient.get<
      PaginatedResponse<FeatureEngineeringRun>
    >("/api/data-science/feature-engineering-runs/", {
      ...getAuthOptions(),
      params,
    });
    return response.results;
  },

  async getFeatureEngineeringRun(id: string): Promise<FeatureEngineeringRun> {
    return apiClient.get<FeatureEngineeringRun>(
      `/api/data-science/feature-engineering-runs/${id}/`,
      getAuthOptions()
    );
  },

  async cancelFeatureEngineeringRun(
    id: string
  ): Promise<{ status: string; run_id: string }> {
    return apiClient.post(
      `/api/data-science/feature-engineering-runs/${id}/cancel/`,
      {},
      getAuthOptions()
    );
  },

  async getFeatureEngineeringRunLogs(id: string): Promise<{
    run_id: string;
    logs: string;
    error_message: string;
    error_traceback: string;
  }> {
    return apiClient.get(
      `/api/data-science/feature-engineering-runs/${id}/logs/`,
      getAuthOptions()
    );
  },

  // Feature Materializations
  async getFeatureMaterializations(params?: {
    feature_group?: string;
    status?: string;
  }): Promise<FeatureMaterialization[]> {
    const response = await apiClient.get<
      PaginatedResponse<FeatureMaterialization>
    >("/api/data-science/materializations/", {
      ...getAuthOptions(),
      params,
    });
    return response.results;
  },

  async getFeatureMaterialization(id: string): Promise<FeatureMaterialization> {
    return apiClient.get<FeatureMaterialization>(
      `/api/data-science/materializations/${id}/`,
      getAuthOptions()
    );
  },

  // Online Feature Store
  async getOnlineFeatureStores(): Promise<OnlineFeatureStore[]> {
    const response = await apiClient.get<PaginatedResponse<OnlineFeatureStore>>(
      "/api/data-science/online-stores/",
      getAuthOptions()
    );
    return response.results;
  },

  async getOnlineFeatureStore(id: string): Promise<OnlineFeatureStore> {
    return apiClient.get<OnlineFeatureStore>(
      `/api/data-science/online-stores/${id}/`,
      getAuthOptions()
    );
  },

  async createOnlineFeatureStore(
    data: Partial<OnlineFeatureStore>
  ): Promise<OnlineFeatureStore> {
    return apiClient.post<OnlineFeatureStore>(
      "/api/data-science/online-stores/",
      data,
      getAuthOptions()
    );
  },

  async testOnlineFeatureStoreConnection(id: string): Promise<{
    status: string;
    redis_version?: string;
    connected_clients?: number;
    used_memory_human?: string;
    error?: string;
  }> {
    return apiClient.post(
      `/api/data-science/online-stores/${id}/test_connection/`,
      {},
      getAuthOptions()
    );
  },

  async getOnlineFeatureStoreStats(id: string): Promise<{
    total_keys: number;
    memory_used_bytes: number;
    memory_used_human: string;
    connected_clients: number;
    uptime_in_days: number;
  }> {
    return apiClient.get(
      `/api/data-science/online-stores/${id}/stats/`,
      getAuthOptions()
    );
  },

  // Feature Group Extended Actions
  async materializeFeatures(
    featureGroupId: string,
    options: {
      store_type?: "offline" | "online" | "both";
      start_time?: string;
      end_time?: string;
    }
  ): Promise<{
    status: string;
    task_id: string;
    feature_group_id: string;
    store_type: string;
  }> {
    return apiClient.post(
      `/api/data-science/feature-groups/${featureGroupId}/materialize/`,
      options,
      getAuthOptions()
    );
  },

  async getOnlineFeatures(
    featureGroupId: string,
    entityIds: string[],
    features?: string[]
  ): Promise<
    Array<{
      entity_id: string;
      [key: string]: any;
    }>
  > {
    return apiClient.post(
      `/api/data-science/feature-groups/${featureGroupId}/get_features/`,
      { entity_ids: entityIds, features },
      getAuthOptions()
    );
  },

  async getFeatureGroupStatistics(
    featureGroupId: string
  ): Promise<FeatureStatistics[]> {
    return apiClient.get(
      `/api/data-science/feature-groups/${featureGroupId}/feature_statistics/`,
      getAuthOptions()
    );
  },

  async syncOnlineFeatures(
    featureGroupId: string,
    entityIds?: string[]
  ): Promise<{
    status: string;
    task_id: string;
    feature_group_id: string;
  }> {
    return apiClient.post(
      `/api/data-science/feature-groups/${featureGroupId}/sync_online/`,
      { entity_ids: entityIds },
      getAuthOptions()
    );
  },

  async getFeatureGroupMaterializations(
    featureGroupId: string
  ): Promise<FeatureMaterialization[]> {
    return apiClient.get(
      `/api/data-science/feature-groups/${featureGroupId}/materializations/`,
      getAuthOptions()
    );
  },

  // Feature View Extended Actions
  async createTrainingDatasetFromView(
    featureViewId: string,
    options: {
      name: string;
      description?: string;
      label_column?: string;
      start_time?: string;
      end_time?: string;
      split_config?: {
        train?: number;
        validation?: number;
        test?: number;
      };
    }
  ): Promise<{
    status: string;
    task_id: string;
    feature_view_id: string;
    name: string;
  }> {
    return apiClient.post(
      `/api/data-science/feature-views/${featureViewId}/create_training_dataset/`,
      options,
      getAuthOptions()
    );
  },

  async previewFeatureView(
    featureViewId: string,
    limit?: number
  ): Promise<{
    columns: string[];
    rows: any[][];
    feature_view: string;
  }> {
    return apiClient.get(
      `/api/data-science/feature-views/${featureViewId}/preview_data/`,
      {
        ...getAuthOptions(),
        params: { limit },
      }
    );
  },
};

export default dataScienceApi;
