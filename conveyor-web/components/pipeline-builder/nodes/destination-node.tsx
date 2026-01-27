"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  IconDatabase,
  IconStack,
  IconCloud,
  IconTable,
  IconFileExport,
  IconBrandSnowflake,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const destinationIcons: Record<string, React.ElementType> = {
  lakehouse: IconStack,
  bronze: IconStack,
  silver: IconStack,
  gold: IconStack,
  s3: IconCloud,
  table: IconTable,
  file: IconFileExport,
  snowflake: IconBrandSnowflake,
  default: IconDatabase,
};

const layerColors: Record<
  string,
  { bg: string; border: string; accent: string }
> = {
  bronze: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 hover:border-amber-300",
    accent: "bg-amber-600",
  },
  silver: {
    bg: "bg-slate-50 dark:bg-slate-950/30",
    border: "border-slate-300 hover:border-slate-400",
    accent: "bg-slate-500",
  },
  gold: {
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-300 hover:border-yellow-400",
    accent: "bg-yellow-500",
  },
  default: {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 hover:border-green-300",
    accent: "bg-green-500",
  },
};

interface DestinationNodeData {
  label: string;
  destinationType?: string;
  layer?: "bronze" | "silver" | "gold";
  status?: "ready" | "writing" | "error";
  config?: Record<string, any>;
}

export const DestinationNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as DestinationNodeData;
  const Icon =
    destinationIcons[nodeData.destinationType || nodeData.layer || "default"] ||
    IconDatabase;
  const status = nodeData.status || "ready";
  const colors =
    layerColors[nodeData.layer || "default"] || layerColors.default;

  return (
    <div
      className={cn(
        "relative min-w-[180px] rounded-lg border-2 bg-card shadow-md transition-all",
        selected ? "border-green-500 ring-2 ring-green-500/20" : colors.border,
        "group"
      )}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          "!w-3 !h-3 !border-2 !border-white",
          nodeData.layer === "bronze" && "!bg-amber-600",
          nodeData.layer === "silver" && "!bg-slate-500",
          nodeData.layer === "gold" && "!bg-yellow-500",
          !nodeData.layer && "!bg-green-500"
        )}
      />

      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2 border-b px-3 py-2 rounded-t-lg",
          colors.bg
        )}
      >
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md text-white",
            colors.accent
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{nodeData.label}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {nodeData.layer
              ? `${nodeData.layer} Layer`
              : nodeData.destinationType || "Destination"}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Status</span>
          <Badge
            variant={
              status === "writing"
                ? "default"
                : status === "error"
                ? "destructive"
                : "secondary"
            }
            className="text-xs px-1.5 py-0"
          >
            {status}
          </Badge>
        </div>
        {nodeData.layer && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">Layer</span>
            <Badge variant="outline" className="text-xs px-1.5 py-0 capitalize">
              {nodeData.layer}
            </Badge>
          </div>
        )}
      </div>

      {/* Destination indicator */}
      <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
        <div
          className={cn(
            "h-6 w-6 rounded-full flex items-center justify-center",
            colors.accent
          )}
        >
          <IconDatabase className="h-3 w-3 text-white" />
        </div>
      </div>
    </div>
  );
});

DestinationNode.displayName = "DestinationNode";
