"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconRefresh,
  IconBook,
  IconTrash,
  IconCopy,
  IconDownload,
  IconPlayerPlay,
  IconCode,
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
import { toast } from "sonner";
import { transformationApi, Notebook } from "@/lib/api/transformation";

export default function NotebooksPage() {
  const router = useRouter();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [frameworkFilter, setFrameworkFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [notebookToDelete, setNotebookToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    framework: "scikit-learn",
  });

  const fetchNotebooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: { framework?: string } = {};
      if (frameworkFilter && frameworkFilter !== "all") {
        params.framework = frameworkFilter;
      }
      const data = await transformationApi.getNotebooks(params);
      setNotebooks(data);
    } catch (error: any) {
      console.error("Failed to fetch notebooks:", error);
      toast.error("Failed to load notebooks", {
        description: error.message || "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  }, [frameworkFilter]);

  useEffect(() => {
    fetchNotebooks();
  }, [fetchNotebooks]);

  const filteredNotebooks = notebooks.filter((notebook) => {
    const matchesSearch =
      notebook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notebook.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: notebooks.length,
    sklearn: notebooks.filter((n) => n.framework === "scikit-learn").length,
    tensorflow: notebooks.filter((n) => n.framework === "tensorflow").length,
    pytorch: notebooks.filter((n) => n.framework === "pytorch").length,
  };

  const handleCreateNotebook = async () => {
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const newNotebook = await transformationApi.createNotebook({
        name: formData.name,
        description: formData.description,
        language: "python",
        framework: formData.framework,
      });

      toast.success("Notebook created", {
        description: `"${newNotebook.name}" has been created successfully`,
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchNotebooks();

      // Navigate to the notebook editor
      router.push(`/data-science/notebooks/${newNotebook.id}`);
    } catch (error: any) {
      console.error("Failed to create notebook:", error);
      toast.error("Failed to create notebook", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenNotebook = (notebook: Notebook) => {
    router.push(`/data-science/notebooks/${notebook.id}`);
  };

  const handleRunNotebook = async (notebook: Notebook) => {
    try {
      toast.info("Running notebook...", {
        description: `Executing all cells in "${notebook.name}"`,
      });

      await transformationApi.runNotebook(notebook.id);

      toast.success("Notebook executed", {
        description: `"${notebook.name}" has finished running`,
      });

      fetchNotebooks();
    } catch (error: any) {
      console.error("Failed to run notebook:", error);
      toast.error("Failed to run notebook", {
        description: error.message || "Please try again",
      });
    }
  };

  const handleDuplicateNotebook = async (notebook: Notebook) => {
    try {
      const duplicated = await transformationApi.duplicateNotebook(notebook.id);

      toast.success("Notebook duplicated", {
        description: `Created "${duplicated.name}"`,
      });

      fetchNotebooks();
    } catch (error: any) {
      console.error("Failed to duplicate notebook:", error);
      toast.error("Failed to duplicate notebook", {
        description: error.message || "Please try again",
      });
    }
  };

  const handleExportNotebook = async (notebook: Notebook) => {
    try {
      const data = await transformationApi.exportNotebook(notebook.id);

      const blob = new Blob([JSON.stringify(data.content, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        data.filename || `${notebook.name.replace(/\s+/g, "_")}.ipynb`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("Notebook exported", {
        description: `Downloaded "${notebook.name}"`,
      });
    } catch (error: any) {
      console.error("Failed to export notebook:", error);
      toast.error("Failed to export notebook", {
        description: error.message || "Please try again",
      });
    }
  };

  const handleDeleteNotebook = async () => {
    if (!notebookToDelete) return;

    setIsSubmitting(true);
    try {
      await transformationApi.deleteNotebook(notebookToDelete);

      toast.success("Notebook deleted", {
        description: "The notebook has been permanently deleted",
      });

      setNotebookToDelete(null);
      fetchNotebooks();
    } catch (error: any) {
      console.error("Failed to delete notebook:", error);
      toast.error("Failed to delete notebook", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      framework: "scikit-learn",
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getFrameworkBadgeColor = (framework: string) => {
    switch (framework) {
      case "scikit-learn":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "tensorflow":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "pytorch":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "huggingface":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "xgboost":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">ML Notebooks</h1>
          <p className="text-sm text-muted-foreground">
            Interactive notebooks for machine learning experiments
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Create Notebook
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
              Scikit-Learn
            </div>
            <div className="text-xl font-bold text-blue-500">
              {stats.sklearn}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              TensorFlow
            </div>
            <div className="text-xl font-bold text-orange-500">
              {stats.tensorflow}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              PyTorch
            </div>
            <div className="text-xl font-bold text-red-500">
              {stats.pytorch}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Notebooks */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search notebooks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={frameworkFilter}
                onValueChange={setFrameworkFilter}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Frameworks</SelectItem>
                  <SelectItem value="scikit-learn">Scikit-Learn</SelectItem>
                  <SelectItem value="tensorflow">TensorFlow</SelectItem>
                  <SelectItem value="pytorch">PyTorch</SelectItem>
                  <SelectItem value="huggingface">HuggingFace</SelectItem>
                  <SelectItem value="xgboost">XGBoost</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchNotebooks}
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotebooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconBook className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No notebooks found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? "Try a different search term"
                  : "Create your first ML notebook to get started"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Create Notebook
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {filteredNotebooks.map((notebook) => (
                <Card
                  key={notebook.id}
                  className="hover:border-primary/50 transition-colors"
                >
                  <CardContent className="p-2">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <IconBook className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm line-clamp-1">
                            {notebook.name}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`text-xs mt-0.5 ${getFrameworkBadgeColor(
                              notebook.framework
                            )}`}
                          >
                            {notebook.framework}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                          >
                            <IconDotsVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleOpenNotebook(notebook)}
                          >
                            <IconCode className="mr-2 h-4 w-4" />
                            Open Notebook
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRunNotebook(notebook)}
                          >
                            <IconPlayerPlay className="mr-2 h-4 w-4" />
                            Run All Cells
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicateNotebook(notebook)}
                          >
                            <IconCopy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleExportNotebook(notebook)}
                          >
                            <IconDownload className="mr-2 h-4 w-4" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setNotebookToDelete(notebook.id)}
                          >
                            <IconTrash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {notebook.description || "No description"}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Cells</p>
                        <p className="font-medium">{notebook.cell_count}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Modified</p>
                        <p className="font-medium">
                          {formatDate(notebook.updated_at)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Created by</p>
                        <p className="font-medium">
                          {notebook.created_by_name || "Unknown"}
                        </p>
                      </div>
                    </div>
                    {notebook.status === "running" && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-amber-500">
                        <IconLoader2 className="h-3 w-3 animate-spin" />
                        Running...
                      </div>
                    )}
                    {notebook.status === "error" && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-destructive">
                        <IconAlertCircle className="h-3 w-3" />
                        Error
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Notebook Dialog */}
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
            <DialogTitle>Create ML Notebook</DialogTitle>
            <DialogDescription>
              Create a new machine learning notebook
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="notebook-name">Notebook Name</Label>
              <Input
                id="notebook-name"
                placeholder="e.g., Customer Segmentation"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="framework">ML Framework</Label>
              <Select
                value={formData.framework}
                onValueChange={(value) =>
                  setFormData({ ...formData, framework: value })
                }
              >
                <SelectTrigger id="framework">
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scikit-learn">Scikit-Learn</SelectItem>
                  <SelectItem value="tensorflow">TensorFlow</SelectItem>
                  <SelectItem value="pytorch">PyTorch</SelectItem>
                  <SelectItem value="huggingface">HuggingFace</SelectItem>
                  <SelectItem value="xgboost">XGBoost</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what this notebook does..."
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateNotebook}
              disabled={!formData.name.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Notebook"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!notebookToDelete}
        onOpenChange={(open) => !open && setNotebookToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notebook?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this notebook and all its cells. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNotebook}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Notebook"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
