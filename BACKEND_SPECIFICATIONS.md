# Conveyor Backend Specifications

This document provides comprehensive backend specifications for the Conveyor data platform based on the implemented frontend features.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack Recommendations](#technology-stack-recommendations)
3. [Data Models](#data-models)
4. [API Endpoints](#api-endpoints)
5. [Authentication & Authorization](#authentication--authorization)
6. [Real-Time Features](#real-time-features)
7. [Database Schema](#database-schema)
8. [Message Queues & Event Streaming](#message-queues--event-streaming)
9. [File Storage](#file-storage)
10. [Monitoring & Observability](#monitoring--observability)

---

## Architecture Overview

### System Components

```
┌─────────────────┐
│   Next.js App   │
│   (Frontend)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Gateway   │
│   (REST/GraphQL)│
└────────┬────────┘
         │
    ┌────┴────┬────────────┬──────────┬─────────────┐
    ▼         ▼            ▼          ▼             ▼
┌────────┐ ┌──────┐ ┌──────────┐ ┌────────┐ ┌──────────┐
│ Auth   │ │ Core │ │ Streaming│ │ ML/AI  │ │Analytics │
│Service │ │ API  │ │ Service  │ │Service │ │ Engine   │
└────────┘ └──────┘ └──────────┘ └────────┘ └──────────┘
    │         │           │           │            │
    └─────────┴───────────┴───────────┴────────────┘
                          │
         ┌────────────────┴────────────────┐
         ▼                ▼                ▼
    ┌─────────┐    ┌──────────┐    ┌──────────┐
    │PostgreSQL│    │  Redis   │    │ S3/Minio │
    │         │    │  Cache   │    │  Storage │
    └─────────┘    └──────────┘    └──────────┘
         │                              │
         ▼                              ▼
    ┌─────────┐                  ┌──────────┐
    │ Kafka/  │                  │TimescaleDB│
    │RabbitMQ │                  │  (TSDB)  │
    └─────────┘                  └──────────┘
```

---

## Technology Stack Recommendations

### Backend Framework
- **Primary**: Node.js with Express/Fastify OR Python with FastAPI
- **Alternative**: Go for high-performance services

### Databases
- **PostgreSQL 15+**: Primary relational database
- **TimescaleDB**: Time-series data for analytics/monitoring
- **Redis**: Caching, session management, real-time features
- **MongoDB** (Optional): Document storage for flexible schemas

### Message Brokers
- **Apache Kafka**: Event streaming, pipeline orchestration
- **RabbitMQ**: Task queues, background jobs

### Storage
- **MinIO/S3**: Object storage for data lake
- **Local volumes**: Development storage

### Real-Time
- **Socket.io/WebSockets**: Real-time updates
- **Server-Sent Events (SSE)**: Live dashboards

### ML/Data Science
- **Jupyter Hub**: Notebook management
- **MLflow**: Model tracking and registry
- **Airflow**: Workflow orchestration

---

## Data Models

### 1. Data Integration

#### Pipeline
```typescript
interface Pipeline {
  id: string                    // UUID
  name: string
  description: string
  status: 'running' | 'paused' | 'failed' | 'success' | 'idle'
  source: string                // Reference to Connection
  destination: string           // Reference to Connection
  schedule: string              // Cron expression or frequency
  lastRun: Date | null
  nextRun: Date | null
  runCount: number
  successRate: number
  recordsProcessed: number
  config: Record<string, any>   // JSON configuration
  createdBy: string             // User ID
  createdAt: Date
  updatedAt: Date
}
```

#### Connection
```typescript
interface Connection {
  id: string
  name: string
  type: 'mysql' | 'postgresql' | 'mongodb' | 's3' | 'kafka' | 'api' | 'salesforce'
  host: string
  port: number
  database?: string
  username: string
  password: string              // Encrypted
  ssl: boolean
  status: 'active' | 'inactive' | 'error'
  lastTested: Date
  config: Record<string, any>
  createdAt: Date
  updatedAt: Date
}
```

#### DataSource
```typescript
interface DataSource {
  id: string
  name: string
  type: string
  connectionId: string
  tables: string[]
  status: 'connected' | 'disconnected' | 'error'
  lastSync: Date
  recordCount: number
  createdAt: Date
  updatedAt: Date
}
```

#### Schedule
```typescript
interface Schedule {
  id: string
  name: string
  cronExpression: string
  timezone: string
  pipelineId: string
  enabled: boolean
  lastRun: Date | null
  nextRun: Date
  createdAt: Date
  updatedAt: Date
}
```

---

### 2. Data Transformation

#### Notebook
```typescript
interface Notebook {
  id: string
  name: string
  description: string
  kernel: 'python' | 'sql' | 'scala' | 'r'
  content: string               // IPYNB JSON
  status: 'idle' | 'running' | 'error'
  lastRun: Date | null
  ownerId: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}
```

#### Workflow
```typescript
interface Workflow {
  id: string
  name: string
  description: string
  template: 'etl' | 'data_quality' | 'custom'
  steps: WorkflowStep[]
  status: 'draft' | 'active' | 'paused' | 'completed'
  schedule: string | null
  lastRun: Date | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

interface WorkflowStep {
  id: string
  name: string
  type: 'transform' | 'filter' | 'aggregate' | 'join' | 'notebook'
  config: Record<string, any>
  order: number
  dependsOn: string[]           // Step IDs
}
```

#### Job
```typescript
interface Job {
  id: string
  name: string
  type: 'notebook' | 'workflow' | 'pipeline'
  referenceId: string           // ID of the notebook/workflow
  status: 'queued' | 'running' | 'success' | 'failed'
  startTime: Date | null
  endTime: Date | null
  duration: number | null       // milliseconds
  logs: string
  metrics: Record<string, any>
  triggeredBy: 'manual' | 'schedule' | 'api'
  userId: string
  createdAt: Date
}
```

---

### 3. Data Lake

#### File
```typescript
interface File {
  id: string
  name: string
  path: string
  type: 'csv' | 'json' | 'parquet' | 'avro' | 'orc'
  size: number                  // bytes
  bucket: string
  schema: Schema | null
  tags: string[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
  metadata: Record<string, any>
}
```

#### Schema
```typescript
interface Schema {
  id: string
  name: string
  version: string
  columns: SchemaColumn[]
  format: string
  fileId: string | null
  createdAt: Date
  updatedAt: Date
}

interface SchemaColumn {
  name: string
  type: string
  nullable: boolean
  description?: string
}
```

#### Storage
```typescript
interface Storage {
  id: string
  name: string
  type: 's3' | 'azure_blob' | 'gcs' | 'local'
  bucket: string
  region?: string
  totalSize: number
  fileCount: number
  config: Record<string, any>
  createdAt: Date
  updatedAt: Date
}
```

---

### 4. Data Warehouse

#### Table
```typescript
interface Table {
  id: string
  name: string
  database: string
  schema: string
  type: 'table' | 'view' | 'materialized_view'
  columns: TableColumn[]
  rowCount: number
  size: number
  partitioned: boolean
  partitionKey?: string
  indexes: Index[]
  description: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

interface TableColumn {
  name: string
  dataType: string
  nullable: boolean
  primaryKey: boolean
  foreignKey?: ForeignKey
  description?: string
}

interface ForeignKey {
  table: string
  column: string
}

interface Index {
  name: string
  columns: string[]
  unique: boolean
  type: 'btree' | 'hash' | 'gin' | 'gist'
}
```

#### Query
```typescript
interface Query {
  id: string
  name?: string
  sql: string
  database: string
  status: 'running' | 'completed' | 'failed'
  executionTime: number         // milliseconds
  rowsReturned: number
  bytesScanned: number
  error?: string
  userId: string
  savedQuery: boolean
  createdAt: Date
}
```

#### QueryHistory
```typescript
interface QueryHistory {
  id: string
  queryId: string
  userId: string
  executedAt: Date
  executionTime: number
  rowsReturned: number
  cached: boolean
}
```

---

### 5. Real-Time Analytics

#### StreamingJob
```typescript
interface StreamingJob {
  id: string
  name: string
  source: string                // Kafka topic, Kinesis stream, etc.
  destination: string
  status: 'running' | 'paused' | 'stopped' | 'error'
  throughput: number            // records/second
  recordsProcessed: number
  latency: number               // milliseconds
  errorRate: number             // percentage
  uptime: number                // percentage
  config: Record<string, any>
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
```

#### Event
```typescript
interface Event {
  id: string
  type: string
  source: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  message: string
  data: Record<string, any>
  timestamp: Date
  userId?: string
  processed: boolean
}
```

#### Alert
```typescript
interface Alert {
  id: string
  name: string
  condition: string
  metric: string
  threshold: number
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
  severity: 'critical' | 'warning' | 'info'
  status: 'active' | 'triggered' | 'paused'
  enabled: boolean
  lastTriggered: Date | null
  triggerCount: number
  actions: AlertAction[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

interface AlertAction {
  type: 'email' | 'slack' | 'webhook' | 'sms'
  config: Record<string, any>
}
```

#### Dashboard
```typescript
interface Dashboard {
  id: string
  name: string
  description: string
  type: 'real-time' | 'analytics'
  layout: DashboardWidget[]
  refreshInterval: number       // seconds
  shared: boolean
  favorite: boolean
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

interface DashboardWidget {
  id: string
  type: 'chart' | 'metric' | 'table' | 'map'
  title: string
  config: Record<string, any>
  dataSource: string
  position: { x: number; y: number; w: number; h: number }
}
```

---

### 6. Data Analytics

#### Report
```typescript
interface Report {
  id: string
  name: string
  description: string
  type: 'scheduled' | 'ad-hoc'
  schedule: string | null
  format: 'pdf' | 'excel' | 'csv'
  recipients: string[]
  dashboardId: string | null
  lastRun: Date | null
  ownerId: string
  createdAt: Date
  updatedAt: Date
}
```

#### Workbook
```typescript
interface Workbook {
  id: string
  name: string
  description: string
  sheets: WorkbookSheet[]
  shared: boolean
  ownerId: string
  collaborators: string[]
  createdAt: Date
  updatedAt: Date
}

interface WorkbookSheet {
  id: string
  name: string
  type: 'query' | 'visualization' | 'notebook'
  content: Record<string, any>
  order: number
}
```

---

### 7. Data Science

#### Model
```typescript
interface Model {
  id: string
  name: string
  description: string
  framework: 'scikit-learn' | 'tensorflow' | 'pytorch' | 'huggingface'
  version: string
  status: 'deployed' | 'training' | 'ready' | 'failed'
  accuracy: number
  metrics: Record<string, any>
  artifactPath: string          // S3/MinIO path
  lastTrained: Date
  trainedBy: string
  deploymentUrl?: string
  createdAt: Date
  updatedAt: Date
}
```

#### Experiment
```typescript
interface Experiment {
  id: string
  name: string
  description: string
  modelId: string
  parameters: Record<string, any>
  metrics: Record<string, any>
  status: 'running' | 'completed' | 'failed'
  startTime: Date
  endTime: Date | null
  artifacts: string[]
  userId: string
  createdAt: Date
}
```

#### Deployment
```typescript
interface Deployment {
  id: string
  modelId: string
  version: string
  environment: 'development' | 'staging' | 'production'
  status: 'deploying' | 'active' | 'failed' | 'stopped'
  endpoint: string
  replicas: number
  resources: {
    cpu: string
    memory: string
    gpu?: string
  }
  requestCount: number
  avgLatency: number
  deployedBy: string
  deployedAt: Date
  updatedAt: Date
}
```

---

### 8. Data Governance

#### DataAsset
```typescript
interface DataAsset {
  id: string
  name: string
  type: 'table' | 'dataset' | 'view' | 'file'
  description: string
  owner: string
  database: string
  schema: string
  tags: string[]
  sensitivity: 'high' | 'medium' | 'low'
  classification: string[]       // PII, financial, public, etc.
  rowCount: number
  size: number
  lastModified: Date
  lineage: LineageNode[]
  qualityScore: number
  createdAt: Date
  updatedAt: Date
}
```

#### Policy
```typescript
interface Policy {
  id: string
  name: string
  description: string
  type: 'access' | 'retention' | 'masking' | 'quality'
  rules: PolicyRule[]
  enabled: boolean
  appliedTo: string[]           // Asset IDs
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

interface PolicyRule {
  id: string
  condition: string
  action: string
  priority: number
}
```

#### Lineage
```typescript
interface LineageNode {
  assetId: string
  type: 'source' | 'transformation' | 'destination'
  upstream: string[]
  downstream: string[]
  transformations: string[]
  timestamp: Date
}
```

#### AccessControl
```typescript
interface AccessControl {
  id: string
  assetId: string
  userId: string
  role: 'owner' | 'editor' | 'viewer'
  permissions: string[]
  grantedBy: string
  grantedAt: Date
  expiresAt: Date | null
}
```

---

### 9. Monitoring

#### SystemHealth
```typescript
interface SystemHealth {
  id: string
  component: string
  status: 'healthy' | 'degraded' | 'down'
  cpu: number
  memory: number
  disk: number
  network: number
  timestamp: Date
}
```

#### PipelineRun
```typescript
interface PipelineRun {
  id: string
  pipelineId: string
  status: 'running' | 'success' | 'failed' | 'cancelled'
  startTime: Date
  endTime: Date | null
  duration: number | null
  recordsProcessed: number
  bytesProcessed: number
  errors: ErrorLog[]
  metrics: Record<string, any>
  triggeredBy: string
  createdAt: Date
}

interface ErrorLog {
  timestamp: Date
  level: 'error' | 'warning' | 'info'
  message: string
  stackTrace?: string
  context: Record<string, any>
}
```

#### Log
```typescript
interface Log {
  id: string
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical'
  service: string
  message: string
  timestamp: Date
  userId?: string
  metadata: Record<string, any>
}
```

---

### 10. User Management

#### User
```typescript
interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  avatar?: string
  role: 'admin' | 'developer' | 'analyst' | 'viewer'
  status: 'active' | 'inactive' | 'suspended'
  preferences: UserPreferences
  lastLogin: Date
  createdAt: Date
  updatedAt: Date
}

interface UserPreferences {
  theme: 'light' | 'dark'
  notifications: {
    email: boolean
    slack: boolean
    inApp: boolean
  }
  timezone: string
  language: string
}
```

#### ApiKey
```typescript
interface ApiKey {
  id: string
  name: string
  key: string                   // Hashed
  userId: string
  permissions: string[]
  lastUsed: Date | null
  expiresAt: Date | null
  createdAt: Date
}
```

#### Session
```typescript
interface Session {
  id: string
  userId: string
  token: string                 // JWT
  expiresAt: Date
  ipAddress: string
  userAgent: string
  createdAt: Date
}
```

---

## API Endpoints

### Authentication & Users

```
POST   /api/auth/register           - Register new user
POST   /api/auth/login              - Login user
POST   /api/auth/logout             - Logout user
POST   /api/auth/refresh            - Refresh access token
POST   /api/auth/forgot-password    - Request password reset
POST   /api/auth/reset-password     - Reset password

GET    /api/users                   - List users
GET    /api/users/:id               - Get user details
PUT    /api/users/:id               - Update user
DELETE /api/users/:id               - Delete user
GET    /api/users/:id/preferences   - Get user preferences
PUT    /api/users/:id/preferences   - Update preferences

GET    /api/api-keys                - List API keys
POST   /api/api-keys                - Create API key
DELETE /api/api-keys/:id            - Delete API key
```

### Data Integration

```
GET    /api/pipelines               - List pipelines
POST   /api/pipelines               - Create pipeline
GET    /api/pipelines/:id           - Get pipeline details
PUT    /api/pipelines/:id           - Update pipeline
DELETE /api/pipelines/:id           - Delete pipeline
POST   /api/pipelines/:id/run       - Trigger pipeline run
POST   /api/pipelines/:id/pause     - Pause pipeline
POST   /api/pipelines/:id/resume    - Resume pipeline
GET    /api/pipelines/:id/runs      - Get pipeline run history

GET    /api/connections             - List connections
POST   /api/connections             - Create connection
GET    /api/connections/:id         - Get connection
PUT    /api/connections/:id         - Update connection
DELETE /api/connections/:id         - Delete connection
POST   /api/connections/:id/test    - Test connection

GET    /api/data-sources            - List data sources
POST   /api/data-sources            - Create data source
GET    /api/data-sources/:id        - Get data source
PUT    /api/data-sources/:id        - Update data source
DELETE /api/data-sources/:id        - Delete data source

GET    /api/schedules               - List schedules
POST   /api/schedules               - Create schedule
GET    /api/schedules/:id           - Get schedule
PUT    /api/schedules/:id           - Update schedule
DELETE /api/schedules/:id           - Delete schedule
```

### Data Transformation

```
GET    /api/notebooks               - List notebooks
POST   /api/notebooks               - Create notebook
GET    /api/notebooks/:id           - Get notebook
PUT    /api/notebooks/:id           - Update notebook
DELETE /api/notebooks/:id           - Delete notebook
POST   /api/notebooks/:id/run       - Execute notebook
POST   /api/notebooks/:id/stop      - Stop execution

GET    /api/workflows               - List workflows
POST   /api/workflows               - Create workflow
GET    /api/workflows/:id           - Get workflow
PUT    /api/workflows/:id           - Update workflow
DELETE /api/workflows/:id           - Delete workflow
POST   /api/workflows/:id/run       - Execute workflow

GET    /api/jobs                    - List jobs
GET    /api/jobs/:id                - Get job details
GET    /api/jobs/:id/logs           - Get job logs
POST   /api/jobs/:id/cancel         - Cancel job
```

### Data Lake

```
GET    /api/files                   - List files
POST   /api/files                   - Upload file
GET    /api/files/:id               - Get file metadata
DELETE /api/files/:id               - Delete file
GET    /api/files/:id/download      - Download file

GET    /api/schemas                 - List schemas
POST   /api/schemas                 - Create schema
GET    /api/schemas/:id             - Get schema
PUT    /api/schemas/:id             - Update schema
DELETE /api/schemas/:id             - Delete schema

GET    /api/storage                 - List storage configs
POST   /api/storage                 - Create storage config
GET    /api/storage/:id             - Get storage config
PUT    /api/storage/:id             - Update storage config
DELETE /api/storage/:id             - Delete storage config
GET    /api/storage/:id/stats       - Get storage statistics
```

### Data Warehouse

```
GET    /api/tables                  - List tables
GET    /api/tables/:id              - Get table details
GET    /api/tables/:id/preview      - Preview table data
GET    /api/tables/:id/schema       - Get table schema
GET    /api/tables/:id/stats        - Get table statistics

POST   /api/queries                 - Execute query
GET    /api/queries/:id             - Get query results
POST   /api/queries/:id/cancel      - Cancel query
POST   /api/queries/:id/save        - Save query
GET    /api/queries/history         - Get query history
POST   /api/queries/:id/export      - Export results (CSV/JSON)

GET    /api/views                   - List views
POST   /api/views                   - Create view
GET    /api/views/:id               - Get view
PUT    /api/views/:id               - Update view
DELETE /api/views/:id               - Delete view
```

### Real-Time Analytics

```
GET    /api/streaming-jobs          - List streaming jobs
POST   /api/streaming-jobs          - Create streaming job
GET    /api/streaming-jobs/:id      - Get job details
PUT    /api/streaming-jobs/:id      - Update job
DELETE /api/streaming-jobs/:id      - Delete job
POST   /api/streaming-jobs/:id/start - Start job
POST   /api/streaming-jobs/:id/pause - Pause job
GET    /api/streaming-jobs/:id/metrics - Get job metrics

GET    /api/events                  - List events (with filtering)
POST   /api/events                  - Create event
GET    /api/events/:id              - Get event details
WS     /api/events/stream           - WebSocket event stream

GET    /api/alerts                  - List alerts
POST   /api/alerts                  - Create alert
GET    /api/alerts/:id              - Get alert
PUT    /api/alerts/:id              - Update alert
DELETE /api/alerts/:id              - Delete alert
POST   /api/alerts/:id/enable       - Enable alert
POST   /api/alerts/:id/disable      - Disable alert
GET    /api/alerts/:id/history      - Get alert history

GET    /api/dashboards              - List dashboards
POST   /api/dashboards              - Create dashboard
GET    /api/dashboards/:id          - Get dashboard
PUT    /api/dashboards/:id          - Update dashboard
DELETE /api/dashboards/:id          - Delete dashboard
POST   /api/dashboards/:id/share    - Share dashboard
WS     /api/dashboards/:id/live     - Live dashboard updates
```

### Data Analytics

```
GET    /api/reports                 - List reports
POST   /api/reports                 - Create report
GET    /api/reports/:id             - Get report
PUT    /api/reports/:id             - Update report
DELETE /api/reports/:id             - Delete report
POST   /api/reports/:id/generate    - Generate report
POST   /api/reports/:id/schedule    - Schedule report

GET    /api/workbooks               - List workbooks
POST   /api/workbooks               - Create workbook
GET    /api/workbooks/:id           - Get workbook
PUT    /api/workbooks/:id           - Update workbook
DELETE /api/workbooks/:id           - Delete workbook
POST   /api/workbooks/:id/share     - Share workbook
```

### Data Science

```
GET    /api/models                  - List models
POST   /api/models                  - Create model
GET    /api/models/:id              - Get model
PUT    /api/models/:id              - Update model
DELETE /api/models/:id              - Delete model
POST   /api/models/:id/deploy       - Deploy model
POST   /api/models/:id/undeploy     - Undeploy model
GET    /api/models/:id/download     - Download model artifact
POST   /api/models/:id/predict      - Model inference endpoint

GET    /api/experiments             - List experiments
POST   /api/experiments             - Create experiment
GET    /api/experiments/:id         - Get experiment
PUT    /api/experiments/:id         - Update experiment
DELETE /api/experiments/:id         - Delete experiment
GET    /api/experiments/:id/metrics - Get experiment metrics

GET    /api/deployments             - List deployments
GET    /api/deployments/:id         - Get deployment
PUT    /api/deployments/:id/scale   - Scale deployment
DELETE /api/deployments/:id         - Delete deployment
GET    /api/deployments/:id/logs    - Get deployment logs
GET    /api/deployments/:id/metrics - Get deployment metrics
```

### Data Governance

```
GET    /api/catalog                 - List data assets
POST   /api/catalog                 - Create data asset
GET    /api/catalog/:id             - Get asset details
PUT    /api/catalog/:id             - Update asset
DELETE /api/catalog/:id             - Delete asset
GET    /api/catalog/:id/lineage     - Get asset lineage
PUT    /api/catalog/:id/tags        - Update asset tags
GET    /api/catalog/search          - Search catalog

GET    /api/policies                - List policies
POST   /api/policies                - Create policy
GET    /api/policies/:id            - Get policy
PUT    /api/policies/:id            - Update policy
DELETE /api/policies/:id            - Delete policy
POST   /api/policies/:id/apply      - Apply policy

GET    /api/access-controls         - List access controls
POST   /api/access-controls         - Grant access
PUT    /api/access-controls/:id     - Update access
DELETE /api/access-controls/:id     - Revoke access
```

### Monitoring

```
GET    /api/monitoring/health       - Get system health
GET    /api/monitoring/metrics      - Get system metrics
GET    /api/monitoring/services     - List service statuses

GET    /api/monitoring/pipelines    - List pipeline runs
GET    /api/monitoring/pipelines/:id - Get pipeline run details
GET    /api/monitoring/pipelines/:id/logs - Get run logs

GET    /api/logs                    - List logs (with filtering)
GET    /api/logs/:id                - Get log details
POST   /api/logs/export             - Export logs
```

### Settings & Configuration

```
GET    /api/settings                - Get all settings
GET    /api/settings/:key           - Get setting value
PUT    /api/settings/:key           - Update setting value

GET    /api/integrations            - List integrations
POST   /api/integrations            - Create integration
GET    /api/integrations/:id        - Get integration
PUT    /api/integrations/:id        - Update integration
DELETE /api/integrations/:id        - Delete integration
POST   /api/integrations/:id/test   - Test integration

GET    /api/notifications           - List notifications
PUT    /api/notifications/:id/read  - Mark as read
DELETE /api/notifications/:id       - Delete notification
PUT    /api/notifications/read-all  - Mark all as read
```

---

## Authentication & Authorization

### JWT Authentication

```typescript
// JWT Payload
interface JWTPayload {
  userId: string
  email: string
  role: string
  permissions: string[]
  iat: number               // Issued at
  exp: number               // Expiration
}

// Token Structure
{
  accessToken: string,      // Short-lived (15 minutes)
  refreshToken: string      // Long-lived (7 days)
}
```

### Authorization Middleware

```typescript
// Role-based access control
const roles = {
  admin: ['*'],             // All permissions
  developer: [
    'pipelines:*',
    'notebooks:*',
    'workflows:*',
    'queries:*',
    'models:*'
  ],
  analyst: [
    'queries:read',
    'queries:write',
    'dashboards:*',
    'reports:*'
  ],
  viewer: [
    'pipelines:read',
    'dashboards:read',
    'reports:read',
    'queries:read'
  ]
}
```

### API Key Authentication

```
Authorization: Bearer <api_key>
```

---

## Real-Time Features

### WebSocket Events

```typescript
// Connection
const socket = io('ws://api.conveyor.com')

// Events to emit
socket.emit('subscribe:dashboard', { dashboardId: 'abc123' })
socket.emit('subscribe:pipeline', { pipelineId: 'xyz789' })
socket.emit('subscribe:events', { filters: { severity: 'critical' } })

// Events to listen
socket.on('dashboard:update', (data) => {})
socket.on('pipeline:status', (data) => {})
socket.on('event:new', (data) => {})
socket.on('alert:triggered', (data) => {})
```

### Server-Sent Events (SSE)

```typescript
// For live dashboards and monitoring
GET /api/dashboards/:id/live
GET /api/monitoring/metrics/stream
GET /api/events/stream
```

---

## Database Schema

### PostgreSQL Schema

```sql
-- Users & Auth
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar TEXT,
  role VARCHAR(50) DEFAULT 'viewer',
  status VARCHAR(50) DEFAULT 'active',
  preferences JSONB DEFAULT '{}',
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '[]',
  last_used TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data Integration
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  host VARCHAR(255),
  port INTEGER,
  database VARCHAR(255),
  username VARCHAR(255),
  password_encrypted TEXT,
  ssl BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'inactive',
  last_tested TIMESTAMP,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'idle',
  source_connection_id UUID REFERENCES connections(id),
  destination_connection_id UUID REFERENCES connections(id),
  schedule VARCHAR(255),
  last_run TIMESTAMP,
  next_run TIMESTAMP,
  run_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  records_processed BIGINT DEFAULT 0,
  config JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration INTEGER,
  records_processed BIGINT DEFAULT 0,
  bytes_processed BIGINT DEFAULT 0,
  errors JSONB DEFAULT '[]',
  metrics JSONB DEFAULT '{}',
  triggered_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data Warehouse
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  database VARCHAR(255) NOT NULL,
  schema VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'table',
  columns JSONB NOT NULL,
  row_count BIGINT DEFAULT 0,
  size BIGINT DEFAULT 0,
  partitioned BOOLEAN DEFAULT false,
  partition_key VARCHAR(255),
  indexes JSONB DEFAULT '[]',
  description TEXT,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(database, schema, name)
);

CREATE TABLE queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  sql TEXT NOT NULL,
  database VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  execution_time INTEGER,
  rows_returned BIGINT,
  bytes_scanned BIGINT,
  error TEXT,
  user_id UUID REFERENCES users(id),
  saved_query BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Real-Time Analytics
CREATE TABLE streaming_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  source VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'stopped',
  throughput DECIMAL(12,2) DEFAULT 0,
  records_processed BIGINT DEFAULT 0,
  latency INTEGER DEFAULT 0,
  error_rate DECIMAL(5,2) DEFAULT 0,
  uptime DECIMAL(5,2) DEFAULT 0,
  config JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  condition TEXT NOT NULL,
  metric VARCHAR(255) NOT NULL,
  threshold DECIMAL(12,2) NOT NULL,
  operator VARCHAR(10) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  enabled BOOLEAN DEFAULT true,
  last_triggered TIMESTAMP,
  trigger_count INTEGER DEFAULT 0,
  actions JSONB DEFAULT '[]',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data Science
CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  framework VARCHAR(50) NOT NULL,
  version VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'ready',
  accuracy DECIMAL(5,2),
  metrics JSONB DEFAULT '{}',
  artifact_path TEXT,
  last_trained TIMESTAMP,
  trained_by UUID REFERENCES users(id),
  deployment_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data Governance
CREATE TABLE data_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id),
  database VARCHAR(255),
  schema VARCHAR(255),
  tags TEXT[],
  sensitivity VARCHAR(50) DEFAULT 'low',
  classification TEXT[],
  row_count BIGINT,
  size BIGINT,
  last_modified TIMESTAMP,
  lineage JSONB DEFAULT '[]',
  quality_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  rules JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  applied_to UUID[],
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_pipelines_status ON pipelines(status);
CREATE INDEX idx_pipelines_created_by ON pipelines(created_by);
CREATE INDEX idx_queries_user_id ON queries(user_id);
CREATE INDEX idx_queries_created_at ON queries(created_at);
CREATE INDEX idx_pipeline_runs_pipeline_id ON pipeline_runs(pipeline_id);
CREATE INDEX idx_streaming_jobs_status ON streaming_jobs(status);
CREATE INDEX idx_models_status ON models(status);
CREATE INDEX idx_data_assets_type ON data_assets(type);
CREATE INDEX idx_data_assets_owner_id ON data_assets(owner_id);
```

### TimescaleDB for Time-Series Data

```sql
-- Metrics (extends PostgreSQL)
CREATE TABLE metrics (
  time TIMESTAMPTZ NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  tags JSONB,
  entity_id UUID,
  entity_type VARCHAR(50)
);

SELECT create_hypertable('metrics', 'time');

CREATE INDEX idx_metrics_name_time ON metrics(metric_name, time DESC);
CREATE INDEX idx_metrics_tags ON metrics USING GIN(tags);

-- Events (for real-time analytics)
CREATE TABLE events (
  time TIMESTAMPTZ NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  source VARCHAR(255) NOT NULL,
  severity VARCHAR(50),
  message TEXT,
  data JSONB,
  user_id UUID,
  processed BOOLEAN DEFAULT false
);

SELECT create_hypertable('events', 'time');

CREATE INDEX idx_events_type_time ON events(event_type, time DESC);
CREATE INDEX idx_events_severity ON events(severity);
```

---

## Message Queues & Event Streaming

### Kafka Topics

```yaml
topics:
  # Pipeline orchestration
  - pipeline.runs
  - pipeline.status
  - pipeline.errors

  # Data streaming
  - data.events
  - data.changes

  # Real-time analytics
  - analytics.events
  - analytics.metrics

  # Alerts & notifications
  - alerts.triggered
  - notifications.queue

  # Job execution
  - jobs.queue
  - jobs.results

  # Audit logs
  - audit.logs
```

### RabbitMQ Queues

```yaml
queues:
  # Background jobs
  - name: notebook_execution
    durable: true
    priority: 10

  - name: query_execution
    durable: true
    priority: 5

  - name: model_training
    durable: true
    priority: 3

  - name: report_generation
    durable: true
    priority: 2

  # Email notifications
  - name: email_queue
    durable: true
    priority: 8

  # Webhooks
  - name: webhook_queue
    durable: true
    priority: 7
```

---

## File Storage

### MinIO/S3 Bucket Structure

```
conveyor-storage/
├── data-lake/
│   ├── raw/
│   │   ├── customers/
│   │   ├── orders/
│   │   └── events/
│   ├── processed/
│   │   ├── customers/
│   │   ├── orders/
│   │   └── events/
│   └── archive/
├── notebooks/
│   ├── user-{id}/
│   └── shared/
├── models/
│   ├── artifacts/
│   ├── checkpoints/
│   └── deployments/
├── reports/
│   ├── scheduled/
│   └── ad-hoc/
├── exports/
│   ├── queries/
│   └── dashboards/
└── uploads/
    └── temp/
```

---

## Monitoring & Observability

### Metrics to Track

```yaml
system:
  - cpu_usage
  - memory_usage
  - disk_usage
  - network_io
  - api_request_rate
  - api_latency
  - error_rate

pipelines:
  - pipeline_runs_total
  - pipeline_success_rate
  - pipeline_duration
  - records_processed
  - bytes_processed

queries:
  - query_execution_time
  - queries_per_second
  - query_cache_hit_rate
  - concurrent_queries

streaming:
  - throughput
  - latency
  - backlog_size
  - consumer_lag

models:
  - prediction_latency
  - prediction_throughput
  - model_accuracy
  - deployment_health
```

### Health Check Endpoints

```
GET /health           - Overall health
GET /health/db        - Database connectivity
GET /health/redis     - Redis connectivity
GET /health/kafka     - Kafka connectivity
GET /health/storage   - Storage connectivity
GET /health/services  - Microservices status
```

---

## Environment Variables

```bash
# Application
NODE_ENV=production
PORT=3001
API_URL=http://localhost:3001

# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=conveyor
POSTGRES_USER=conveyor
POSTGRES_PASSWORD=secure_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Kafka
KAFKA_BROKERS=kafka:9092
KAFKA_GROUP_ID=conveyor-api

# S3/MinIO
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=conveyor-storage
S3_REGION=us-east-1

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# External Services
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

SLACK_WEBHOOK_URL=
SLACK_BOT_TOKEN=

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000

# Feature Flags
ENABLE_REAL_TIME=true
ENABLE_ML_FEATURES=true
ENABLE_GOVERNANCE=true
```

---

## API Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2024-12-19T10:30:00Z",
    "requestId": "abc123",
    "version": "1.0"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "PIPELINE_NOT_FOUND",
    "message": "Pipeline with ID 'xyz' not found",
    "details": { ... }
  },
  "metadata": {
    "timestamp": "2024-12-19T10:30:00Z",
    "requestId": "abc123"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  },
  "metadata": {
    "timestamp": "2024-12-19T10:30:00Z"
  }
}
```

---

## Rate Limiting

```yaml
limits:
  - endpoint: /api/auth/*
    limit: 5
    window: 15m

  - endpoint: /api/queries
    limit: 100
    window: 1h

  - endpoint: /api/*
    limit: 1000
    window: 1h
```

---

## Security Considerations

1. **Input Validation**: Validate all inputs using Zod/Joi
2. **SQL Injection**: Use parameterized queries
3. **XSS Protection**: Sanitize outputs
4. **CORS**: Configure allowed origins
5. **Encryption**: Encrypt sensitive data at rest (passwords, API keys)
6. **HTTPS**: Use TLS in production
7. **Audit Logs**: Log all sensitive operations
8. **Rate Limiting**: Prevent abuse
9. **API Keys**: Hash and store securely
10. **Secrets Management**: Use environment variables or vault

---

## Testing Strategy

```yaml
unit_tests:
  - Data models validation
  - Business logic
  - Utility functions

integration_tests:
  - API endpoints
  - Database operations
  - External service integrations

e2e_tests:
  - Complete workflows
  - Pipeline execution
  - Query execution

performance_tests:
  - Load testing
  - Stress testing
  - Endurance testing
```

---

This specification provides a comprehensive foundation for building the backend. Adjust based on your specific requirements and scale.
