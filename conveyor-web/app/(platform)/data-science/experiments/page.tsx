"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconRefresh,
  IconFlask,
  IconTrash,
  IconPlayerPlay,
  IconEye,
  IconCopy,
  IconLoader2,
  IconAlertCircle,
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
import { Textarea } from "@/components/ui/textarea";
import {
  dataScienceApi,
  Experiment as ApiExperiment,
} from "@/lib/api/datascience";

type ExperimentStatus = "running" | "completed" | "failed" | "draft";

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: ExperimentStatus;
  framework: string;
  runs: number;
  bestMetric: string;
  metricName: string;
  lastRun: string;
  createdBy: string;
  parameters: Record<string, string | number>;
}

const mapApiExperimentToExperiment = (exp: ApiExperiment): Experiment => {
  // Map API status to UI status - experiment status is "active" | "archived"
  // We'll show "active" as "completed" and "archived" as "draft" for UI purposes
  const status: ExperimentStatus =
    exp.status === "active" ? "completed" : "draft";

  return {
    id: exp.id,
    name: exp.name,
    description: exp.description || "",
    status,
    framework: exp.tags || "unknown",
    runs: exp.run_count || 0,
    bestMetric: "-",
    metricName: "metric",
    lastRun: exp.updated_at
      ? new Date(exp.updated_at).toLocaleString()
      : "Unknown",
    createdBy: exp.created_by_name || "System",
    parameters: {},
  };
};

const statusConfig: Record<
  ExperimentStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  running: { label: "Running", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
  failed: { label: "Failed", variant: "destructive" },
  draft: { label: "Draft", variant: "secondary" },
};

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [experimentToDelete, setExperimentToDelete] = useState<string | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    framework: "scikit-learn",
  });

  const loadExperiments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const apiExperiments = await dataScienceApi.getExperiments();
      setExperiments(apiExperiments.map(mapApiExperimentToExperiment));
    } catch (err) {
      console.error("Failed to load experiments:", err);
      setError("Failed to load experiments");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExperiments();
  }, [loadExperiments]);

  const filteredExperiments = experiments.filter((experiment) => {
    const matchesSearch =
      experiment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      experiment.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || experiment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: experiments.length,
    running: experiments.filter((e) => e.status === "running").length,
    completed: experiments.filter((e) => e.status === "completed").length,
    failed: experiments.filter((e) => e.status === "failed").length,
  };

  const handleCreateExperiment = async () => {
    if (!formData.name.trim()) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newExperiment: Experiment = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      status: "draft",
      framework: formData.framework,
      runs: 0,
      bestMetric: "-",
      metricName: "Accuracy",
      lastRun: "Never",
      createdBy: "Current User",
      parameters: {},
    };

    setExperiments([newExperiment, ...experiments]);
    setIsLoading(false);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleRunExperiment = async (experiment: Experiment) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setExperiments((experiments) =>
      experiments.map((e) =>
        e.id === experiment.id
          ? {
              ...e,
              status: "running" as ExperimentStatus,
              runs: e.runs + 1,
              lastRun: "Just now",
            }
          : e
      )
    );
    setIsLoading(false);
  };

  const handleDuplicateExperiment = async (experiment: Experiment) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const duplicatedExperiment: Experiment = {
      ...experiment,
      id: Date.now().toString(),
      name: `${experiment.name} (Copy)`,
      runs: 0,
      lastRun: "Never",
      status: "draft",
    };
    setExperiments([duplicatedExperiment, ...experiments]);
    setIsLoading(false);
  };

  const handleDeleteExperiment = async () => {
    if (!experimentToDelete) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    setExperiments((experiments) =>
      experiments.filter((e) => e.id !== experimentToDelete)
    );
    setIsLoading(false);
    setExperimentToDelete(null);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      framework: "scikit-learn",
    });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">ML Experiments</h1>
          <p className="text-sm text-muted-foreground">
            Track and compare machine learning experiments
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Create Experiment
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

      {/* Experiments List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search experiments..."
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
                  <SelectItem value="draft">Draft</SelectItem>
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
            {filteredExperiments.map((experiment) => (
              <Card key={experiment.id}>
                <CardContent className="p-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <IconFlask className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">
                          {experiment.name}
                        </h3>
                        <Badge
                          variant={statusConfig[experiment.status].variant}
                          className="text-xs"
                        >
                          {statusConfig[experiment.status].label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {experiment.framework}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {experiment.description}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Runs</p>
                          <p className="font-medium">{experiment.runs}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Best {experiment.metricName}
                          </p>
                          <p className="font-medium">{experiment.bestMetric}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Run</p>
                          <p className="font-medium">{experiment.lastRun}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Created By</p>
                          <p className="font-medium">{experiment.createdBy}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <p className="font-medium">
                            {statusConfig[experiment.status].label}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(experiment.status === "draft" ||
                        experiment.status === "completed" ||
                        experiment.status === "failed") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleRunExperiment(experiment)}
                          disabled={isLoading}
                        >
                          <IconPlayerPlay className="h-3.5 w-3.5 mr-1" />
                          Run
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
                            {isLoading ? (
                              <IconLoader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <IconDotsVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <IconEye className="mr-2 h-4 w-4" />
                            View Results
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleDuplicateExperiment(experiment)
                            }
                          >
                            <IconCopy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setExperimentToDelete(experiment.id)}
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

      {/* Create Experiment Dialog */}
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
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Create ML Experiment</DialogTitle>
            <DialogDescription>
              Create a new machine learning experiment
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="experiment-name">Experiment Name</Label>
              <Input
                id="experiment-name"
                placeholder="e.g., Churn Model Optimization"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="framework">Framework</Label>
              <Select
                value={formData.framework}
                onValueChange={(value) =>
                  setFormData({ ...formData, framework: value })
                }
              >
                <SelectTrigger id="framework">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scikit-learn">Scikit-Learn</SelectItem>
                  <SelectItem value="tensorflow">TensorFlow</SelectItem>
                  <SelectItem value="pytorch">PyTorch</SelectItem>
                  <SelectItem value="huggingface">HuggingFace</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the experiment..."
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
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
              onClick={handleCreateExperiment}
              disabled={!formData.name.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Experiment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!experimentToDelete}
        onOpenChange={(open) => !open && setExperimentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Experiment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this experiment and all its runs.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteExperiment}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Experiment"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
