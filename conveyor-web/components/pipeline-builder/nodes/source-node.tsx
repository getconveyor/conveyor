"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  IconDatabase,
  IconSql,
  IconFileSpreadsheet,
  IconApi,
  IconCloud,
  IconServer,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const connectorIcons: Record<string, React.ElementType> = {
  postgresql: IconSql,
  mysql: IconServer,
  csv: IconFileSpreadsheet,
  api: IconApi,
  s3: IconCloud,
  default: IconDatabase,
};

interface SourceNodeData {
  label: string;
  connectorType?: string;
  status?: "connected" | "disconnected" | "error";
  config?: Record<string, any>;
}

export const SourceNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as SourceNodeData;
  const Icon =
    connectorIcons[nodeData.connectorType || "default"] || IconDatabase;
  const status = nodeData.status || "connected";

  return (
    <div
      className={cn(
        "relative min-w-[180px] rounded-lg border-2 bg-card shadow-md transition-all",
        selected
          ? "border-blue-500 ring-2 ring-blue-500/20"
          : "border-blue-200 hover:border-blue-300",
        "group"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b bg-blue-50 dark:bg-blue-950/30 px-3 py-2 rounded-t-lg">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500 text-white">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{nodeData.label}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {nodeData.connectorType || "Source"}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Status</span>
          <Badge
            variant={
              status === "connected"
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

      {/* Source indicator */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
        <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
          <IconServer className="h-3 w-3 text-white" />
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
    </div>
  );
});

SourceNode.displayName = "SourceNode";
