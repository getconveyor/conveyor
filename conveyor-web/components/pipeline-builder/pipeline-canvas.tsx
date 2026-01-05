"use client";

import { useCallback, useRef, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  Panel,
  BackgroundVariant,
  MarkerType,
  ConnectionLineType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { SourceNode } from "./nodes/source-node";
import { TransformNode } from "./nodes/transform-node";
import { DestinationNode } from "./nodes/destination-node";
import { CustomEdge } from "./edges/custom-edge";
import { NodePalette } from "./node-palette";
import { Button } from "@/components/ui/button";
import {
  IconPlayerPlay,
  IconDeviceFloppy,
  IconZoomIn,
  IconZoomOut,
  IconMaximize,
  IconLayoutGrid,
  IconTrash,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

// Define node types
const nodeTypes: NodeTypes = {
  source: SourceNode,
  transform: TransformNode,
  destination: DestinationNode,
};

// Define edge types
const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

// Default edge options
const defaultEdgeOptions = {
  type: "custom",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: "hsl(var(--primary))",
  },
  style: {
    strokeWidth: 2,
    stroke: "hsl(var(--primary))",
  },
};

export interface PipelineCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onRun?: () => void;
  readOnly?: boolean;
  className?: string;
}

export function PipelineCanvas({
  initialNodes = [],
  initialEdges = [],
  onSave,
  onRun,
  readOnly = false,
  className,
}: PipelineCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  // Handle new connections
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: "custom",
            animated: true,
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // Handle drag over for dropping new nodes
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle dropping new nodes
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const type = event.dataTransfer.getData("application/reactflow");
      const nodeData = event.dataTransfer.getData("application/nodedata");

      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const parsedData = nodeData ? JSON.parse(nodeData) : {};
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: parsedData.label || `New ${type}`,
          icon: parsedData.icon,
          connectorType: parsedData.connectorType,
          config: {},
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // Handle selection change
  const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
    setSelectedNodes(nodes.map((n) => n.id));
  }, []);

  // Delete selected nodes
  const deleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !selectedNodes.includes(n.id)));
    setEdges((eds) =>
      eds.filter(
        (e) =>
          !selectedNodes.includes(e.source) && !selectedNodes.includes(e.target)
      )
    );
    setSelectedNodes([]);
  }, [selectedNodes, setNodes, setEdges]);

  // Auto-layout nodes
  const autoLayout = useCallback(() => {
    const layoutedNodes = nodes.map((node, index) => ({
      ...node,
      position: {
        x: (index % 3) * 300 + 100,
        y: Math.floor(index / 3) * 200 + 100,
      },
    }));
    setNodes(layoutedNodes);
  }, [nodes, setNodes]);

  // Fit view
  const fitView = useCallback(() => {
    reactFlowInstance?.fitView({ padding: 0.2 });
  }, [reactFlowInstance]);

  return (
    <div
      ref={reactFlowWrapper}
      className={cn("h-full w-full bg-muted/30", className)}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        onInit={setReactFlowInstance}
        onDrop={readOnly ? undefined : onDrop}
        onDragOver={readOnly ? undefined : onDragOver}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        deleteKeyCode={readOnly ? null : "Delete"}
        className="bg-background"
      >
        {/* Top toolbar */}
        <Panel position="top-left" className="flex gap-2">
          {!readOnly && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSave?.(nodes, edges)}
                className="gap-2"
              >
                <IconDeviceFloppy className="h-4 w-4" />
                Save
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={onRun}
                className="gap-2"
              >
                <IconPlayerPlay className="h-4 w-4" />
                Run Pipeline
              </Button>
            </>
          )}
        </Panel>

        {/* Right toolbar */}
        <Panel position="top-right" className="flex gap-1">
          <Button
            size="icon"
            variant="outline"
            onClick={() => reactFlowInstance?.zoomIn()}
            className="h-8 w-8"
          >
            <IconZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => reactFlowInstance?.zoomOut()}
            className="h-8 w-8"
          >
            <IconZoomOut className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={fitView}
            className="h-8 w-8"
          >
            <IconMaximize className="h-4 w-4" />
          </Button>
          {!readOnly && (
            <>
              <Button
                size="icon"
                variant="outline"
                onClick={autoLayout}
                className="h-8 w-8"
              >
                <IconLayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={deleteSelected}
                disabled={selectedNodes.length === 0}
                className="h-8 w-8"
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            </>
          )}
        </Panel>

        <Controls showInteractive={!readOnly} />
        <MiniMap
          nodeStrokeColor={(n) => {
            if (n.type === "source") return "#3b82f6";
            if (n.type === "transform") return "#8b5cf6";
            if (n.type === "destination") return "#22c55e";
            return "#64748b";
          }}
          nodeColor={(n) => {
            if (n.type === "source") return "#dbeafe";
            if (n.type === "transform") return "#ede9fe";
            if (n.type === "destination") return "#dcfce7";
            return "#f1f5f9";
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="!bg-background border rounded-lg"
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="hsl(var(--muted-foreground) / 0.3)"
        />
      </ReactFlow>
    </div>
  );
}
