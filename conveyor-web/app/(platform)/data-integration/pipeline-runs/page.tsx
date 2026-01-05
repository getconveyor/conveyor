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
} from "@tabler/icons-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { integrationApi, PipelineRun, Pipeline } from "@/lib/api/integration";
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
import { formatDistanceToNow } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { DataGrid } from "@/components/data-grid";

type RunStatus = "pending" | "running" | "success" | "failed" | "cancelled";

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
  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

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
    if (currentWorkspace) {
      loadRuns();
      loadPipelines();
    }
  }, [currentWorkspace]);

  async function loadRuns() {
    if (!currentWorkspace) return;
    try {
      setIsFetching(true);
      const data = await integrationApi.getPipelineRuns();
      setRuns(data);
    } catch (error: any) {
      console.error("Failed to load pipeline runs:", error);
      toast.error(error.message || "Failed to load pipeline runs");
    } finally {
      setIsFetching(false);
    }
  }

  async function loadPipelines() {
    if (!currentWorkspace) return;
    try {
      const data = await integrationApi.getPipelines();
      setPipelines(data);
    } catch (error: any) {
      console.error("Failed to load pipelines:", error);
    }
  }

  const handleCancelRun = async () => {
    if (!runToCancel) return;
    setIsLoading(true);
    try {
      await integrationApi.cancelPipelineRun(runToCancel);
      toast.success("Pipeline run cancelled successfully");
      await loadRuns();
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
                  <DropdownMenuItem disabled>View Details</DropdownMenuItem>
                  <DropdownMenuItem disabled>View Logs</DropdownMenuItem>
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
        onRefresh={loadRuns}
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
    </div>
  );
}
