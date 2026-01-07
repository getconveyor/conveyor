"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconSearch,
  IconRefresh,
  IconPlayerPlay,
  IconPlayerPause,
  IconX,
  IconCircleCheck,
  IconClock,
  IconDotsVertical,
  IconEye,
  IconTerminal,
  IconChevronRight,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  integrationApi,
  PipelineRun as ApiPipelineRun,
} from "@/lib/api/integration";
import { formatDistanceToNow } from "date-fns";

type RunStatus = "running" | "completed" | "failed" | "queued" | "cancelled";
type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

interface PipelineStep {
  id: string;
  name: string;
  status: StepStatus;
  duration: string;
  startTime: string;
  logs: string[];
}

interface PipelineRun {
  id: string;
  runNumber: number;
  workflow: string;
  status: RunStatus;
  startTime: string;
  duration: string;
  progress: number;
  recordsProcessed: string;
  triggeredBy: string;
  steps: PipelineStep[];
}

// Convert API PipelineRun to local PipelineRun type
function apiRunToLocalRun(run: ApiPipelineRun, index: number): PipelineRun {
  // Map API status to local status
  const statusMap: Record<string, RunStatus> = {
    pending: "queued",
    running: "running",
    success: "completed",
    failed: "failed",
    cancelled: "cancelled",
  };

  // Format duration
  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // Format records
  const formatRecords = (count: number | null): string => {
    if (!count) return "-";
    return count.toLocaleString();
  };

  // Calculate progress based on status
  const getProgress = (status: string): number => {
    switch (status) {
      case "success":
        return 100;
      case "failed":
        return 40;
      case "running":
        return 50;
      default:
        return 0;
    }
  };

  return {
    id: run.id,
    runNumber: index + 1,
    workflow: run.pipeline_name || "Pipeline",
    status: statusMap[run.status] || "queued",
    startTime: run.start_time
      ? formatDistanceToNow(new Date(run.start_time), { addSuffix: true })
      : "Pending",
    duration: formatDuration(run.duration),
    progress: getProgress(run.status),
    recordsProcessed: formatRecords(run.records_processed),
    triggeredBy:
      run.triggered_by === "manual"
        ? "User"
        : run.triggered_by === "schedule"
        ? "Schedule"
        : "API",
    steps: [], // Steps would come from a separate API call if available
  };
}

const statusConfig: Record<
  RunStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
  }
> = {
  running: {
    label: "Running",
    variant: "default",
    icon: <IconClock className="h-3 w-3 animate-pulse" />,
  },
  completed: {
    label: "Completed",
    variant: "outline",
    icon: <IconCircleCheck className="h-3 w-3" />,
  },
  failed: {
    label: "Failed",
    variant: "destructive",
    icon: <IconX className="h-3 w-3" />,
  },
  queued: {
    label: "Queued",
    variant: "secondary",
    icon: <IconClock className="h-3 w-3" />,
  },
  cancelled: {
    label: "Cancelled",
    variant: "secondary",
    icon: <IconX className="h-3 w-3" />,
  },
};

const stepStatusConfig: Record<
  StepStatus,
  { color: string; icon: React.ReactNode }
> = {
  pending: { color: "text-gray-400", icon: <IconClock className="h-4 w-4" /> },
  running: {
    color: "text-blue-500",
    icon: <IconClock className="h-4 w-4 animate-pulse" />,
  },
  completed: {
    color: "text-green-500",
    icon: <IconCircleCheck className="h-4 w-4" />,
  },
  failed: { color: "text-red-500", icon: <IconX className="h-4 w-4" /> },
  skipped: {
    color: "text-gray-400",
    icon: <IconChevronRight className="h-4 w-4" />,
  },
};

