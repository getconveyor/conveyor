"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconPlus,
  IconSearch,
  IconPlayerPlay,
  IconDotsVertical,
  IconClock,
  IconRefresh,
  IconTerminal,
  IconTrash,
  IconEye,
  IconAlertCircle,
  IconLoader2,
  IconPlayerPause,
  IconNotebook,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import {
  useJobs,
  useSchedulableNotebooks,
  useRunNotebook,
} from "@/hooks/use-transformation";
import { Notebook } from "@/lib/api/transformation";
import { toast } from "sonner";
import Link from "next/link";

type JobStatus = "running" | "completed" | "failed" | "queued" | "idle";

interface Job {
  id: string;
  name: string;
  notebook_id: string;
  language: string;
  framework: string;
  status: JobStatus;
  startTime: string;
  lastExecuted: string | null;
  cellCount: number;
}

const mapNotebookToJob = (notebook: Notebook): Job => {
  const status: JobStatus =
    notebook.status === "running"
      ? "running"
      : notebook.status === "error"
      ? "failed"
      : notebook.last_executed
      ? "completed"
      : "idle";

  return {
    id: notebook.id,
    name: notebook.name,
    notebook_id: notebook.id,
    language: notebook.language,
    framework: notebook.framework,
    status,
    startTime: notebook.last_executed
      ? new Date(notebook.last_executed).toLocaleString()
      : "-",
    lastExecuted: notebook.last_executed,
    cellCount: notebook.cell_count,
  };
};

const statusConfig: Record<
  JobStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  running: { label: "Running", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
  failed: { label: "Failed", variant: "destructive" },
  queued: { label: "Queued", variant: "secondary" },
  idle: { label: "Idle", variant: "secondary" },
};

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isRunJobDialogOpen, setIsRunJobDialogOpen] = useState(false);
  const [jobToCancel, setJobToCancel] = useState<string | null>(null);
  const [selectedNotebook, setSelectedNotebook] = useState("");

  // Use hooks instead of manual loading
  const {
    data: jobsData = [],
    isLoading: jobsLoading,
    error: jobsError,
    refetch: refetchJobs,
  } = useJobs();
  const {
    data: notebooksData = [],
    isLoading: notebooksLoading,
    error: notebooksError,
  } = useSchedulableNotebooks();
  const runNotebookMutation = useRunNotebook();

  // Convert notebooks to jobs
  const jobs = jobsData.map(mapNotebookToJob);
  const notebooks = notebooksData;

  const isLoading = jobsLoading || notebooksLoading;
  const error = jobsError || notebooksError;

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.language.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: jobs.length,
    running: jobs.filter((j) => j.status === "running").length,
    completed: jobs.filter((j) => j.status === "completed").length,
    failed: jobs.filter((j) => j.status === "failed").length,
  };

  const handleRunJob = async () => {
    if (!selectedNotebook) return;

    try {
      await runNotebookMutation.mutateAsync(selectedNotebook);
      setIsRunJobDialogOpen(false);
      setSelectedNotebook("");
    } catch (err) {
      console.error("Failed to run notebook:", err);
      toast.error("Failed to start notebook execution");
    }
  };

  const handleCancelJob = async () => {
    if (!jobToCancel) return;

    // Note: Currently there's no cancel endpoint, so we just close the dialog
    // In a real implementation, you'd call an API to cancel the job
    setJobToCancel(null);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Transformation Jobs</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and manage notebook transformation executions
          </p>
        </div>
        <Button onClick={() => setIsRunJobDialogOpen(true)}>
          <IconPlayerPlay className="mr-2 h-4 w-4" />
          Run Notebook
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

      {/* Filters and Jobs */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
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
                  <SelectItem value="idle">Idle</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetchJobs()}
                disabled={isLoading}
              >
                <IconRefresh
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {error && (
            <div className="flex items-center gap-2 text-destructive mb-4 p-3 bg-destructive/10 rounded-md">
              <IconAlertCircle className="h-4 w-4" />
              <span className="text-sm">
                {error.message || "An error occurred"}
              </span>
            </div>
          )}
          {isLoading && jobs.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <IconNotebook className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No transformation jobs found
              </p>
              <p className="text-sm text-muted-foreground">
                Run a notebook to see execution history here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredJobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <IconNotebook className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold text-sm">{job.name}</h3>
                          <Badge
                            variant={statusConfig[job.status].variant}
                            className="text-xs"
                          >
                            {statusConfig[job.status].label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {job.language} • {job.framework} • {job.cellCount}{" "}
                          cells
                        </p>
                        {job.status === "running" && (
                          <div className="mb-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">
                                Executing...
                              </span>
                              <IconLoader2 className="h-3 w-3 animate-spin" />
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary animate-pulse"
                                style={{ width: "60%" }}
                              />
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                          <div>
                            <p className="text-muted-foreground">
                              Last Executed
                            </p>
                            <p className="font-medium">{job.startTime}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Language</p>
                            <p className="font-medium capitalize">
                              {job.language}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Framework</p>
                            <p className="font-medium capitalize">
                              {job.framework}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {job.status === "running" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => setJobToCancel(job.id)}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <IconPlayerPause className="h-3.5 w-3.5 mr-1" />
                                Cancel
                              </>
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
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/data-transformation/notebooks/${job.notebook_id}`}
                              >
                                <IconEye className="mr-2 h-4 w-4" />
                                View Notebook
                              </Link>
                            </DropdownMenuItem>
                            {job.status === "failed" && (
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/data-transformation/notebooks/${job.notebook_id}`}
                                >
                                  <IconAlertCircle className="mr-2 h-4 w-4" />
                                  View Error
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {(job.status === "completed" ||
                              job.status === "failed" ||
                              job.status === "idle") && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    runNotebookMutation.mutate(job.notebook_id);
                                  }}
                                >
                                  <IconPlayerPlay className="mr-2 h-4 w-4" />
                                  Run Again
                                </DropdownMenuItem>
                              </>
                            )}
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

      {/* Run Job Dialog */}
      <Dialog
        open={isRunJobDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsRunJobDialogOpen(false);
            setSelectedNotebook("");
          }
        }}
        modal
      >
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Run Notebook</DialogTitle>
            <DialogDescription>
              Select a notebook to execute as a transformation job
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="notebook">Notebook</Label>
              <Select
                value={selectedNotebook}
                onValueChange={setSelectedNotebook}
              >
                <SelectTrigger id="notebook">
                  <SelectValue placeholder="Select notebook" />
                </SelectTrigger>
                <SelectContent>
                  {notebooks.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No notebooks available
                    </SelectItem>
                  ) : (
                    notebooks.map((notebook) => (
                      <SelectItem key={notebook.id} value={notebook.id}>
                        {notebook.name} ({notebook.language})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRunJobDialogOpen(false);
                setSelectedNotebook("");
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRunJob}
              disabled={!selectedNotebook || isLoading}
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <IconPlayerPlay className="mr-2 h-4 w-4" />
                  Run Notebook
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Job Confirmation Dialog */}
      <AlertDialog
        open={!!jobToCancel}
        onOpenChange={(open) => !open && setJobToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop the job execution. The job will be marked as
              failed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Keep Running
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelJob} disabled={isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Job"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
