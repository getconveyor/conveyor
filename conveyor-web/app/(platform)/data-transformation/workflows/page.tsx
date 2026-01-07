"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  IconPlus,
  IconSearch,
  IconPlayerPlay,
  IconPlayerPause,
  IconDotsVertical,
  IconClock,
  IconRefresh,
  IconSettings,
  IconTrash,
  IconCopy,
  IconCode,
  IconGitBranch,
  IconLoader2,
  IconAlertCircle,
} from "@tabler/icons-react";
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
import { usePipelines } from "@/hooks/use-pipelines";
import { Pipeline } from "@/lib/api/integration";

type WorkflowStatus = "running" | "idle" | "failed" | "success";

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  lastRun: string;
  nextRun: string;
  steps: number;
  successRate: number;
  schedule: string;
  createdBy: string;
}

const statusConfig: Record<
  WorkflowStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    color: string;
  }
> = {
  running: { label: "Running", variant: "default", color: "text-blue-500" },
  success: { label: "Success", variant: "outline", color: "text-green-500" },
  failed: { label: "Failed", variant: "destructive", color: "text-red-500" },
  idle: { label: "Idle", variant: "secondary", color: "text-gray-500" },
};

const mapPipelineToWorkflow = (pipeline: Pipeline): Workflow => {
  const status: WorkflowStatus =
    pipeline.status === "running"
      ? "running"
      : pipeline.status === "failed"
      ? "failed"
      : pipeline.status === "active"
      ? "success"
      : "idle";

  return {
    id: pipeline.id,
    name: pipeline.name,
    description:
      pipeline.description ||
      `Pipeline from ${pipeline.source_name || "source"} to ${
        pipeline.destination_name || "destination"
      }`,
    status,
    lastRun: pipeline.last_run
      ? new Date(pipeline.last_run).toLocaleString()
      : "Never",
    nextRun: pipeline.next_run
      ? new Date(pipeline.next_run).toLocaleString()
      : "Not scheduled",
    steps: 1, // Pipelines are single-step
    successRate: pipeline.success_rate || 0,
    schedule: pipeline.schedule || "Manual",
    createdBy: pipeline.created_by || "System",
  };
};

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    schedule: "",
    template: "",
  });

  // Use hook instead of manual loading
  const {
    data: pipelines = [],
    isLoading: pipelinesLoading,
    error: pipelinesError,
  } = usePipelines();

  // Update local state when hook data changes
  useEffect(() => {
    if (pipelines.length >= 0) {
      setWorkflows(pipelines.map(mapPipelineToWorkflow));
      setIsLoading(false);
    }
    if (pipelinesError) {
      setError("Failed to load workflows");
      setIsLoading(false);
    }
  }, [pipelines, pipelinesError]);

  const loadWorkflows = useCallback(async () => {
    // No longer needed - hook handles this
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch =
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || workflow.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: workflows.length,
    running: workflows.filter((w) => w.status === "running").length,
    failed: workflows.filter((w) => w.status === "failed").length,
    avgSuccessRate:
      workflows.length > 0
        ? Math.round(
            workflows.reduce((acc, w) => acc + w.successRate, 0) /
              workflows.length
          )
        : 0,
  };

  const handleCreateOrUpdateWorkflow = () => {
    if (!formData.name.trim()) return;

    // Store workflow data in sessionStorage and navigate to builder
    sessionStorage.setItem(
      "new-workflow-template",
      JSON.stringify({
        name: formData.name,
        description: formData.description,
        schedule: formData.schedule,
        template: formData.template || "blank",
      })
    );

    // Navigate to builder
    router.push("/data-transformation/workflows/new/builder");
  };

  const handleCreateOrUpdateWorkflowOld = async () => {
    if (!formData.name.trim() || !formData.schedule) return;

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (editingWorkflow) {
      // Update existing workflow
      setWorkflows((workflows) =>
        workflows.map((w) =>
          w.id === editingWorkflow.id
            ? {
                ...w,
                name: formData.name,
                description: formData.description,
                schedule: formData.schedule,
                lastRun: "Just now",
              }
            : w
        )
      );
    } else {
      // Create new workflow
      const newWorkflow: Workflow = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        status: "idle",
        lastRun: "Never",
        nextRun: "Not scheduled",
        steps:
          formData.template === "blank" ? 0 : Math.floor(Math.random() * 8) + 3,
        successRate: 0,
        schedule: formData.schedule,
        createdBy: "You",
      };
      setWorkflows([...workflows, newWorkflow]);
    }

    setIsLoading(false);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    // Navigate to builder page for this workflow
    router.push(`/data-transformation/workflows/${workflow.id}/builder`);
  };

  const handleDeleteWorkflow = async () => {
    if (!workflowToDelete) return;

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    setWorkflows((workflows) =>
      workflows.filter((w) => w.id !== workflowToDelete)
    );
    setIsLoading(false);
    setWorkflowToDelete(null);
  };

  const handleTogglePlayPause = async (id: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 600));

    setWorkflows((workflows) =>
      workflows.map((w) =>
        w.id === id
          ? {
              ...w,
              status: w.status === "running" ? "idle" : "running",
              lastRun: w.status !== "running" ? "Just now" : w.lastRun,
              nextRun: w.status !== "running" ? "Continuous" : "Not scheduled",
            }
          : w
      )
    );
    setIsLoading(false);
  };

  const handleDuplicateWorkflow = async (workflow: Workflow) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    const duplicatedWorkflow: Workflow = {
      ...workflow,
      id: Date.now().toString(),
      name: `${workflow.name} (Copy)`,
      status: "idle",
      lastRun: "Never",
      nextRun: "Not scheduled",
    };
    setWorkflows([...workflows, duplicatedWorkflow]);
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      schedule: "",
      template: "",
    });
    setEditingWorkflow(null);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Workflows</h1>
          <p className="text-sm text-muted-foreground">
            Design and manage data transformation workflows
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Create Workflow
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
              Avg Success
            </div>
            <div className="text-xl font-bold text-green-500">
              {stats.avgSuccessRate}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Workflows */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search workflows..."
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
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <IconRefresh className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-2">
            {filteredWorkflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardContent className="p-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <IconGitBranch className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">
                          {workflow.name}
                        </h3>
                        <Badge
                          variant={statusConfig[workflow.status].variant}
                          className="text-xs"
                        >
                          {statusConfig[workflow.status].label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {workflow.description}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Steps</p>
                          <p className="font-medium">{workflow.steps}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Schedule</p>
                          <p className="font-medium">{workflow.schedule}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Run</p>
                          <p className="font-medium">{workflow.lastRun}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Next Run</p>
                          <p className="font-medium">{workflow.nextRun}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Success Rate</p>
                          <p className="font-medium">{workflow.successRate}%</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {workflow.status === "running" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleTogglePlayPause(workflow.id)}
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
                          onClick={() => handleTogglePlayPause(workflow.id)}
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
                          <DropdownMenuItem
                            onClick={() => handleEditWorkflow(workflow)}
                          >
                            <IconCode className="mr-2 h-4 w-4" />
                            Edit Workflow
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <IconClock className="mr-2 h-4 w-4" />
                            View History
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicateWorkflow(workflow)}
                          >
                            <IconCopy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setWorkflowToDelete(workflow.id)}
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
        </CardContent>
      </Card>

      {/* Create/Edit Workflow Dialog */}
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
          className="max-w-2xl"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {editingWorkflow ? "Edit Workflow" : "Create Workflow"}
            </DialogTitle>
            <DialogDescription>
              {editingWorkflow
                ? "Update the workflow configuration."
                : "Design a new data transformation workflow with multiple steps"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="workflow-name">Workflow Name</Label>
              <Input
                id="workflow-name"
                placeholder="e.g., Customer Data ETL"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="workflow-description">Description</Label>
              <Textarea
                id="workflow-description"
                placeholder="Describe what this workflow does..."
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="schedule-type">Schedule Type</Label>
                <Select
                  value={formData.schedule}
                  onValueChange={(value) =>
                    setFormData({ ...formData, schedule: value })
                  }
                >
                  <SelectTrigger id="schedule-type">
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hourly">Hourly</SelectItem>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Custom (Cron)">Custom (Cron)</SelectItem>
                    <SelectItem value="Real-time">Real-time</SelectItem>
                    <SelectItem value="Manual">Manual Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!editingWorkflow && (
                <div className="grid gap-2">
                  <Label htmlFor="template">Template</Label>
                  <Select
                    value={formData.template}
                    onValueChange={(value) =>
                      setFormData({ ...formData, template: value })
                    }
                  >
                    <SelectTrigger id="template">
                      <SelectValue placeholder="Start from template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blank">Blank Workflow</SelectItem>
                      <SelectItem value="etl">ETL Pipeline</SelectItem>
                      <SelectItem value="data-quality">
                        Data Quality Check
                      </SelectItem>
                      <SelectItem value="aggregation">
                        Data Aggregation
                      </SelectItem>
                      <SelectItem value="streaming">
                        Stream Processing
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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
              onClick={handleCreateOrUpdateWorkflow}
              disabled={!formData.name.trim()}
            >
              Continue to Builder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!workflowToDelete}
        onOpenChange={(open) => !open && setWorkflowToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this workflow. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkflow}
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
