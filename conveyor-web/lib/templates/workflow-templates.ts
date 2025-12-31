import { WorkflowStep, WorkflowTemplate } from "@/lib/types/workflow"

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

const defaultErrorHandling = {
  retryAttempts: 3,
  onFailure: "stop" as const,
  alertEmails: [],
}

export const workflowTemplates: Record<string, WorkflowTemplate> = {
  blank: {
    id: "blank",
    name: "Blank Workflow",
    description: "Start from scratch with no pre-configured steps",
    generateSteps: (): WorkflowStep[] => [],
  },

  etl: {
    id: "etl",
    name: "ETL Pipeline",
    description: "Extract, transform, and load data from source to destination",
    generateSteps: (): WorkflowStep[] => [
      {
        id: generateId(),
        name: "Extract Data",
        description: "Connect to data source and extract raw data",
        type: "extract",
        inputSource: {
          type: "database",
          connectionId: undefined,
          query: "SELECT * FROM source_table",
        },
        errorHandling: defaultErrorHandling,
        order: 0,
      },
      {
        id: generateId(),
        name: "Transform Data",
        description: "Clean, enrich, and transform the extracted data",
        type: "transform",
        notebookId: undefined,
        errorHandling: defaultErrorHandling,
        order: 1,
      },
      {
        id: generateId(),
        name: "Validate Data Quality",
        description: "Check data quality before loading",
        type: "validate",
        notebookId: undefined,
        errorHandling: {
          ...defaultErrorHandling,
          onFailure: "notify",
        },
        order: 2,
      },
      {
        id: generateId(),
        name: "Load to Warehouse",
        description: "Load transformed data into the data warehouse",
        type: "load",
        outputDestination: {
          type: "database",
          connectionId: undefined,
          tableName: "target_table",
        },
        errorHandling: defaultErrorHandling,
        order: 3,
      },
      {
        id: generateId(),
        name: "Send Completion Notification",
        description: "Notify stakeholders of successful completion",
        type: "notify",
        errorHandling: {
          retryAttempts: 1,
          onFailure: "continue",
          alertEmails: [],
        },
        order: 4,
      },
    ],
  },

  "data-quality": {
    id: "data-quality",
    name: "Data Quality Check",
    description: "Validate data quality across datasets",
    generateSteps: (): WorkflowStep[] => [
      {
        id: generateId(),
        name: "Load Dataset",
        description: "Load the dataset to be validated",
        type: "extract",
        inputSource: {
          type: "database",
          connectionId: undefined,
          query: "SELECT * FROM dataset",
        },
        errorHandling: defaultErrorHandling,
        order: 0,
      },
      {
        id: generateId(),
        name: "Check for Null Values",
        description: "Identify and count null values in critical columns",
        type: "validate",
        notebookId: undefined,
        errorHandling: {
          ...defaultErrorHandling,
          onFailure: "continue",
        },
        order: 1,
      },
      {
        id: generateId(),
        name: "Check for Duplicates",
        description: "Find and report duplicate records",
        type: "validate",
        notebookId: undefined,
        errorHandling: {
          ...defaultErrorHandling,
          onFailure: "continue",
        },
        order: 2,
      },
      {
        id: generateId(),
        name: "Validate Data Ranges",
        description: "Ensure values are within expected ranges",
        type: "validate",
        notebookId: undefined,
        errorHandling: {
          ...defaultErrorHandling,
          onFailure: "continue",
        },
        order: 3,
      },
      {
        id: generateId(),
        name: "Validate Schema",
        description: "Check that column types and structure match expectations",
        type: "validate",
        notebookId: undefined,
        errorHandling: {
          ...defaultErrorHandling,
          onFailure: "continue",
        },
        order: 4,
      },
      {
        id: generateId(),
        name: "Generate Quality Report",
        description: "Compile findings and send quality report",
        type: "notify",
        errorHandling: {
          retryAttempts: 1,
          onFailure: "continue",
          alertEmails: [],
        },
        order: 5,
      },
    ],
  },

  aggregation: {
    id: "aggregation",
    name: "Data Aggregation",
    description: "Aggregate and summarize data for analytics",
    generateSteps: (): WorkflowStep[] => [
      {
        id: generateId(),
        name: "Load Raw Data",
        description: "Extract raw data to be aggregated",
        type: "extract",
        inputSource: {
          type: "database",
          connectionId: undefined,
          query: "SELECT * FROM raw_data",
        },
        errorHandling: defaultErrorHandling,
        order: 0,
      },
      {
        id: generateId(),
        name: "Group and Aggregate",
        description: "Apply grouping and aggregation functions (sum, avg, count)",
        type: "transform",
        notebookId: undefined,
        errorHandling: defaultErrorHandling,
        order: 1,
      },
      {
        id: generateId(),
        name: "Join with Dimensions",
        description: "Enrich aggregated data with dimensional attributes",
        type: "transform",
        notebookId: undefined,
        errorHandling: defaultErrorHandling,
        order: 2,
      },
      {
        id: generateId(),
        name: "Calculate Metrics",
        description: "Compute derived metrics and KPIs",
        type: "transform",
        notebookId: undefined,
        errorHandling: defaultErrorHandling,
        order: 3,
      },
      {
        id: generateId(),
        name: "Save Aggregated Results",
        description: "Store aggregated data in analytics tables",
        type: "load",
        outputDestination: {
          type: "database",
          connectionId: undefined,
          tableName: "aggregated_metrics",
        },
        errorHandling: defaultErrorHandling,
        order: 4,
      },
    ],
  },

  streaming: {
    id: "streaming",
    name: "Stream Processing",
    description: "Process data streams in real-time",
    generateSteps: (): WorkflowStep[] => [
      {
        id: generateId(),
        name: "Consume Event Stream",
        description: "Connect to event stream and consume messages",
        type: "extract",
        inputSource: {
          type: "stream",
          connectionId: undefined,
        },
        errorHandling: {
          retryAttempts: 0,
          onFailure: "continue",
          alertEmails: [],
        },
        order: 0,
      },
      {
        id: generateId(),
        name: "Filter Events",
        description: "Filter and keep only relevant events",
        type: "transform",
        notebookId: undefined,
        errorHandling: {
          retryAttempts: 0,
          onFailure: "continue",
        },
        order: 1,
      },
      {
        id: generateId(),
        name: "Transform Events",
        description: "Process and transform each event",
        type: "transform",
        notebookId: undefined,
        errorHandling: {
          retryAttempts: 1,
          onFailure: "continue",
        },
        order: 2,
      },
      {
        id: generateId(),
        name: "Enrich with Context",
        description: "Add additional data from lookups or APIs",
        type: "transform",
        notebookId: undefined,
        errorHandling: {
          retryAttempts: 2,
          onFailure: "continue",
        },
        order: 3,
      },
      {
        id: generateId(),
        name: "Write to Sink",
        description: "Send processed events to destination in real-time",
        type: "load",
        outputDestination: {
          type: "stream",
          connectionId: undefined,
        },
        errorHandling: {
          retryAttempts: 3,
          onFailure: "notify",
        },
        order: 4,
      },
    ],
  },
}

export function getTemplate(templateId: string): WorkflowTemplate | undefined {
  return workflowTemplates[templateId]
}

export function getAllTemplates(): WorkflowTemplate[] {
  return Object.values(workflowTemplates)
}
