"use client";

import { useState, useCallback } from "react";
import { type Node, type Edge, ReactFlowProvider } from "@xyflow/react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
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
      <div className={cn("h-full w-full", className)}>
        <ResizablePanelGroup direction="horizontal">
          {/* Node Palette */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <NodePalette />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Canvas */}
          <ResizablePanel defaultSize={55} minSize={40}>
            <PipelineCanvas
              initialNodes={initialNodes}
              initialEdges={initialEdges}
              onSave={onSave}
              onRun={onRun}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Config Panel */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <NodeConfigPanel selectedNode={selectedNode} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </ReactFlowProvider>
  );
}

// Re-export components
export { PipelineCanvas } from "./pipeline-canvas";
export { NodePalette } from "./node-palette";
export { NodeConfigPanel } from "./node-config-panel";
