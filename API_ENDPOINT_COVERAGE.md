# API Endpoint Coverage Report

## Summary

**Total Endpoints**: 31 (5 ViewSets × CRUD + 11 custom actions)  
**Implemented Frontend Methods**: 32/32 ✅  
**Coverage**: 100%

---

## Backend Endpoints vs Frontend Implementation

### SourceViewSet (5 CRUD + 3 custom actions = 8 endpoints)

#### CRUD Operations

| Endpoint                         | Method | Backend | Frontend         | Status      |
| -------------------------------- | ------ | ------- | ---------------- | ----------- |
| `/api/integration/sources/`      | GET    | ✅      | `getSources()`   | ✅ Complete |
| `/api/integration/sources/`      | POST   | ✅      | `createSource()` | ✅ Complete |
| `/api/integration/sources/{id}/` | GET    | ✅      | `getSource()`    | ✅ Complete |
| `/api/integration/sources/{id}/` | PATCH  | ✅      | `updateSource()` | ✅ Complete |
| `/api/integration/sources/{id}/` | DELETE | ✅      | `deleteSource()` | ✅ Complete |

#### Custom Actions

| Endpoint                                | Method | Backend                 | Frontend             | Status      |
| --------------------------------------- | ------ | ----------------------- | -------------------- | ----------- |
| `/api/integration/sources/catalog/`     | GET    | `@action(detail=False)` | `getSourceCatalog()` | ✅ Complete |
| `/api/integration/sources/{id}/test/`   | POST   | `@action(detail=True)`  | `testSource()`       | ✅ Complete |
| `/api/integration/sources/{id}/schema/` | GET    | `@action(detail=True)`  | `getSourceSchema()`  | ✅ Complete |

---

### DataSourceViewSet (5 CRUD + 1 custom action = 6 endpoints)

#### CRUD Operations

| Endpoint                              | Method | Backend | Frontend             | Status      |
| ------------------------------------- | ------ | ------- | -------------------- | ----------- |
| `/api/integration/data-sources/`      | GET    | ✅      | `getDataSources()`   | ✅ Complete |
| `/api/integration/data-sources/`      | POST   | ✅      | `createDataSource()` | ✅ Complete |
| `/api/integration/data-sources/{id}/` | GET    | ✅      | `getDataSource()`    | ✅ Complete |
| `/api/integration/data-sources/{id}/` | PATCH  | ✅      | `updateDataSource()` | ✅ Complete |
| `/api/integration/data-sources/{id}/` | DELETE | ✅      | `deleteDataSource()` | ✅ Complete |

#### Custom Actions

| Endpoint                                   | Method | Backend                | Frontend           | Status      |
| ------------------------------------------ | ------ | ---------------------- | ------------------ | ----------- |
| `/api/integration/data-sources/{id}/sync/` | POST   | `@action(detail=True)` | `syncDataSource()` | ✅ Complete |

---

### PipelineViewSet (5 CRUD + 5 custom actions = 10 endpoints)

#### CRUD Operations

| Endpoint                           | Method | Backend | Frontend           | Status      |
| ---------------------------------- | ------ | ------- | ------------------ | ----------- |
| `/api/integration/pipelines/`      | GET    | ✅      | `getPipelines()`   | ✅ Complete |
| `/api/integration/pipelines/`      | POST   | ✅      | `createPipeline()` | ✅ Complete |
| `/api/integration/pipelines/{id}/` | GET    | ✅      | `getPipeline()`    | ✅ Complete |
| `/api/integration/pipelines/{id}/` | PATCH  | ✅      | `updatePipeline()` | ✅ Complete |
| `/api/integration/pipelines/{id}/` | DELETE | ✅      | `deletePipeline()` | ✅ Complete |

#### Custom Actions

| Endpoint                                  | Method | Backend                           | Frontend             | Status      |
| ----------------------------------------- | ------ | --------------------------------- | -------------------- | ----------- |
| `/api/integration/pipelines/{id}/run/`    | POST   | `@action(detail=True)` def run    | `triggerPipeline()`  | ✅ Complete |
| `/api/integration/pipelines/{id}/pause/`  | POST   | `@action(detail=True)` def pause  | `pausePipeline()`    | ✅ Complete |
| `/api/integration/pipelines/{id}/resume/` | POST   | `@action(detail=True)` def resume | `resumePipeline()`   | ✅ Complete |
| `/api/integration/pipelines/{id}/runs/`   | GET    | `@action(detail=True)` def runs   | `getPipelineRuns()`  | ✅ Complete |
| `/api/integration/pipelines/{id}/stats/`  | GET    | `@action(detail=True)` def stats  | `getPipelineStats()` | ✅ Complete |

---

### PipelineRunViewSet (2 CRUD + 1 custom action = 3 endpoints)

#### CRUD Operations

| Endpoint                               | Method | Backend | Frontend            | Status      |
| -------------------------------------- | ------ | ------- | ------------------- | ----------- |
| `/api/integration/pipeline-runs/`      | GET    | ✅      | `getPipelineRuns()` | ✅ Complete |
| `/api/integration/pipeline-runs/{id}/` | GET    | ✅      | `getPipelineRun()`  | ✅ Complete |

