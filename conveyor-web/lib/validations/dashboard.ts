import { z } from "zod";

export const dashboardSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .optional(),
  theme: z.enum(["light", "dark", "auto"]).optional(),
  auto_refresh: z.boolean().optional(),
  refresh_interval_seconds: z
    .number()
    .min(10, "Refresh interval must be at least 10 seconds")
    .max(3600, "Refresh interval must be less than 1 hour")
    .optional(),
  is_public: z.boolean().optional(),
  is_template: z.boolean().optional(),
});

export type DashboardFormData = z.infer<typeof dashboardSchema>;

export const widgetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  widget_type: z.enum([
    "line_chart",
    "bar_chart",
    "pie_chart",
    "area_chart",
    "scatter_plot",
    "table",
    "metric",
    "text",
    "map",
    "heatmap",
    "gauge",
  ]),
  query_text: z.string().min(1, "Query is required"),
  config: z.record(z.string(), z.unknown()).optional(),
  position_x: z.number().min(0).optional(),
  position_y: z.number().min(0).optional(),
  width: z.number().min(1).max(12).optional(),
  height: z.number().min(1).max(12).optional(),
  cache_duration_seconds: z.number().min(0).optional(),
});

export type WidgetFormData = z.infer<typeof widgetSchema>;

export const reportSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().max(500).optional(),
  source_type: z.enum(["dashboard", "query", "custom"]),
  dashboard: z.string().optional(),
  query: z.string().optional(),
  format: z.enum(["pdf", "excel", "csv", "html"]),
  schedule: z.string().optional(),
  timezone: z.string().optional(),
  enabled: z.boolean().optional(),
  delivery_method: z.enum(["email", "slack", "storage"]),
  delivery_config: z.object({
    recipients: z.array(z.string().email()).optional(),
    slack_channel: z.string().optional(),
    storage_path: z.string().optional(),
  }).optional(),
});

export type ReportFormData = z.infer<typeof reportSchema>;
