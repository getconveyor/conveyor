# API Method Usage Analysis

## Summary

**Total Methods Defined**: 32  
**Methods Used in Pages**: 20  
**Methods NOT Used**: 12  
**Usage Rate**: 62.5%

---

## Methods Used in Pages ✅

### Data Sources Page (`data-sources/page.tsx`)

| Method               | Used    | Location | Purpose                              |
| -------------------- | ------- | -------- | ------------------------------------ |
| `getSources()`       | ✅      | Line 183 | Load list of sources                 |
| `getSource()`        | ✅      | Line 244 | Load full source details for editing |
| `getSourceCatalog()` | ✅      | Line 170 | Get available source types           |
| `createSource()`     | ✅      | Line 319 | Create new source                    |
| `updateSource()`     | ✅      | Line 303 | Edit existing source                 |
| `deleteSource()`     | ✅      | Line 350 | Delete source                        |
| `testSource()`       | ✅      | Line 368 | Test source connection               |
| **Subtotal**         | **7/8** |          |                                      |

### Source Connectors Page (`source-connectors/page.tsx`)

| Method               | Used    | Location | Purpose                       |
| -------------------- | ------- | -------- | ----------------------------- |
| `getSourceCatalog()` | ✅      | Line 65  | Browse available source types |
| `getSources()`       | ✅      | Line 79  | List created sources          |
| **Subtotal**         | **2/8** |          |                               |

### Pipelines Page (`pipelines/page.tsx`)

| Method             | Used     | Location      | Purpose                            |
| ------------------ | -------- | ------------- | ---------------------------------- |
| `getPipelines()`   | ✅       | Line 120      | Load list of pipelines             |
| `getSources()`     | ✅       | Line 134      | Load sources for pipeline creation |
| `createPipeline()` | ✅       | Line 167      | Create new pipeline                |
| `updatePipeline()` | ✅       | Line 152, 229 | Edit pipeline & update status      |
| `deletePipeline()` | ✅       | Line 202      | Delete pipeline                    |
| **Subtotal**       | **5/10** |               |                                    |

### Schedules Page (`schedules/page.tsx`)

| Method              | Used    | Location | Purpose                              |
| ------------------- | ------- | -------- | ------------------------------------ |
| `getSchedules()`    | ✅      | Line 109 | Load list of schedules               |
| `getPipelines()`    | ✅      | Line 123 | Load pipelines for schedule creation |
| `createSchedule()`  | ✅      | Line 144 | Create new schedule                  |
| `deleteSchedule()`  | ✅      | Line 182 | Delete schedule                      |
| `enableSchedule()`  | ✅      | Line 206 | Enable disabled schedule             |
| `disableSchedule()` | ✅      | Line 202 | Disable enabled schedule             |
| **Subtotal**        | **6/7** |          |                                      |

### Dashboard Page (`page.tsx`)

| Method             | Used    | Location | Purpose                |
| ------------------ | ------- | -------- | ---------------------- |
| `getPipelines()`   | ✅      | Line 34  | Load pipeline stats    |
| `getDataSources()` | ✅      | Line 35  | Load data source stats |
| **Subtotal**       | **2/6** |          |                        |

---

## Methods NOT Used ❌

| Method                | Category    | Reason                                                   | Potential Use Case                        |
| --------------------- | ----------- | -------------------------------------------------------- | ----------------------------------------- |
| `getDataSources()`    | DataSource  | Only used in dashboard; pages use `getSources()` instead | Show synced data tables per source        |
| `getDataSource()`     | DataSource  | Not used                                                 | View individual data source details       |
| `syncDataSource()`    | DataSource  | Not used                                                 | Trigger data sync from UI                 |
| `createDataSource()`  | DataSource  | Not used                                                 | Create new data source mapping            |
| `updateDataSource()`  | DataSource  | Not used                                                 | Edit data source configuration            |
| `deleteDataSource()`  | DataSource  | Not used                                                 | Delete data source                        |
| `triggerPipeline()`   | Pipeline    | Not used (yet)                                           | Run pipeline manually from UI             |
| `pausePipeline()`     | Pipeline    | Not used                                                 | Pause running pipeline                    |
| `resumePipeline()`    | Pipeline    | Not used                                                 | Resume paused pipeline                    |
| `getPipelineStats()`  | Pipeline    | Not used                                                 | Display pipeline performance metrics      |
| `getSourceSchema()`   | Source      | Not used                                                 | Show source database/table schema         |
| `getSchedule()`       | Schedule    | Not used                                                 | View individual schedule details          |
| `updateSchedule()`    | Schedule    | Not used                                                 | Edit schedule (cron expression, timezone) |
| `getPipelineRuns()`   | PipelineRun | Not used                                                 | Show pipeline run history                 |
| `getPipelineRun()`    | PipelineRun | Not used                                                 | View individual run details               |
| `cancelPipelineRun()` | PipelineRun | Not used                                                 | Cancel in-progress pipeline run           |

