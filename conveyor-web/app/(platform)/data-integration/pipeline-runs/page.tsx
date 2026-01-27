"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  IconRefresh,
  IconClock,
  IconDotsVertical,
  IconCircleCheck,
  IconCircleX,
  IconLoader2,
  IconAlertCircle,
  IconHistory,
  IconEye,
  IconFileText,
  IconX,
} from "@tabler/icons-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  usePipelineRuns,
  usePipelines,
  useCancelPipelineRun,
} from "@/hooks/use-integration";
import { PipelineRun, Pipeline } from "@/lib/api/integration";
import { toast } from "sonner";
import { ColDef } from "ag-grid-community";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow, format } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { DataGrid } from "@/components/data-grid";

type RunStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "cancelled"
  | "completed"
  | "completed_with_errors";

const statusConfig: Record<
  RunStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
  }
> = {
  pending: {
    label: "Pending",
    variant: "outline",
    icon: <IconClock className="h-4 w-4" />,
  },
  running: {
    label: "Running",
    variant: "secondary",
    icon: <IconLoader2 className="h-4 w-4 animate-spin" />,
  },
  success: {
    label: "Success",
    variant: "default",
    icon: <IconCircleCheck className="h-4 w-4" />,
  },
  completed: {
    label: "Completed",
    variant: "default",
    icon: <IconCircleCheck className="h-4 w-4" />,
  },
  completed_with_errors: {
    label: "Completed with Errors",
    variant: "outline",
    icon: <IconAlertCircle className="h-4 w-4 text-yellow-500" />,
  },
  failed: {
    label: "Failed",
    variant: "destructive",
    icon: <IconCircleX className="h-4 w-4" />,
  },
  cancelled: {
    label: "Cancelled",
    variant: "outline",
    icon: <IconAlertCircle className="h-4 w-4" />,
  },
};

