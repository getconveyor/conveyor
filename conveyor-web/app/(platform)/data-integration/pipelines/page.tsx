"use client";

import { useState, useEffect } from "react";
import {
  IconPlus,
  IconSearch,
  IconPlayerPlay,
  IconPlayerPause,
  IconDotsVertical,
  IconCheck,
  IconX,
  IconClock,
  IconRefresh,
  IconSettings,
  IconTrash,
  IconCopy,
  IconEye,
  IconLoader2,
  IconTrendingUp,
} from "@tabler/icons-react";
import Link from "next/link";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  integrationApi,
  Pipeline,
  CreatePipelineData,
  Source,
} from "@/lib/api/integration";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PipelineStatus = "active" | "paused" | "error" | "running" | "idle";

const statusConfig: Record<
  PipelineStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    color: string;
  }
> = {
  active: { label: "Active", variant: "default", color: "text-green-500" },
  running: { label: "Running", variant: "default", color: "text-blue-500" },
  error: { label: "Error", variant: "destructive", color: "text-red-500" },
  paused: { label: "Paused", variant: "secondary", color: "text-gray-500" },
  idle: { label: "Idle", variant: "outline", color: "text-gray-500" },
};

export default function PipelinesPage() {
  const { currentWorkspace } = useWorkspace();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
  const [pipelineToDelete, setPipelineToDelete] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    source: "",
    layer: "bronze", // Lakehouse layer: "bronze" | "silver" | "gold"
    namespace: "", // Logical grouping (e.g., "sales", "marketing")
    table_name: "", // Table name within the layer
    schedule: "",
  });

  const filteredPipelines = pipelines.filter((pipeline) => {
    const matchesSearch =
      pipeline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pipeline.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ??
        false);
    const matchesStatus =
      statusFilter === "all" || pipeline.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: pipelines.length,
    running: pipelines.filter((p) => p.status === "running").length,
    failed: pipelines.filter((p) => p.status === "error").length,
    paused: pipelines.filter((p) => p.status === "paused").length,
  };

  // Load pipelines from API
  useEffect(() => {
    if (currentWorkspace) {
      loadPipelines();
      loadSources();
    }
  }, [currentWorkspace]);

  async function loadPipelines() {
    if (!currentWorkspace) return;

    try {
      setIsFetching(true);
      const data = await integrationApi.getPipelines();
      setPipelines(data);
    } catch (error: any) {
      console.error("Failed to load pipelines:", error);
      toast.error(error.message || "Failed to load pipelines");
    } finally {
      setIsFetching(false);
    }
  }

  async function loadSources() {
    if (!currentWorkspace) return;

    try {
      const data = await integrationApi.getSources();
      setSources(data);
    } catch (error: any) {
      console.error("Failed to load sources:", error);
      toast.error(error.message || "Failed to load sources");
    }
  }

  const handleCreateOrUpdatePipeline = async () => {
    if (
      !formData.name.trim() ||
      !formData.source ||
      !formData.table_name.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      if (editingPipeline) {
        // Update existing pipeline
        await integrationApi.updatePipeline(editingPipeline.id, {
          name: formData.name,
          description: formData.description,
          schedule: formData.schedule || undefined,
        });
        toast.success("Pipeline updated successfully");
      } else {
        // Create new pipeline
        const createData: CreatePipelineData = {
          name: formData.name,
          description: formData.description,
          source: formData.source,
          destination: formData.source, // Temporary: set to source, will be handled by backend
          schedule: formData.schedule || undefined,
          config: {
            destination_type: "lakehouse",
            lakehouse: {
              layer: formData.layer,
              namespace: formData.namespace || "default",
              table_name: formData.table_name,
              format: "iceberg",
              storage: "minio",
            },
          },
        };
        await integrationApi.createPipeline(createData);
        toast.success("Pipeline created successfully");
      }

      // Reload pipelines after successful operation
      await loadPipelines();

      // Close dialog and reset form
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Failed to save pipeline:", error);
      toast.error(error.message || "Failed to save pipeline");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPipeline = (pipeline: Pipeline) => {
    setEditingPipeline(pipeline);

    // Support both old and new config formats
    const lakehouseConfig = pipeline.config?.lakehouse;

    setFormData({
      name: pipeline.name,
      description: pipeline.description || "",
      source: pipeline.source || "", // Source ID from pipeline
      layer: lakehouseConfig?.layer || "bronze",
      namespace: lakehouseConfig?.namespace || "",
      table_name:
        lakehouseConfig?.table_name || pipeline.config?.table_name || "",
      schedule: pipeline.schedule || "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleDeletePipeline = async () => {
    if (!pipelineToDelete) return;

    setIsLoading(true);
    try {
      await integrationApi.deletePipeline(pipelineToDelete);
      toast.success("Pipeline deleted successfully");

      // Reload pipelines after deletion
      await loadPipelines();

      setPipelineToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete pipeline:", error);
      toast.error(error.message || "Failed to delete pipeline");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunPipeline = async (id: string) => {
    setIsLoading(true);
    try {
      await integrationApi.triggerPipeline(id);
      toast.success("Pipeline triggered successfully");

      // Reload pipelines after triggering
      await loadPipelines();
    } catch (error: any) {
      console.error("Failed to trigger pipeline:", error);
      toast.error(error.message || "Failed to trigger pipeline");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePausePipeline = async (id: string) => {
    setIsLoading(true);
    try {
      await integrationApi.pausePipeline(id);
      toast.success("Pipeline paused successfully");

      // Reload pipelines after pausing
      await loadPipelines();
    } catch (error: any) {
      console.error("Failed to pause pipeline:", error);
      toast.error(error.message || "Failed to pause pipeline");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumePipeline = async (id: string) => {
    setIsLoading(true);
    try {
      await integrationApi.resumePipeline(id);
      toast.success("Pipeline resumed successfully");

      // Reload pipelines after resuming
      await loadPipelines();
    } catch (error: any) {
      console.error("Failed to resume pipeline:", error);
      toast.error(error.message || "Failed to resume pipeline");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewStats = async (id: string) => {
    setIsLoading(true);
    try {
      const stats = await integrationApi.getPipelineStats(id);
      toast.message(JSON.stringify(stats, null, 2));
    } catch (error: any) {
      console.error("Failed to fetch pipeline stats:", error);
      toast.error(error.message || "Failed to fetch pipeline stats");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePlayPause = async (id: string) => {
    const pipeline = pipelines.find((p) => p.id === id);
    if (!pipeline) return;

    // Use new explicit methods
    if (pipeline.status === "paused") {
      await handleResumePipeline(id);
    } else if (pipeline.status === "running") {
      await handlePausePipeline(id);
    } else {
      // idle or active - run the pipeline
      await handleRunPipeline(id);
    }
  };

  const handleDuplicatePipeline = async (pipeline: Pipeline) => {
    setIsLoading(true);
    try {
      // Note: We don't have source and destination IDs
      // from the pipeline object, so duplication may require backend support
      // or fetching the full pipeline details first
      toast.error(
        "Pipeline duplication requires source IDs - feature coming soon"
      );
    } catch (error: any) {
      console.error("Failed to duplicate pipeline:", error);
      toast.error(error.message || "Failed to duplicate pipeline");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      source: "",
      layer: "bronze",
      namespace: "",
      table_name: "",
      schedule: "",
    });
    setEditingPipeline(null);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipelines</h1>
          <p className="text-sm text-muted-foreground">
            Manage your data integration pipelines
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Create Pipeline
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Total
            </div>
            <div className="text-xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Running
            </div>
            <div className="text-xl font-bold text-blue-500">
              {stats.running}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Failed
            </div>
            <div className="text-xl font-bold text-red-500">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Paused
            </div>
            <div className="text-xl font-bold text-gray-500">
              {stats.paused}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search pipelines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={loadPipelines}
                disabled={isFetching}
              >
                <IconRefresh
                  className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {isFetching && pipelines.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <IconLoader2 className="h-6 w-6 animate-spin mr-2" />
              Loading pipelines...
            </div>
          ) : filteredPipelines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">No pipelines found</p>
              <p className="text-xs mt-1">
                Create your first pipeline to get started
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPipelines.map((pipeline) => (
                <Card key={pipeline.id}>
                  <CardContent className="p-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-semibold text-sm">
                            {pipeline.name}
                          </h3>
                          <Badge
                            variant={statusConfig[pipeline.status].variant}
                            className="text-xs"
                          >
                            {statusConfig[pipeline.status].label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {pipeline.description}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-2">
                          <div>
                            <p className="text-muted-foreground">Source</p>
                            <p className="font-medium">
                              {pipeline.source_name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Destination</p>
                            <p className="font-medium">
                              {pipeline.destination_name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Schedule</p>
                            <p className="font-medium">
                              {pipeline.schedule || "Manual"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              Success Rate
                            </p>
                            <p className="font-medium">
                              {pipeline.success_rate}%
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <IconClock className="h-3 w-3" />
                            Last: {pipeline.last_run || "Never"}
                          </span>
                          <span className="flex items-center gap-1">
                            <IconRefresh className="h-3 w-3" />
                            Next: {pipeline.next_run || "Not scheduled"}
                          </span>
                          <span>{pipeline.records_processed || 0} records</span>
                          <span>{pipeline.run_count} runs</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {pipeline.status === "paused" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleTogglePlayPause(pipeline.id)}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <IconPlayerPlay className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        ) : pipeline.status === "running" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleTogglePlayPause(pipeline.id)}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <IconPlayerPause className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleTogglePlayPause(pipeline.id)}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <IconPlayerPlay className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              disabled={isLoading}
                            >
                              <IconDotsVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <IconEye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleViewStats(pipeline.id)}
                              disabled={isLoading}
                            >
                              <IconTrendingUp className="mr-2 h-4 w-4" />
                              View Stats
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditPipeline(pipeline)}
                            >
                              <IconSettings className="mr-2 h-4 w-4" />
                              Edit Pipeline
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicatePipeline(pipeline)}
                            >
                              <IconCopy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setPipelineToDelete(pipeline.id)}
                            >
                              <IconTrash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Pipeline Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            resetForm();
          }
        }}
        modal
      >
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {editingPipeline ? "Edit Pipeline" : "Create New Pipeline"}
            </DialogTitle>
            <DialogDescription>
              {editingPipeline
                ? "Update the pipeline configuration."
                : "Create a pipeline to sync data from a source to your Lakehouse or Warehouse."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="pipeline-name">Pipeline Name</Label>
              <Input
                id="pipeline-name"
                placeholder="e.g., Customer Data Sync"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pipeline-description">Description</Label>
              <Textarea
                id="pipeline-description"
                placeholder="Describe what this pipeline does..."
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="source">Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) =>
                    setFormData({ ...formData, source: value })
                  }
                >
                  <SelectTrigger id="source">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No sources available
                      </SelectItem>
                    ) : (
                      sources.map((source) => (
                        <SelectItem key={source.id} value={source.id}>
                          {source.name} ({source.type})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Configure sources in the Sources page
                </p>
              </div>

              {/* Lakehouse Layer Selection */}
              <div className="grid gap-2">
                <Label htmlFor="layer" className="flex items-center gap-2">
                  Lakehouse Layer *
                  <span className="text-xs font-normal text-muted-foreground">
                    (Medallion Architecture)
                  </span>
                </Label>
                <Select
                  value={formData.layer}
                  onValueChange={(value) =>
                    setFormData({ ...formData, layer: value })
                  }
                >
                  <SelectTrigger id="layer" className="h-auto">
                    <SelectValue placeholder="Select data quality layer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bronze" className="py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🥉</span>
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">Bronze Layer</span>
                          <span className="text-xs text-muted-foreground">
                            Raw data • Exact copy from source • No
                            transformations
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="silver" className="py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🥈</span>
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">Silver Layer</span>
                          <span className="text-xs text-muted-foreground">
                            Cleaned • Validated • Deduplicated • Type-safe
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="gold" className="py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🥇</span>
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">Gold Layer</span>
                          <span className="text-xs text-muted-foreground">
                            Business-ready • Aggregated • Optimized for BI
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 border">
                  <span className="text-lg">
                    {formData.layer === "bronze" && "🥉"}
                    {formData.layer === "silver" && "🥈"}
                    {formData.layer === "gold" && "🥇"}
                  </span>
                  <div className="text-xs space-y-1">
                    {formData.layer === "bronze" && (
                      <>
                        <p className="font-medium">
                          Bronze Layer (Landing Zone)
                        </p>
                        <p className="text-muted-foreground">
                          Ingests raw data exactly as it appears in the source
                          system. Useful for data lineage, auditing, and
                          re-processing.
                        </p>
                      </>
                    )}
                    {formData.layer === "silver" && (
                      <>
                        <p className="font-medium">
                          Silver Layer (Refined Zone)
                        </p>
                        <p className="text-muted-foreground">
                          Applies data quality rules: removes duplicates,
                          validates schemas, standardizes formats. Ready for
                          analytics.
                        </p>
                      </>
                    )}
                    {formData.layer === "gold" && (
                      <>
                        <p className="font-medium">Gold Layer (Curated Zone)</p>
                        <p className="text-muted-foreground">
                          Business-level aggregations and metrics. Optimized
                          tables for dashboards, reports, and ML models.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Namespace/Domain */}
              <div className="grid gap-2">
                <Label htmlFor="namespace" className="flex items-center gap-2">
                  Database / Namespace
                  <span className="text-xs font-normal text-muted-foreground">
                    (Optional)
                  </span>
                </Label>
                <Input
                  id="namespace"
                  placeholder="e.g., sales, marketing, finance, operations"
                  value={formData.namespace}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      namespace: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "_"),
                    })
                  }
                />
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span>💡</span>
                  <div>
                    <p className="font-medium">
                      Organize your tables by business domain
                    </p>
                    <p className="mt-1">
                      Common namespaces:{" "}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        sales
                      </code>
                      ,{" "}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        marketing
                      </code>
                      ,{" "}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        finance
                      </code>
                      ,{" "}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        operations
                      </code>
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Leave empty to use{" "}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        default
                      </code>{" "}
                      namespace
                    </p>
                  </div>
                </div>
              </div>

              {/* Table Name */}
              <div className="grid gap-2">
                <Label htmlFor="table_name">Table Name *</Label>
                <Input
                  id="table_name"
                  placeholder={
                    formData.layer === "bronze"
                      ? "e.g., customer_orders, product_catalog"
                      : formData.layer === "silver"
                      ? "e.g., customers_cleaned, orders_validated"
                      : "e.g., daily_sales_summary, customer_metrics"
                  }
                  value={formData.table_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      table_name: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "_"),
                    })
                  }
                />
                <div className="flex items-start gap-2 p-3 rounded-md bg-primary/5 border border-primary/20">
                  <span className="text-sm">📍</span>
                  <div className="flex-1 text-xs space-y-1">
                    <p className="font-medium text-primary">
                      Full Iceberg Table Path:
                    </p>
                    <code className="block p-2 rounded bg-background border font-mono">
                      iceberg.{formData.layer}.{formData.namespace || "default"}
                      .{formData.table_name || "table_name"}
                    </code>
                    <p className="text-muted-foreground mt-2">
                      Query in Trino:{" "}
                      <code className="bg-muted px-1 py-0.5 rounded">
                        SELECT * FROM iceberg.{formData.layer}.
                        {formData.namespace || "default"}.
                        {formData.table_name || "table_name"}
                      </code>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="schedule">Schedule (Optional)</Label>
              <Input
                id="schedule"
                placeholder="e.g., 0 * * * * (cron expression) or @hourly"
                value={formData.schedule}
                onChange={(e) =>
                  setFormData({ ...formData, schedule: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for manual-only execution
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrUpdatePipeline}
              disabled={
                !formData.name.trim() ||
                !formData.source ||
                !formData.table_name.trim() ||
                isLoading
              }
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingPipeline ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{editingPipeline ? "Update Pipeline" : "Create Pipeline"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!pipelineToDelete}
        onOpenChange={(open) => !open && setPipelineToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this pipeline. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePipeline}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
