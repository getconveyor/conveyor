"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  IconPlus,
  IconPlayerPlay,
  IconPlayerPause,
  IconDotsVertical,
  IconRefresh,
  IconSettings,
  IconTrash,
  IconCopy,
  IconEye,
  IconLoader2,
  IconTrendingUp,
  IconArrowsTransferDown,
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
import { ColDef } from "ag-grid-community";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { DataGrid } from "@/components/data-grid";

type PipelineStatus = "active" | "paused" | "error" | "running" | "idle";

const statusConfig: Record<
  PipelineStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  active: { label: "Active", variant: "default" },
  running: { label: "Running", variant: "default" },
  error: { label: "Error", variant: "destructive" },
  paused: { label: "Paused", variant: "secondary" },
  idle: { label: "Idle", variant: "outline" },
};

export default function PipelinesPage() {
  const { currentWorkspace } = useWorkspace();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
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
    layer: "bronze",
    namespace: "",
    table_name: "",
    schedule: "",
  });

  const filteredPipelines = useMemo(() => {
    return pipelines.filter((pipeline) => {
      return statusFilter === "all" || pipeline.status === statusFilter;
    });
  }, [pipelines, statusFilter]);

  const stats = useMemo(
    () => ({
      total: pipelines.length,
      running: pipelines.filter((p) => p.status === "running").length,
      failed: pipelines.filter((p) => p.status === "error").length,
      paused: pipelines.filter((p) => p.status === "paused").length,
    }),
    [pipelines]
  );

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
        await integrationApi.updatePipeline(editingPipeline.id, {
          name: formData.name,
          description: formData.description,
          schedule: formData.schedule || undefined,
        });
        toast.success("Pipeline updated successfully");
      } else {
        const createData: CreatePipelineData = {
          name: formData.name,
          description: formData.description,
          source: formData.source,
          destination: formData.source,
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
      await loadPipelines();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Failed to save pipeline:", error);
      toast.error(error.message || "Failed to save pipeline");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPipeline = useCallback((pipeline: Pipeline) => {
    setEditingPipeline(pipeline);
    const lakehouseConfig = pipeline.config?.lakehouse;
    setFormData({
      name: pipeline.name,
      description: pipeline.description || "",
      source: pipeline.source || "",
      layer: lakehouseConfig?.layer || "bronze",
      namespace: lakehouseConfig?.namespace || "",
      table_name:
        lakehouseConfig?.table_name || pipeline.config?.table_name || "",
      schedule: pipeline.schedule || "",
    });
    setIsCreateDialogOpen(true);
  }, []);

  const handleDeletePipeline = async () => {
    if (!pipelineToDelete) return;
    setIsLoading(true);
    try {
      await integrationApi.deletePipeline(pipelineToDelete);
      toast.success("Pipeline deleted successfully");
      await loadPipelines();
      setPipelineToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete pipeline:", error);
      toast.error(error.message || "Failed to delete pipeline");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunPipeline = useCallback(async (id: string) => {
    try {
      await integrationApi.triggerPipeline(id);
      toast.success("Pipeline triggered successfully");
      loadPipelines();
    } catch (error: any) {
      toast.error(error.message || "Failed to trigger pipeline");
    }
  }, []);

  const handlePausePipeline = useCallback(async (id: string) => {
    try {
      await integrationApi.pausePipeline(id);
      toast.success("Pipeline paused successfully");
      loadPipelines();
    } catch (error: any) {
      toast.error(error.message || "Failed to pause pipeline");
    }
  }, []);

  const handleResumePipeline = useCallback(async (id: string) => {
    try {
      await integrationApi.resumePipeline(id);
      toast.success("Pipeline resumed successfully");
      loadPipelines();
    } catch (error: any) {
      toast.error(error.message || "Failed to resume pipeline");
    }
  }, []);

  const handleViewStats = useCallback(async (id: string) => {
    try {
      const stats = await integrationApi.getPipelineStats(id);
      toast.message(JSON.stringify(stats, null, 2));
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch stats");
    }
  }, []);

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

  const columns = useMemo<ColDef<Pipeline>[]>(
    () => [
      {
        field: "name",
        headerName: "Pipeline",
        flex: 2,
        minWidth: 200,
        cellRenderer: (params: any) => (
          <div className="flex flex-col py-2">
            <span className="font-medium">{params.value}</span>
            {params.data?.description && (
              <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                {params.data.description}
              </span>
            )}
          </div>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        cellRenderer: (params: any) => {
          const status = params.value as PipelineStatus;
          const config = statusConfig[status] || statusConfig.idle;
          return (
            <Badge variant={config.variant} className="capitalize">
              {config.label}
            </Badge>
          );
        },
      },
      {
        field: "source_name",
        headerName: "Source",
        flex: 1,
        minWidth: 120,
        valueFormatter: (params) => params.value || "N/A",
      },
      {
        field: "destination_name",
        headerName: "Destination",
        flex: 1,
        minWidth: 120,
        valueFormatter: (params) => params.value || "N/A",
      },
      {
        field: "schedule",
        headerName: "Schedule",
        width: 130,
        cellRenderer: (params: any) => (
          <span className="font-mono text-xs">{params.value || "Manual"}</span>
        ),
      },
      {
        field: "success_rate",
        headerName: "Success Rate",
        width: 120,
        cellRenderer: (params: any) => {
          const rate = params.value || 0;
          const color =
            rate >= 90
              ? "text-green-600"
              : rate >= 70
              ? "text-yellow-600"
              : "text-red-600";
          return <span className={`font-medium ${color}`}>{rate}%</span>;
        },
      },
      {
        field: "last_run",
        headerName: "Last Run",
        width: 150,
        cellRenderer: (params: any) => (
          <span className="text-xs text-muted-foreground">
            {params.value || "Never"}
          </span>
        ),
      },
      {
        field: "run_count",
        headerName: "Runs",
        width: 80,
        type: "numericColumn",
      },
      {
        colId: "actions",
        headerName: "",
        width: 100,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const pipeline = params.data as Pipeline;
          const isPaused = pipeline.status === "paused";
          const isRunning = pipeline.status === "running";

          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  if (isPaused) handleResumePipeline(pipeline.id);
                  else if (isRunning) handlePausePipeline(pipeline.id);
                  else handleRunPipeline(pipeline.id);
                }}
              >
                {isRunning ? (
                  <IconPlayerPause className="h-4 w-4" />
                ) : (
                  <IconPlayerPlay className="h-4 w-4" />
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <IconDotsVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/data-integration/pipelines/builder?pipelineId=${pipeline.id}`}
                    >
                      <IconEye className="mr-2 h-4 w-4" />
                      View in Builder
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleViewStats(pipeline.id)}
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
                  <DropdownMenuItem>
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
          );
        },
      },
    ],
    [
      handleRunPipeline,
      handlePausePipeline,
      handleResumePipeline,
      handleEditPipeline,
      handleViewStats,
    ]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipelines"
        description="Manage your data integration pipelines"
        icon={IconArrowsTransferDown}
        breadcrumbs={[
          { label: "Data Integration", href: "/data-integration" },
          { label: "Pipelines" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/data-integration/pipelines/builder">
                Open Builder
              </Link>
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <IconPlus className="mr-2 h-4 w-4" />
              Create Pipeline
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-sm font-medium text-muted-foreground">
              Total Pipelines
            </div>
            <div className="text-3xl font-bold mt-1">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-sm font-medium text-muted-foreground">
              Running
            </div>
            <div className="text-3xl font-bold mt-1 text-blue-500">
              {stats.running}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-sm font-medium text-muted-foreground">
              Failed
            </div>
            <div className="text-3xl font-bold mt-1 text-red-500">
              {stats.failed}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-sm font-medium text-muted-foreground">
              Paused
            </div>
            <div className="text-3xl font-bold mt-1 text-muted-foreground">
              {stats.paused}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Grid */}
      <DataGrid
        data={filteredPipelines}
        columns={columns}
        loading={isFetching}
        onRefresh={loadPipelines}
        pagination
        pageSize={20}
        height={500}
        quickFilterPlaceholder="Search pipelines..."
        exportFileName="pipelines"
        emptyMessage="No pipelines found. Create your first pipeline to get started."
        toolbar={
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
        }
      />

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
          className="!w-[70%] !max-w-none max-h-[90vh] overflow-y-auto sm:!max-w-[70%]"
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
                : "Create a pipeline to sync data from a source to your Lakehouse."}
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
                <Label htmlFor="source">Source *</Label>
                <Select
                  value={formData.source || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, source: value })
                  }
                  disabled={!!editingPipeline}
                >
                  <SelectTrigger id="source">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        No sources available
                      </SelectItem>
                    ) : (
                      sources.map((source) => (
                        <SelectItem key={source.id} value={String(source.id)}>
                          {source.name} ({source.type})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="layer">Lakehouse Layer *</Label>
                <Select
                  value={formData.layer}
                  onValueChange={(value) =>
                    setFormData({ ...formData, layer: value })
                  }
                >
                  <SelectTrigger id="layer">
                    <SelectValue placeholder="Select layer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bronze">🥉 Bronze (Raw)</SelectItem>
                    <SelectItem value="silver">🥈 Silver (Cleaned)</SelectItem>
                    <SelectItem value="gold">🥇 Gold (Business)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="namespace">Database / Namespace</Label>
                <Input
                  id="namespace"
                  placeholder="e.g., sales, marketing"
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
              </div>

              <div className="grid gap-2">
                <Label htmlFor="table_name">Table Name *</Label>
                <Input
                  id="table_name"
                  placeholder="e.g., customer_orders"
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
              </div>
            </div>

            <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
              <p className="text-xs font-medium text-primary mb-1">
                Full Iceberg Table Path:
              </p>
              <code className="text-sm font-mono">
                iceberg.{formData.layer}.{formData.namespace || "default"}.
                {formData.table_name || "table_name"}
              </code>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="schedule">Schedule (Optional)</Label>
              <Input
                id="schedule"
                placeholder="e.g., 0 * * * * (cron) or @hourly"
                value={formData.schedule}
                onChange={(e) =>
                  setFormData({ ...formData, schedule: e.target.value })
                }
              />
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
                isLoading ||
                !formData.name.trim() ||
                !formData.table_name.trim() ||
                (!editingPipeline && !formData.source)
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
    </div>
  );
}