export default function PipelineRunsPage() {
  const { currentWorkspace } = useWorkspace();
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pipelineFilter, setPipelineFilter] = useState<string>("all");
  const [runToCancel, setRunToCancel] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<PipelineRun | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Use hooks instead of manual loading
  const {
    data: runsData = [],
    isLoading: runsLoading,
    error: runsError,
    refetch: refetchRuns,
  } = usePipelineRuns();
  const {
    data: pipelinesData = [],
    isLoading: pipelinesLoading,
    error: pipelinesError,
  } = usePipelines();
  const cancelRunMutation = useCancelPipelineRun();

  // Update local state when hook data changes
  useEffect(() => {
    setRuns(runsData);
    setPipelines(pipelinesData);
    setIsFetching(runsLoading || pipelinesLoading);
    if (runsError || pipelinesError) {
      toast.error("Failed to load pipeline data");
    }
  }, [
    runsData,
    pipelinesData,
    runsLoading,
    pipelinesLoading,
    runsError,
    pipelinesError,
  ]);

  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      const matchesStatus =
        statusFilter === "all" || run.status === statusFilter;
      const matchesPipeline =
        pipelineFilter === "all" || run.pipeline === pipelineFilter;
      return matchesStatus && matchesPipeline;
    });
  }, [runs, statusFilter, pipelineFilter]);

  const stats = useMemo(
    () => ({
      total: runs.length,
      running: runs.filter((r) => r.status === "running").length,
      success: runs.filter((r) => r.status === "success").length,
      failed: runs.filter((r) => r.status === "failed").length,
    }),
    [runs]
  );

  useEffect(() => {
    // Data loading is now handled by hooks
  }, [currentWorkspace]);

  const handleCancelRun = async () => {
    if (!runToCancel) return;
    setIsLoading(true);
    try {
      await cancelRunMutation.mutateAsync(runToCancel);
      toast.success("Pipeline run cancelled successfully");
      setRunToCancel(null);
    } catch (error: any) {
      console.error("Failed to cancel pipeline run:", error);
      toast.error(error.message || "Failed to cancel pipeline run");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = useCallback((seconds: number | null) => {
    if (!seconds) return "N/A";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  }, []);

  const formatBytes = useCallback((bytes: number | null) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }, []);

  const columns = useMemo<ColDef<PipelineRun>[]>(
    () => [
      {
        field: "pipeline_name",
        headerName: "Pipeline",
        flex: 2,
        minWidth: 180,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-2">
            {statusConfig[params.data?.status as RunStatus]?.icon}
            <span className="font-medium">{params.value || "Unknown"}</span>
          </div>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        cellRenderer: (params: any) => {
          const status = params.value as RunStatus;
          const config = statusConfig[status] || statusConfig.pending;
          return (
            <Badge variant={config.variant} className="capitalize">
              {config.label}
            </Badge>
          );
        },
      },
      {
        field: "triggered_by",
        headerName: "Trigger",
        width: 120,
        cellRenderer: (params: any) => (
          <Badge variant="outline" className="text-xs">
            {params.value || "manual"}
          </Badge>
        ),
      },
      {
        field: "duration",
        headerName: "Duration",
        width: 100,
        valueFormatter: (params) => formatDuration(params.value),
      },
      {
        field: "records_processed",
        headerName: "Records",
        width: 100,
        type: "numericColumn",
        valueFormatter: (params) => (params.value || 0).toLocaleString(),
      },
      {
        field: "bytes_processed",
        headerName: "Data Size",
        width: 110,
        valueFormatter: (params) => formatBytes(params.value),
      },
      {
        field: "start_time",
        headerName: "Started",
        width: 150,
        cellRenderer: (params: any) => (
          <span className="text-xs text-muted-foreground">
            {params.value
              ? formatDistanceToNow(new Date(params.value), { addSuffix: true })
              : "N/A"}
          </span>
        ),
      },
      {
        field: "end_time",
        headerName: "Completed",
        width: 150,
        cellRenderer: (params: any) => (
          <span className="text-xs text-muted-foreground">
            {params.value
              ? formatDistanceToNow(new Date(params.value), { addSuffix: true })
              : "In Progress"}
          </span>
        ),
      },
      {
        colId: "actions",
        headerName: "",
        width: 80,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const run = params.data as PipelineRun;
          return (
            <div className="flex items-center gap-1">
              {run.status === "running" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => setRunToCancel(run.id)}
                  title="Cancel run"
                >
                  <IconCircleX className="h-4 w-4" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <IconDotsVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedRun(run);
                      setShowDetailsDialog(true);
                    }}
                  >
                    <IconEye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedRun(run);
                      setShowLogsDialog(true);
                    }}
                  >
                    <IconFileText className="h-4 w-4 mr-2" />
                    View Logs
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [formatDuration, formatBytes]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline Runs"
        description="View and manage pipeline execution history"
        icon={IconHistory}
        breadcrumbs={[
          { label: "Data Integration", href: "/data-integration" },
          { label: "Pipeline Runs" },
        ]}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-sm font-medium text-muted-foreground">
              Total Runs
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
              Success
            </div>
            <div className="text-3xl font-bold mt-1 text-green-500">
              {stats.success}
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
      </div>

      {/* Data Grid */}
      <DataGrid
        data={filteredRuns}
        columns={columns}
        loading={isFetching}
        onRefresh={() => refetchRuns()}
        pagination
        pageSize={20}
        height={500}
        quickFilterPlaceholder="Search pipeline runs..."
        exportFileName="pipeline-runs"
        emptyMessage="No pipeline runs found. Run a pipeline to see execution history."
        toolbar={
          <div className="flex items-center gap-2">
            <Select value={pipelineFilter} onValueChange={setPipelineFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pipeline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pipelines</SelectItem>
                {pipelines.map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Cancel Run Dialog */}
      <AlertDialog
        open={!!runToCancel}
        onOpenChange={(open) => !open && setRunToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Pipeline Run</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this pipeline run? The current
              operation will be stopped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Running</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelRun}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Run"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Run Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconEye className="h-5 w-5" />
              Run Details
            </DialogTitle>
            <DialogDescription>
              {selectedRun?.pipeline_name} - Run {selectedRun?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          {selectedRun && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {statusConfig[selectedRun.status as RunStatus]?.icon}
                    <Badge
                      variant={
                        statusConfig[selectedRun.status as RunStatus]
                          ?.variant || "outline"
                      }
                    >
                      {statusConfig[selectedRun.status as RunStatus]?.label ||
                        selectedRun.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Progress
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${selectedRun.progress || 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {selectedRun.progress || 0}%
                    </span>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Start Time
                  </p>
                  <p className="text-sm mt-1">
                    {selectedRun.start_time
                      ? format(new Date(selectedRun.start_time), "PPpp")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    End Time
                  </p>
                  <p className="text-sm mt-1">
                    {selectedRun.end_time
                      ? format(new Date(selectedRun.end_time), "PPpp")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Duration
                  </p>
                  <p className="text-sm mt-1">
                    {formatDuration(selectedRun.duration)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Triggered By
                  </p>
                  <p className="text-sm mt-1 capitalize">
                    {selectedRun.triggered_by || "-"}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Records Processed
                  </p>
                  <p className="text-sm mt-1">
                    {selectedRun.records_processed?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Bytes Processed
                  </p>
                  <p className="text-sm mt-1">
                    {formatBytes(selectedRun.bytes_processed ?? null)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Current Step
                  </p>
                  <p className="text-sm mt-1">
                    {selectedRun.current_step || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Error Count
                  </p>
                  <p className="text-sm mt-1">{selectedRun.error_count || 0}</p>
                </div>
              </div>
              {selectedRun.metrics &&
                Object.keys(selectedRun.metrics).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Metrics
                      </p>
                      <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
                        {JSON.stringify(selectedRun.metrics, null, 2)}
                      </pre>
                    </div>
                  </>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconFileText className="h-5 w-5" />
              Run Logs
            </DialogTitle>
            <DialogDescription>
              {selectedRun?.pipeline_name} - Run {selectedRun?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          {selectedRun && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    statusConfig[selectedRun.status as RunStatus]?.variant ||
                    "outline"
                  }
                >
                  {statusConfig[selectedRun.status as RunStatus]?.label ||
                    selectedRun.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {selectedRun.current_step}
                </span>
              </div>
              <ScrollArea className="h-[400px] rounded-md border">
                <div className="p-4 font-mono text-sm space-y-2">
                  {selectedRun.error_message ? (
                    <div className="text-destructive whitespace-pre-wrap">
                      <strong>Error:</strong>
                      <br />
                      {selectedRun.error_message}
                    </div>
                  ) : null}
                  {selectedRun.errors &&
                  Array.isArray(selectedRun.errors) &&
                  selectedRun.errors.length > 0
                    ? selectedRun.errors.map((error: any, index: number) => (
                        <div key={index} className="text-destructive">
                          [{index + 1}]{" "}
                          {typeof error === "string"
                            ? error
                            : JSON.stringify(error)}
                        </div>
                      ))
                    : null}
                  {!selectedRun.error_message &&
                    (!selectedRun.errors ||
                      (Array.isArray(selectedRun.errors) &&
                        selectedRun.errors.length === 0)) && (
                      <div className="text-muted-foreground">
                        <p>
                          Run started at{" "}
                          {selectedRun.start_time
                            ? format(new Date(selectedRun.start_time), "PPpp")
                            : "N/A"}
                        </p>
                        {selectedRun.current_step && (
                          <p>Current step: {selectedRun.current_step}</p>
                        )}
                        <p>Progress: {selectedRun.progress || 0}%</p>
                        <p>
                          Records processed:{" "}
                          {selectedRun.records_processed?.toLocaleString() || 0}
                        </p>
                        {selectedRun.end_time && (
                          <p>
                            Completed at{" "}
                            {format(new Date(selectedRun.end_time), "PPpp")}
                          </p>
                        )}
                        <p className="mt-4 text-muted-foreground/70">
                          No errors recorded for this run.
                        </p>
                      </div>
                    )}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
