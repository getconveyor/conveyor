import { z } from "zod";
import { PIPELINE_STATUS } from "@/lib/constants";

export const pipelineSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9_\s-]+$/, "Name can only contain letters, numbers, spaces, hyphens, and underscores"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  source: z.string().min(1, "Source is required"),
  table_name: z
    .string()
    .min(1, "Table name is required")
    .max(100, "Table name must be less than 100 characters")
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Table name must start with a letter and contain only letters, numbers, and underscores"),
  schedule: z.string().optional(),
  status: z.enum([
    PIPELINE_STATUS.DRAFT,
    PIPELINE_STATUS.ACTIVE,
    PIPELINE_STATUS.PAUSED,
    PIPELINE_STATUS.FAILED,
    PIPELINE_STATUS.ARCHIVED,
  ] as const).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export type PipelineFormData = z.infer<typeof pipelineSchema>;

// Partial update schema
export const pipelineUpdateSchema = pipelineSchema.partial();

// Schedule validation
export const scheduleSchema = z.object({
  cron: z
    .string()
    .regex(
      /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
      "Invalid cron expression"
    ),
  timezone: z.string().optional(),
});
