"use client";

import { useState, useCallback } from "react";
import { type Node, type Edge, ReactFlowProvider } from "@xyflow/react";
import { PipelineCanvas } from "./pipeline-canvas";
import { NodePalette } from "./node-palette";
import { NodeConfigPanel } from "./node-config-panel";
import { cn } from "@/lib/utils";

export interface PipelineBuilderProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onRun?: () => void;
  className?: string;
}

export function PipelineBuilder({
  initialNodes = [],
  initialEdges = [],
  onSave,
  onRun,
  className,
}: PipelineBuilderProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const handleNodeSelect = useCallback((node: Node | null) => {
    setSelectedNode(node);
  }, []);

  return (
    <ReactFlowProvider>
      <div
        className={cn(
          "h-full w-full min-h-[600px] flex pipeline-builder-container",
          className
        )}
      >
        {/* Node Palette - Fixed width */}
        <div className="w-64 flex-shrink-0 h-full overflow-auto border-r bg-background relative z-10">
          <NodePalette />
        </div>

        {/* Canvas - Flex grow */}
        <div className="flex-1 h-full relative overflow-hidden">
          <PipelineCanvas
            initialNodes={initialNodes}
            initialEdges={initialEdges}
            onSave={onSave}
            onRun={onRun}
          />
        </div>

        {/* Config Panel - Fixed width */}
        <div className="w-80 flex-shrink-0 h-full overflow-auto border-l bg-background relative z-10">
          <NodeConfigPanel selectedNode={selectedNode} />
        </div>
      </div>
    </ReactFlowProvider>
  );
}

// Re-export components
export { PipelineCanvas } from "./pipeline-canvas";
export { NodePalette } from "./node-palette";
export { NodeConfigPanel } from "./node-config-panel";
