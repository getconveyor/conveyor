"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type Node, type Edge } from "@xyflow/react";
import { PipelineBuilder } from "@/components/pipeline-builder";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconArrowsExchange, IconArrowLeft } from "@tabler/icons-react";
import { toast } from "sonner";
import Link from "next/link";
import { integrationApi, CreatePipelineData } from "@/lib/api/integration";

// Demo initial nodes for a sample pipeline
const demoNodes: Node[] = [
  {
    id: "source-1",
    type: "source",
    position: { x: 100, y: 150 },
    data: {
      label: "PostgreSQL",
      connectorType: "postgresql",
      status: "connected",
    },
  },
  {
    id: "transform-1",
    type: "transform",
    position: { x: 400, y: 100 },
    data: {
      label: "Filter Active Users",
      transformType: "filter",
      status: "configured",
    },
  },
  {
    id: "transform-2",
    type: "transform",
    position: { x: 400, y: 250 },
    data: {
      label: "Aggregate Sales",
      transformType: "aggregate",
      status: "ready",
    },
  },
  {
    id: "destination-1",
    type: "destination",
    position: { x: 700, y: 150 },
    data: {
      label: "Customers Table",
      destinationType: "lakehouse",
      layer: "bronze",
      status: "ready",
    },
  },
];

const demoEdges: Edge[] = [
  {
    id: "e1-2",
    source: "source-1",
    target: "transform-1",
    type: "custom",
    animated: true,
  },
  {
    id: "e1-3",
    source: "source-1",
    target: "transform-2",
    type: "custom",
    animated: true,
  },
  {
    id: "e2-4",
    source: "transform-1",
    target: "destination-1",
    type: "custom",
    animated: true,
  },
];

export default function PipelineBuilderPage() {
  const router = useRouter();
  const [pipelineName, setPipelineName] = useState("New Pipeline");
  const [pipelineDescription, setPipelineDescription] = useState("");
  const [schedule, setSchedule] = useState("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [nodes, setNodes] = useState<Node[]>(demoNodes);
  const [edges, setEdges] = useState<Edge[]>(demoEdges);
  const [isSaving, setIsSaving] = useState(false);

  // Load template from session storage if available
  useEffect(() => {
    const template = sessionStorage.getItem("new-workflow-template");
    if (template) {
      try {
        const data = JSON.parse(template);
        if (data.name) setPipelineName(data.name);
        if (data.description) setPipelineDescription(data.description);
        if (data.schedule) setSchedule(data.schedule);
        sessionStorage.removeItem("new-workflow-template");
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const handleSave = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
    setIsSaveDialogOpen(true);
  }, []);

  const handleSaveConfirm = async () => {
    setIsSaving(true);
    try {
      // Extract source and destination from nodes
      const sourceNode = nodes.find((n) => n.type === "source");
      const destinationNode = nodes.find((n) => n.type === "destination");

      if (!sourceNode || !destinationNode) {
        toast.error(
          "Pipeline must have at least one source and one destination"
        );
        setIsSaving(false);
        return;
      }

      // Build the pipeline data for the API
      const pipelineData: CreatePipelineData = {
        name: pipelineName,
        description: pipelineDescription || undefined,
        source: String(sourceNode.data?.connectorType || sourceNode.id),
        destination: String(
          destinationNode.data?.destinationType || destinationNode.id
        ),
        schedule: schedule && schedule !== "manual" ? schedule : undefined,
        config: {
          nodes: nodes.map((n) => ({
            id: n.id,
            type: n.type,
            position: n.position,
            data: n.data,
          })),
          edges: edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
          })),
        },
      };

      // Call the API to create the pipeline
      const savedPipeline = await integrationApi.createPipeline(pipelineData);

      console.log("Pipeline saved:", savedPipeline);
      toast.success("Pipeline saved successfully!");
      setIsSaveDialogOpen(false);
      router.push("/data-integration/pipelines");
    } catch (error) {
      console.error("Failed to save pipeline:", error);
      toast.error("Failed to save pipeline");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRun = useCallback(() => {
    toast.info("Pipeline run triggered!", {
      description: "Your pipeline is now being executed.",
    });
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height)-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Link href="/data-integration/pipelines">
            <Button variant="ghost" size="icon">
              <IconArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">{pipelineName}</h1>
            <p className="text-sm text-muted-foreground">
              Visual Pipeline Builder
            </p>
          </div>
        </div>
      </div>

      {/* Builder */}
      <div className="flex-1 rounded-lg border overflow-hidden">
        <PipelineBuilder
          initialNodes={nodes}
          initialEdges={edges}
          onSave={handleSave}
          onRun={handleRun}
        />
      </div>

      {/* Save Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Pipeline</DialogTitle>
            <DialogDescription>
              Configure your pipeline settings before saving.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pipeline-name">Pipeline Name</Label>
              <Input
                id="pipeline-name"
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                placeholder="Enter pipeline name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pipeline-description">Description</Label>
              <Textarea
                id="pipeline-description"
                value={pipelineDescription}
                onChange={(e) => setPipelineDescription(e.target.value)}
                placeholder="Describe what this pipeline does"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule">Schedule</Label>
              <Select value={schedule} onValueChange={setSchedule}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a schedule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="*/5 * * * *">Every 5 minutes</SelectItem>
                  <SelectItem value="*/15 * * * *">Every 15 minutes</SelectItem>
                  <SelectItem value="0 * * * *">Hourly</SelectItem>
                  <SelectItem value="0 0 * * *">Daily</SelectItem>
                  <SelectItem value="0 0 * * 0">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm font-medium mb-2">Pipeline Summary</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  • {nodes.filter((n) => n.type === "source").length} source
                  node(s)
                </p>
                <p>
                  • {nodes.filter((n) => n.type === "transform").length}{" "}
                  transform node(s)
                </p>
                <p>
                  • {nodes.filter((n) => n.type === "destination").length}{" "}
                  destination node(s)
                </p>
                <p>• {edges.length} connection(s)</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSaveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveConfirm} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Pipeline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