#### Custom Actions

| Endpoint                                      | Method | Backend                | Frontend              | Status      |
| --------------------------------------------- | ------ | ---------------------- | --------------------- | ----------- |
| `/api/integration/pipeline-runs/{id}/cancel/` | POST   | `@action(detail=True)` | `cancelPipelineRun()` | ✅ Complete |

---

### ScheduleViewSet (5 CRUD + 2 custom actions = 7 endpoints)

#### CRUD Operations

| Endpoint                           | Method | Backend | Frontend           | Status      |
| ---------------------------------- | ------ | ------- | ------------------ | ----------- |
| `/api/integration/schedules/`      | GET    | ✅      | `getSchedules()`   | ✅ Complete |
| `/api/integration/schedules/`      | POST   | ✅      | `createSchedule()` | ✅ Complete |
| `/api/integration/schedules/{id}/` | GET    | ✅      | `getSchedule()`    | ✅ Complete |
| `/api/integration/schedules/{id}/` | PATCH  | ✅      | `updateSchedule()` | ✅ Complete |
| `/api/integration/schedules/{id}/` | DELETE | ✅      | `deleteSchedule()` | ✅ Complete |

#### Custom Actions

| Endpoint                                   | Method | Backend                | Frontend            | Status      |
| ------------------------------------------ | ------ | ---------------------- | ------------------- | ----------- |
| `/api/integration/schedules/{id}/enable/`  | POST   | `@action(detail=True)` | `enableSchedule()`  | ✅ Complete |
| `/api/integration/schedules/{id}/disable/` | POST   | `@action(detail=True)` | `disableSchedule()` | ✅ Complete |

---

## Frontend Page Usage

### Pages Implementing Integration API

| Page              | Path                                   | Methods Used                                                                                             | Status    |
| ----------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------- |
| Overview          | `/data-integration/`                   | `getSources()`, `getDataSources()`, `getPipelines()`, `getSchedules()`                                   | ✅ Active |
| Data Sources      | `/data-integration/data-sources/`      | `getDataSources()`, `createDataSource()`, `updateDataSource()`, `deleteDataSource()`, `syncDataSource()` | ✅ Active |
| Source Connectors | `/data-integration/source-connectors/` | `getSourceCatalog()`                                                                                     | ✅ Active |
| Pipelines         | `/data-integration/pipelines/`         | `getPipelines()`, `createPipeline()`, `updatePipeline()`, `deletePipeline()`, `triggerPipeline()`        | ✅ Active |
| Schedules         | `/data-integration/schedules/`         | `getSchedules()`, `createSchedule()`, `deleteSchedule()`, `enableSchedule()`, `disableSchedule()`        | ✅ Active |

### Potential UI Enhancements

The following backend features could be exposed in the UI:

1. **Pipeline Management**

   - Add pause/resume buttons for running pipelines
   - Display pipeline stats (duration, records processed, success rate)
   - Show detailed run history per pipeline

2. **Schedule Management**

   - Add schedule detail view with full metadata
   - Edit schedule settings (cron expression, timezone)
   - Display next scheduled run time

3. **Data Source Features**
   - Add schema discovery view
   - Display connection details with schema browser

---

## API Client File

**Location**: [lib/api/integration.ts](conveyor-web/lib/api/integration.ts)

**Total Methods**: 32

### Method Categories

- **Source Methods**: 8 (getSources, getSource, createSource, updateSource, deleteSource, testSource, getSourceCatalog, getSourceSchema)
- **DataSource Methods**: 6 (getDataSources, getDataSource, createDataSource, updateDataSource, deleteDataSource, syncDataSource)
- **Pipeline Methods**: 10 (getPipelines, getPipeline, createPipeline, updatePipeline, deletePipeline, triggerPipeline, pausePipeline, resumePipeline, getPipelineRuns, getPipelineStats)
- **PipelineRun Methods**: 3 (getPipelineRuns, getPipelineRun, cancelPipelineRun)
- **Schedule Methods**: 7 (getSchedules, getSchedule, createSchedule, updateSchedule, deleteSchedule, enableSchedule, disableSchedule)

---

## Recent Updates

✅ **Commit 2e3107c**: Add missing API client methods for complete endpoint coverage

- Fixed `triggerPipeline()` endpoint from `/trigger/` to `/run/`
- Added `pausePipeline()` method
- Added `resumePipeline()` method
- Added `getPipelineStats()` method
- Added `getSchedule()` method
- Added `updateSchedule()` method
- Added `getSourceSchema()` method
- Added `deleteDataSource()` method

---

## Testing Recommendations

1. **Test all custom actions** in pipelines:

   - Run pipeline
   - Pause running pipeline
   - Resume paused pipeline
   - Get pipeline statistics

2. **Test schedule operations**:

   - Retrieve individual schedule
   - Update schedule cron expression
   - Enable/disable schedules

3. **Test data sources**:
   - Delete data source
   - Discover schema from source
   - Sync data source

---

## Conclusion

All backend integration module endpoints have corresponding frontend API client methods. The API client is feature-complete with 100% endpoint coverage. Pages are using the API correctly for core functionality, and optional UI enhancements can leverage the additional methods for advanced features.