export default function PipelineRunsPage() {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRun, setSelectedRun] = useState<PipelineRun | null>(null);

  const fetchRuns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const apiRuns = await integrationApi.getPipelineRuns();
      setRuns(apiRuns.map((run, index) => apiRunToLocalRun(run, index)));
    } catch (err) {
      console.error("Failed to fetch pipeline runs:", err);
      setError("Failed to load pipeline runs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const handleCancelRun = async (runId: string) => {
    try {
      await integrationApi.cancelPipelineRun(runId);
      await fetchRuns();
    } catch (err) {
      console.error("Failed to cancel run:", err);
    }
  };

  const filteredRuns = runs.filter((run) => {
    const matchesSearch = run.workflow
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || run.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: runs.length,
    running: runs.filter((r) => r.status === "running").length,
    completed: runs.filter((r) => r.status === "completed").length,
    failed: runs.filter((r) => r.status === "failed").length,
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Pipeline Runs</h1>
            <p className="text-sm text-muted-foreground">
              Monitor and track workflow execution history
            </p>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Pipeline Runs</h1>
            <p className="text-sm text-muted-foreground">
              Monitor and track workflow execution history
            </p>
          </div>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchRuns} className="mt-4">
              <IconRefresh className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Pipeline Runs</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and track workflow execution history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchRuns}>
            <IconRefresh
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Total Runs
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
              Completed
            </div>
            <div className="text-xl font-bold text-green-500">
              {stats.completed}
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

      {/* Filters and Runs */}
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-2">
            {filteredRuns.map((run) => (
              <Card key={run.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <IconTerminal className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">
                          {run.workflow}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          #{run.runNumber}
                        </span>
                        <Badge
                          variant={statusConfig[run.status].variant}
                          className="text-xs"
                        >
                          {statusConfig[run.status].icon}
                          <span className="ml-1">
                            {statusConfig[run.status].label}
                          </span>
                        </Badge>
                      </div>

                      {run.status === "running" && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">
                              Progress
                            </span>
                            <span className="font-medium">{run.progress}%</span>
                          </div>
                          <Progress value={run.progress} className="h-1.5" />
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Started</p>
                          <p className="font-medium">{run.startTime}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">{run.duration}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Records</p>
                          <p className="font-medium">{run.recordsProcessed}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Triggered By</p>
                          <p className="font-medium">{run.triggeredBy}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Steps</p>
                          <p className="font-medium">
                            {
                              run.steps.filter((s) => s.status === "completed")
                                .length
                            }
                            /{run.steps.length}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => setSelectedRun(run)}
                      >
                        <IconEye className="h-3.5 w-3.5 mr-1" />
                        Details
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <IconTerminal className="mr-2 h-4 w-4" />
                            View Logs
                          </DropdownMenuItem>
                          {run.status === "running" && (
                            <DropdownMenuItem>
                              <IconPlayerPause className="mr-2 h-4 w-4" />
                              Pause Run
                            </DropdownMenuItem>
                          )}
                          {run.status === "failed" && (
                            <DropdownMenuItem>
                              <IconPlayerPlay className="mr-2 h-4 w-4" />
                              Retry Run
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <IconX className="mr-2 h-4 w-4" />
                            Cancel Run
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Run Details Dialog */}
      <Dialog open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRun?.workflow} #{selectedRun?.runNumber}
            </DialogTitle>
            <DialogDescription>
              Detailed execution information and step-by-step logs
            </DialogDescription>
          </DialogHeader>
          {selectedRun && (
            <div className="space-y-4">
              {/* Run Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge
                    variant={statusConfig[selectedRun.status].variant}
                    className="mt-1"
                  >
                    {statusConfig[selectedRun.status].icon}
                    <span className="ml-1">
                      {statusConfig[selectedRun.status].label}
                    </span>
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium mt-1">{selectedRun.duration}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Records Processed</p>
                  <p className="font-medium mt-1">
                    {selectedRun.recordsProcessed}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Triggered By</p>
                  <p className="font-medium mt-1">{selectedRun.triggeredBy}</p>
                </div>
              </div>

              {/* Steps */}
              <div>
                <h3 className="font-semibold mb-3">Execution Steps</h3>
                <div className="space-y-2">
                  {selectedRun.steps.map((step, index) => (
                    <Card key={step.id}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className={stepStatusConfig[step.status].color}>
                            {stepStatusConfig[step.status].icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">
                                {step.name}
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                {step.duration}
                              </span>
                            </div>
                            {step.logs.length > 0 && (
                              <div className="mt-2 p-2 rounded bg-muted/30 font-mono text-xs space-y-1">
                                {step.logs.map((log, i) => (
                                  <div
                                    key={i}
                                    className={
                                      log.includes("ERROR")
                                        ? "text-red-500"
                                        : ""
                                    }
                                  >
                                    {log}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
