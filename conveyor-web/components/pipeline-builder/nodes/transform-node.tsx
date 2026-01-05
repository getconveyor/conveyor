"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  IconTransform,
  IconFilter,
  IconColumns,
  IconMathFunction,
  IconArrowsShuffle,
  IconCode,
  IconTableColumn,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const transformIcons: Record<string, React.ElementType> = {
  filter: IconFilter,
  select: IconColumns,
  aggregate: IconMathFunction,
  join: IconArrowsShuffle,
  sql: IconCode,
  rename: IconTableColumn,
  default: IconTransform,
};

interface TransformNodeData {
  label: string;
  transformType?: string;
  status?: "ready" | "configured" | "error";
  config?: Record<string, any>;
}

export const TransformNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as TransformNodeData;
  const Icon =
    transformIcons[nodeData.transformType || "default"] || IconTransform;
  const status = nodeData.status || "ready";

  return (
    <div
      className={cn(
        "relative min-w-[180px] rounded-lg border-2 bg-card shadow-md transition-all",
        selected
          ? "border-purple-500 ring-2 ring-purple-500/20"
          : "border-purple-200 hover:border-purple-300",
        "group"
      )}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
      />

      {/* Header */}
      <div className="flex items-center gap-2 border-b bg-purple-50 dark:bg-purple-950/30 px-3 py-2 rounded-t-lg">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500 text-white">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{nodeData.label}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {nodeData.transformType || "Transform"}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Status</span>
          <Badge
            variant={
              status === "configured"
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
      </div>

      {/* Transform indicator */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center">
        <div className="h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center">
          <IconTransform className="h-3 w-3 text-white" />
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
      />
    </div>
  );
});

TransformNode.displayName = "TransformNode";
