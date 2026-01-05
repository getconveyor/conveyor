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
import { transformationApi, Notebook } from "@/lib/api/transformation";
import { toast } from "sonner";

export default function NotebooksPage() {
  const router = useRouter();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [notebookToDelete, setNotebookToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    language: "python",
  });

  const loadNotebooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: { language?: string } = {};
      if (languageFilter !== "all") {
        params.language = languageFilter;
      }
      const data = await transformationApi.getNotebooks(params);
      setNotebooks(data);
    } catch (error: any) {
      console.error("Failed to load notebooks:", error);
      toast.error(error.message || "Failed to load notebooks");
    } finally {
      setIsLoading(false);
    }
  }, [languageFilter]);

  useEffect(() => {
    loadNotebooks();
  }, [loadNotebooks]);

  const filteredNotebooks = notebooks.filter((notebook) => {
    const matchesSearch =
      notebook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notebook.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: notebooks.length,
    python: notebooks.filter((n) => n.language === "python").length,
    sql: notebooks.filter((n) => n.language === "sql").length,
    avgCells:
      notebooks.length > 0
        ? Math.round(
            notebooks.reduce((acc, n) => acc + n.cell_count, 0) /
              notebooks.length
          )
        : 0,
  };

  const handleCreateNotebook = async () => {
    if (!formData.name.trim()) return;

    setIsActionLoading(true);
    try {
      await transformationApi.createNotebook({
        name: formData.name,
        description: formData.description,
        language: formData.language,
      });
      toast.success("Notebook created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      await loadNotebooks();
    } catch (error: any) {
      console.error("Failed to create notebook:", error);
      toast.error(error.message || "Failed to create notebook");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRunNotebook = async (notebook: Notebook) => {
    setIsActionLoading(true);
    try {
      await transformationApi.runNotebook(notebook.id);
      toast.success("Notebook executed successfully");
      await loadNotebooks();
    } catch (error: any) {
      console.error("Failed to run notebook:", error);
      toast.error(error.message || "Failed to run notebook");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDuplicateNotebook = async (notebook: Notebook) => {
    setIsActionLoading(true);
    try {
      await transformationApi.duplicateNotebook(notebook.id);
      toast.success("Notebook duplicated successfully");
      await loadNotebooks();
    } catch (error: any) {
      console.error("Failed to duplicate notebook:", error);
      toast.error(error.message || "Failed to duplicate notebook");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleExportNotebook = async (notebook: Notebook) => {
    try {
      const exportData = await transformationApi.exportNotebook(notebook.id);

      // Create download link
      const blob = new Blob([JSON.stringify(exportData.content, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportData.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Notebook exported successfully");
    } catch (error: any) {
      console.error("Failed to export notebook:", error);
      toast.error(error.message || "Failed to export notebook");
    }
  };

  const handleDeleteNotebook = async () => {
    if (!notebookToDelete) return;

    setIsActionLoading(true);
    try {
      await transformationApi.deleteNotebook(notebookToDelete);
      toast.success("Notebook deleted successfully");
      setNotebookToDelete(null);
      await loadNotebooks();
    } catch (error: any) {
      console.error("Failed to delete notebook:", error);
      toast.error(error.message || "Failed to delete notebook");
    } finally {
      setIsActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      language: "python",
    });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notebooks</h1>
          <p className="text-sm text-muted-foreground">
            Interactive notebooks for data exploration and transformation
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
              Python
            </div>
            <div className="text-xl font-bold text-blue-500">
              {stats.python}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              SQL
            </div>
            <div className="text-xl font-bold text-orange-500">{stats.sql}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Avg Cells
            </div>
            <div className="text-xl font-bold">{stats.avgCells}</div>
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
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={loadNotebooks}
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
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotebooks.map((notebook) => (
              <Card key={notebook.id}>
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
                        <Badge variant="secondary" className="text-xs mt-0.5">
                          {notebook.kernel}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          disabled={isActionLoading}
                        >
                          {isActionLoading ? (
                            <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <IconDotsVertical className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/data-transformation/notebooks/${notebook.id}`
                            )
                          }
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
                    {notebook.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Cells</p>
                      <p className="font-medium">{notebook.cell_count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Modified</p>
                      <p className="font-medium">
                        {new Date(notebook.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Created by</p>
                      <p className="font-medium">{notebook.created_by_name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
            <DialogTitle>Create Notebook</DialogTitle>
            <DialogDescription>
              Create a new interactive notebook for data exploration
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="notebook-name">Notebook Name</Label>
              <Input
                id="notebook-name"
                placeholder="e.g., Customer Analysis"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="language">Language/Kernel</Label>
              <Select
                value={formData.language}
                onValueChange={(value) =>
                  setFormData({ ...formData, language: value })
                }
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="python">Python 3.11</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
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
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateNotebook}
              disabled={!formData.name.trim() || isActionLoading}
            >
              {isActionLoading ? (
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
            <AlertDialogCancel disabled={isActionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNotebook}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
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
