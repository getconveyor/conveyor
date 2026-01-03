"use client";

import { useState, useEffect } from "react";
import {
  IconSearch,
  IconRefresh,
  IconTrash,
  IconClock,
  IconDotsVertical,
  IconCircleCheck,
  IconCircleX,
  IconLoader2,
  IconAlertCircle,
  IconStopwatch,
} from "@tabler/icons-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { integrationApi, PipelineRun, Pipeline } from "@/lib/api/integration";
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
  DropdownMenuSeparator,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pipelineFilter, setPipelineFilter] = useState<string>("all");
  const [runToCancel, setRunToCancel] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const filteredRuns = runs.filter((run) => {
    const matchesSearch =
      run.pipeline_name?.toLowerCase().includes(searchQuery.toLowerCase()) ??
      false;
    const matchesStatus = statusFilter === "all" || run.status === statusFilter;
    const matchesPipeline =
      pipelineFilter === "all" || run.pipeline === pipelineFilter;
    return matchesSearch && matchesStatus && matchesPipeline;
  });

  const stats = {
    total: runs.length,
    running: runs.filter((r) => r.status === "running").length,
    success: runs.filter((r) => r.status === "success").length,
    failed: runs.filter((r) => r.status === "failed").length,
  };

  // Load pipeline runs from API
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
      toast.error(error.message || "Failed to load pipelines");
    }
  }

  const handleCancelRun = async () => {
    if (!runToCancel) return;

    setIsLoading(true);
    try {
      await integrationApi.cancelPipelineRun(runToCancel);
      toast.success("Pipeline run cancelled successfully");

      // Reload runs after cancellation
      await loadRuns();

      setRunToCancel(null);
    } catch (error: any) {
      console.error("Failed to cancel pipeline run:", error);
      toast.error(error.message || "Failed to cancel pipeline run");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline Runs</h1>
          <p className="text-sm text-muted-foreground">
            View and manage pipeline execution history
          </p>
        </div>
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
              Success
            </div>
            <div className="text-xl font-bold text-green-500">
              {stats.success}
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
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search pipeline runs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
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
              <Button
                variant="outline"
                size="icon"
                onClick={loadRuns}
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
          {isFetching && runs.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <IconLoader2 className="h-6 w-6 animate-spin mr-2" />
              Loading pipeline runs...
            </div>
          ) : filteredRuns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <IconStopwatch className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">No pipeline runs found</p>
              <p className="text-xs mt-1">
                Run a pipeline to see execution history
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRuns.map((run) => (
                <Card key={run.id}>
                  <CardContent className="p-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            {statusConfig[run.status].icon}
                            <h3 className="font-semibold text-sm">
                              {run.pipeline_name || "Unknown"}
                            </h3>
                          </div>
                          <Badge
                            variant={statusConfig[run.status].variant}
                            className="text-xs"
                          >
                            {statusConfig[run.status].label}
                          </Badge>
                          {run.triggered_by && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-gray-50"
                            >
                              {run.triggered_by}
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs mb-2">
                          <div>
                            <p className="text-muted-foreground">Duration</p>
                            <p className="font-medium">
                              {formatDuration(run.duration)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Records</p>
                            <p className="font-medium">
                              {run.records_processed || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Bytes</p>
                            <p className="font-medium">
                              {run.bytes_processed
                                ? `${(
                                    run.bytes_processed /
                                    1024 /
                                    1024
                                  ).toFixed(2)} MB`
                                : "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Started</p>
                            <p className="font-medium">
                              {run.start_time
                                ? formatDistanceToNow(
                                    new Date(run.start_time),
                                    { addSuffix: true }
                                  )
                                : "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Completed</p>
                            <p className="font-medium">
                              {run.end_time
                                ? formatDistanceToNow(new Date(run.end_time), {
                                    addSuffix: true,
                                  })
                                : "In Progress"}
                            </p>
                          </div>
                        </div>
                        {run.errors && Object.keys(run.errors).length > 0 && (
                          <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                            <p className="text-xs font-medium text-red-700">
                              Errors:
                            </p>
                            <p className="text-xs text-red-600 mt-1">
                              {JSON.stringify(run.errors).substring(0, 100)}...
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {run.status === "running" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-destructive"
                            onClick={() => setRunToCancel(run.id)}
                            disabled={isLoading}
                            title="Cancel run"
                          >
                            {isLoading ? (
                              <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <IconCircleX className="h-3.5 w-3.5" />
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
                            <DropdownMenuItem disabled>
                              <IconStopwatch className="mr-2 h-4 w-4" />
                              View Details (Coming Soon)
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
    </>
  );
}
