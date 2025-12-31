export type WorkflowStatus = "running" | "idle" | "failed" | "success"

export type StepType = "extract" | "transform" | "load" | "validate" | "notify"

export type DataSourceType = "database" | "file" | "api" | "stream"

export type FailureAction = "stop" | "continue" | "notify"

export interface DataSource {
  type: DataSourceType
  connectionId?: string
  path?: string
  query?: string
  tableName?: string
}

export interface ErrorHandling {
  retryAttempts: number
  onFailure: FailureAction
  alertEmails?: string[]
}

export interface WorkflowStep {
  id: string
  name: string
  description: string
  type: StepType
  notebookId?: string
  inputSource?: DataSource
  outputDestination?: DataSource
  errorHandling: ErrorHandling
  order: number
}

export interface ScheduleConfig {
  type: "hourly" | "daily" | "weekly" | "cron" | "realtime" | "manual"
  cronExpression?: string
  timezone?: string
}

export interface Workflow {
  id: string
  name: string
  description: string
  status: WorkflowStatus
  steps: WorkflowStep[]
  lastRun: string
  nextRun: string
  successRate: number
  schedule: ScheduleConfig
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  generateSteps: () => WorkflowStep[]
}
