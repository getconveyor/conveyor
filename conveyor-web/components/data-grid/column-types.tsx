"use client";

import type {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from "ag-grid-community";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconCheck,
  IconX,
  IconClock,
  IconLoader2,
  IconAlertTriangle,
  IconPlayerPause,
  IconDotsVertical,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// Status badge renderer
export function StatusBadgeRenderer({ value }: ICellRendererParams) {
  const statusConfig: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
      icon: React.ElementType;
    }
  > = {
    active: { label: "Active", variant: "default", icon: IconCheck },
    running: { label: "Running", variant: "default", icon: IconLoader2 },
    success: { label: "Success", variant: "default", icon: IconCheck },
    completed: { label: "Completed", variant: "default", icon: IconCheck },
    error: { label: "Error", variant: "destructive", icon: IconX },
    failed: { label: "Failed", variant: "destructive", icon: IconX },
    warning: {
      label: "Warning",
      variant: "secondary",
      icon: IconAlertTriangle,
    },
    paused: { label: "Paused", variant: "secondary", icon: IconPlayerPause },
    idle: { label: "Idle", variant: "outline", icon: IconClock },
    pending: { label: "Pending", variant: "outline", icon: IconClock },
  };

  const config = statusConfig[value?.toLowerCase()] || {
    label: value || "Unknown",
    variant: "outline" as const,
    icon: IconClock,
  };

  const Icon = config.icon;
  const isAnimated = value?.toLowerCase() === "running";

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className={cn("h-3 w-3", isAnimated && "animate-spin")} />
      {config.label}
    </Badge>
  );
}

// Date/time formatter
export function dateFormatter({ value }: ValueFormatterParams): string {
  if (!value) return "-";
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return value;
  }
}

// Absolute date formatter
export function absoluteDateFormatter({ value }: ValueFormatterParams): string {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

// Number formatter
export function numberFormatter({ value }: ValueFormatterParams): string {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat().format(value);
}

// Percentage formatter
export function percentFormatter({ value }: ValueFormatterParams): string {
  if (value === null || value === undefined) return "-";
  return `${value.toFixed(1)}%`;
}

// Bytes formatter
export function bytesFormatter({ value }: ValueFormatterParams): string {
  if (value === null || value === undefined) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  let size = value;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// Tags renderer
export function TagsRenderer({ value }: ICellRendererParams) {
  if (!value || !Array.isArray(value)) return null;

  return (
    <div className="flex gap-1 flex-wrap">
      {value.slice(0, 3).map((tag: string, index: number) => (
        <Badge key={index} variant="outline" className="text-xs">
          {tag}
        </Badge>
      ))}
      {value.length > 3 && (
        <Badge variant="secondary" className="text-xs">
          +{value.length - 3}
        </Badge>
      )}
    </div>
  );
}

// Progress bar renderer
export function ProgressRenderer({ value }: ICellRendererParams) {
  const progress = typeof value === "number" ? value : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all",
            progress >= 80
              ? "bg-green-500"
              : progress >= 50
              ? "bg-yellow-500"
              : "bg-red-500"
          )}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-10 text-right">
        {progress.toFixed(0)}%
      </span>
    </div>
  );
}

// Boolean renderer
export function BooleanRenderer({ value }: ICellRendererParams) {
  return value ? (
    <IconCheck className="h-4 w-4 text-green-500" />
  ) : (
    <IconX className="h-4 w-4 text-muted-foreground" />
  );
}

// Actions renderer factory
export function createActionsRenderer(
  actions: Array<{
    label: string;
    icon?: React.ElementType;
    onClick: (data: any) => void;
    variant?: "default" | "destructive";
  }>
) {
  return function ActionsRenderer({ data }: ICellRendererParams) {
    return (
      <div className="flex items-center gap-1">
        {actions.slice(0, 2).map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              action.onClick(data);
            }}
          >
            {action.icon && <action.icon className="h-4 w-4" />}
          </Button>
        ))}
        {actions.length > 2 && (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };
}

// Common column definitions
export const commonColumns = {
  status: (field: string = "status"): ColDef => ({
    field,
    headerName: "Status",
    cellRenderer: StatusBadgeRenderer,
    width: 130,
    filter: "agSetColumnFilter",
  }),

  createdAt: (field: string = "created_at"): ColDef => ({
    field,
    headerName: "Created",
    valueFormatter: dateFormatter,
    width: 150,
    filter: "agDateColumnFilter",
  }),

  updatedAt: (field: string = "updated_at"): ColDef => ({
    field,
    headerName: "Updated",
    valueFormatter: dateFormatter,
    width: 150,
    filter: "agDateColumnFilter",
  }),

  tags: (field: string = "tags"): ColDef => ({
    field,
    headerName: "Tags",
    cellRenderer: TagsRenderer,
    width: 200,
    filter: false,
    sortable: false,
  }),

  progress: (field: string = "progress"): ColDef => ({
    field,
    headerName: "Progress",
    cellRenderer: ProgressRenderer,
    width: 150,
    filter: "agNumberColumnFilter",
  }),

  boolean: (field: string, headerName: string): ColDef => ({
    field,
    headerName,
    cellRenderer: BooleanRenderer,
    width: 100,
    filter: "agSetColumnFilter",
  }),

  actions: (
    actions: Array<{
      label: string;
      icon?: React.ElementType;
      onClick: (data: any) => void;
    }>
  ): ColDef => ({
    headerName: "",
    cellRenderer: createActionsRenderer(actions),
    width: 100,
    sortable: false,
    filter: false,
    resizable: false,
    pinned: "right",
  }),
};
