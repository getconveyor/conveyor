/**
 * Application-wide constants
 */

// Routes
export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  LOGIN: "/login",
  REGISTER: "/register",
  SELECT_WORKSPACE: "/select-workspace",

  // Data Integration
  DATA_INTEGRATION: "/data-integration",
  PIPELINES: "/data-integration/pipelines",
  PIPELINE_BUILDER: "/data-integration/pipelines/builder",
  DATA_SOURCES: "/data-integration/data-sources",
  SOURCE_CONNECTORS: "/data-integration/source-connectors",
  PIPELINE_RUNS: "/data-integration/pipeline-runs",

  // Lakehouse
  LAKEHOUSE: "/lakehouse",
  SQL_EDITOR: "/lakehouse/sql-editor-v2",
  TABLES: "/lakehouse/tables",

  // Analytics
  DATA_ANALYTICS: "/data-analytics",
  DASHBOARDS: "/data-analytics/dashboards",
  REPORTS: "/data-analytics/reports",
  WORKBOOKS: "/data-analytics/workbooks",

  // Data Science
  DATA_SCIENCE: "/data-science",
  EXPERIMENTS: "/data-science/experiments",
  MODELS: "/data-science/models",

  // Governance
  DATA_GOVERNANCE: "/data-governance",
  CATALOG: "/data-governance/catalog",
  LINEAGE: "/data-governance/lineage",
  POLICIES: "/data-governance/policies",

  // Monitoring
  MONITORING: "/monitoring",
  LOGS: "/monitoring/logs",
  HEALTH: "/monitoring/health",

  // Real-time
  REAL_TIME: "/real-time-analytics",
  STREAMING: "/real-time-analytics/streaming",
  ALERTS: "/real-time-analytics/alerts",

  // Settings
  SETTINGS: "/settings",
  PROFILE: "/settings/profile",
  SECURITY: "/settings/security",
  API_KEYS: "/settings/api-keys",
} as const;

// Pipeline Status
export const PIPELINE_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  PAUSED: "paused",
  FAILED: "failed",
  ARCHIVED: "archived",
} as const;

export type PipelineStatus = typeof PIPELINE_STATUS[keyof typeof PIPELINE_STATUS];

// Pipeline Run Status
export const RUN_STATUS = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export type RunStatus = typeof RUN_STATUS[keyof typeof RUN_STATUS];

// Data Source Status
export const SOURCE_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ERROR: "error",
  TESTING: "testing",
} as const;

export type SourceStatus = typeof SOURCE_STATUS[keyof typeof SOURCE_STATUS];

// Alert Severity
export const ALERT_SEVERITY = {
  CRITICAL: "critical",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
} as const;

export type AlertSeverity = typeof ALERT_SEVERITY[keyof typeof ALERT_SEVERITY];

// Alert Status
export const ALERT_STATUS = {
  ACTIVE: "active",
  ACKNOWLEDGED: "acknowledged",
  RESOLVED: "resolved",
  DISMISSED: "dismissed",
} as const;

export type AlertStatus = typeof ALERT_STATUS[keyof typeof ALERT_STATUS];

// Model Stage
export const MODEL_STAGE = {
  NONE: "none",
  STAGING: "staging",
  PRODUCTION: "production",
  ARCHIVED: "archived",
} as const;

export type ModelStage = typeof MODEL_STAGE[keyof typeof MODEL_STAGE];

// Experiment Status
export const EXPERIMENT_STATUS = {
  ACTIVE: "active",
  ARCHIVED: "archived",
} as const;

export type ExperimentStatus = typeof EXPERIMENT_STATUS[keyof typeof EXPERIMENT_STATUS];

// System Health Status
export const HEALTH_STATUS = {
  HEALTHY: "healthy",
  UNHEALTHY: "unhealthy",
  DEGRADED: "degraded",
  UNKNOWN: "unknown",
} as const;

export type HealthStatus = typeof HEALTH_STATUS[keyof typeof HEALTH_STATUS];

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

// API
export const API_TIMEOUT = 30000; // 30 seconds
export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY = 1000; // 1 second

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKENS: "auth_tokens",
  AUTH_USER: "auth_user",
  CURRENT_WORKSPACE: "currentWorkspaceId",
  THEME: "theme",
  SIDEBAR_STATE: "sidebar-state",
} as const;

// Date Formats
export const DATE_FORMATS = {
  SHORT: "MMM d, yyyy",
  LONG: "MMMM d, yyyy, h:mm a",
  TIME: "h:mm a",
  ISO: "yyyy-MM-dd'T'HH:mm:ss",
} as const;

// File Upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = {
  CSV: ["text/csv", ".csv"],
  JSON: ["application/json", ".json"],
  PARQUET: ["application/octet-stream", ".parquet"],
  EXCEL: ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".xlsx", ".xls"],
} as const;

// Status Colors (for badges, etc.)
export const STATUS_COLORS = {
  active: "success",
  running: "default",
  completed: "success",
  failed: "destructive",
  paused: "warning",
  draft: "secondary",
  pending: "secondary",
  cancelled: "secondary",
  archived: "secondary",
  error: "destructive",
  warning: "warning",
  info: "default",
  critical: "destructive",
} as const;

// Connector Types
export const CONNECTOR_TYPES = {
  DATABASE: ["postgresql", "mysql", "mongodb", "oracle", "sqlserver"],
  CLOUD_STORAGE: ["s3", "gcs", "azure_blob"],
  SAAS: ["salesforce", "hubspot", "stripe", "shopify"],
  STREAMING: ["kafka", "kinesis", "pubsub", "eventhub"],
  API: ["rest_api", "graphql"],
} as const;