**Total Unused**: 15 methods

---

## Usage by Resource Type

### Source Methods (8 total)

- Used: 7/8 (87.5%)
- Unused: `getSourceSchema()`

### DataSource Methods (6 total)

- Used: 1/6 (16.7%) - only in dashboard
- Unused: 5 methods (no dedicated DataSource page)

### Pipeline Methods (10 total)

- Used: 5/10 (50%)
- Unused: `triggerPipeline()`, `pausePipeline()`, `resumePipeline()`, `getPipelineStats()`

### PipelineRun Methods (3 total)

- Used: 0/3 (0%)
- No dedicated page for pipeline runs

### Schedule Methods (7 total)

- Used: 6/7 (85.7%)
- Unused: `getSchedule()`, `updateSchedule()` (note: updates not yet supported per code comments)

---

## Observations

### High Usage Resources

✅ **Sources**: 7/8 methods (87.5%)

- Well integrated across data-sources and source-connectors pages
- Missing only schema discovery feature

✅ **Schedules**: 6/7 methods (85.7%)

- Complete CRUD + enable/disable
- Code comment indicates update intentionally disabled: "Schedule updates not yet supported - delete and recreate instead"

### Medium Usage Resources

⚠️ **Pipelines**: 5/10 methods (50%)

- Core CRUD implemented
- Missing: trigger, pause, resume, stats (advanced operations)

### Low Usage Resources

❌ **DataSources**: 1/6 methods (16.7%)

- Only used in dashboard overview
- No dedicated management page
- Appears to be separate from "Sources" conceptually

❌ **PipelineRuns**: 0/3 methods (0%)

- No page dedicated to run history
- Methods exist but not exposed in UI

---

## Recommended Actions

### High Priority: Expose Advanced Pipeline Features

1. Add "Run Pipeline" button to pipelines page
   - Call: `triggerPipeline(id)`
2. Add pause/resume controls for running pipelines

   - Call: `pausePipeline(id)`, `resumePipeline(id)`

3. Display pipeline performance stats
   - Call: `getPipelineStats(id)`
   - Show: execution time, records processed, success rate

### Medium Priority: Add DataSource Management

1. Create dedicated DataSource management page

   - List data sources
   - Show sync status
   - Trigger syncs via `syncDataSource(id)`

2. Implement schema discovery
   - Add button to source detail view
   - Call: `getSourceSchema(id)`
   - Display tables and columns

### Medium Priority: Enhance Schedule Management

1. Enable schedule updates
   - Currently blocked with comment
   - Call: `getSchedule(id)` then `updateSchedule(id, data)`

### Low Priority: Add Pipeline Run History

1. Create pipeline runs page
   - List recent runs per pipeline
   - Show run details: status, duration, records processed
   - Cancel in-progress runs via `cancelPipelineRun(id)`

---

## Code Comments Indicating Missing Features

### schedules/page.tsx (Line 142-143)

```typescript
if ($) {
  // Schedule updates not yet supported
  toast.error("Schedule updates not yet supported - delete and recreate instead")
```

**Status**: Intentional limitation - needs backend/frontend work to enable

### pipelines/page.tsx (Line 229)

```typescript
await integrationApi.updatePipeline(id, { status: newStatus });
```

**Note**: Using status field to pause/resume, not using `pausePipeline()` / `resumePipeline()` methods

---

## Migration Opportunities

The following methods are implemented but not used. Consider:

1. **Consolidate DataSource handling**

   - Currently split between "Sources" and "DataSources"
   - Clarify semantic difference and consolidate pages if possible

2. **Unify pipeline control**

   - Replace status-based updates with explicit `pausePipeline()` / `resumePipeline()` calls
   - More explicit and cleaner API usage

3. **Lazy-load advanced features**
   - Make pipeline run history, stats, and schema discovery optional features
   - Or integrate as tabs/collapsible sections in existing pages
