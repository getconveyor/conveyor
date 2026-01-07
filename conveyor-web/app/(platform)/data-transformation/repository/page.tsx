"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconRefresh,
  IconFolder,
  IconTrash,
  IconCopy,
  IconDownload,
  IconGitBranch,
  IconGitCommit,
  IconFile,
  IconLoader2,
  IconPlayerPlay,
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
import { Notebook } from "@/lib/api/transformation";
import {
  useNotebooks,
  useCreateNotebook,
  useDeleteNotebook,
  useDuplicateNotebook,
  useRunNotebook,
  useExportNotebook,
} from "@/hooks/use-transformation";
import { useToast } from "@/hooks/use-toast";

interface RepositoryItem {
  id: string;
  name: string;
  type: "folder" | "file";
  language?: string;
  lastCommit: string;
  author: string;
  branch: string;
  size?: string;
  status?: string;
  cellCount?: number;
}

export default function RepositoryPage() {
  const { data: notebooks, isLoading } = useNotebooks();
  const createNotebookMutation = useCreateNotebook();
  const deleteNotebookMutation = useDeleteNotebook();
  const duplicateNotebookMutation = useDuplicateNotebook();
  const runNotebookMutation = useRunNotebook();
  const exportNotebookMutation = useExportNotebook();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    language: "python",
  });

  const repositoryItems: RepositoryItem[] = (notebooks || []).map(
    (notebook: Notebook) => ({
      id: notebook.id,
      name: notebook.name,
      type: "file" as const,
      language: notebook.language,
      lastCommit: notebook.description || "No description",
      author: notebook.created_by_name || "Unknown",
      branch: "main",
      size: `${notebook.cell_count} cells`,
      status: notebook.status,
      cellCount: notebook.cell_count,
    })
  );

  const filteredItems = repositoryItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesLanguage =
      languageFilter === "all" || item.language === languageFilter;
    return matchesSearch && matchesType && matchesLanguage;
  });

  const stats = {
    total: repositoryItems.length,
    python: repositoryItems.filter((i) => i.language === "python").length,
    sql: repositoryItems.filter((i) => i.language === "sql").length,
    running: repositoryItems.filter((i) => i.status === "running").length,
  };

  const handleCreateItem = async () => {
    if (!formData.name.trim()) return;
    try {
      await createNotebookMutation.mutateAsync({
        name: formData.name,
        description: formData.description,
        language: formData.language,
      });
      toast({
        title: "Success",
        description: "Notebook created successfully",
      });
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create notebook:", error);
      toast({
        title: "Error",
        description: "Failed to create notebook",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await deleteNotebookMutation.mutateAsync(itemToDelete);
      toast({
        title: "Success",
        description: "Notebook deleted successfully",
      });
      setItemToDelete(null);
    } catch (error) {
      console.error("Failed to delete notebook:", error);
      toast({
        title: "Error",
        description: "Failed to delete notebook",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateItem = async (item: RepositoryItem) => {
    try {
      await duplicateNotebookMutation.mutateAsync(item.id);
      toast({
        title: "Success",
        description: "Notebook duplicated successfully",
      });
    } catch (error) {
      console.error("Failed to duplicate notebook:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate notebook",
        variant: "destructive",
      });
    }
  };

  const handleRunNotebook = async (item: RepositoryItem) => {
    try {
      await runNotebookMutation.mutateAsync(item.id);
      toast({
        title: "Success",
        description: "Notebook execution started",
      });
    } catch (error) {
      console.error("Failed to run notebook:", error);
      toast({
        title: "Error",
        description: "Failed to run notebook",
        variant: "destructive",
      });
    }
  };

  const handleExportNotebook = async (item: RepositoryItem) => {
    try {
      const result = await exportNotebookMutation.mutateAsync(item.id);
      // Create download link
      const blob = new Blob([JSON.stringify(result.content, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Success",
        description: "Notebook exported successfully",
      });
    } catch (error) {
      console.error("Failed to export notebook:", error);
      toast({
        title: "Error",
        description: "Failed to export notebook",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      language: "python",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Repository</h1>
          <p className="text-sm text-muted-foreground">
            Transformation notebooks and scripts
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          New Notebook
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
            <div className="text-xl font-bold text-green-500">{stats.sql}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Running
            </div>
            <div className="text-xl font-bold text-purple-500">
              {stats.running}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Repository */}
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
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
                  <SelectItem value="scala">Scala</SelectItem>
                  <SelectItem value="r">R</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-2">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No notebooks found. Create your first notebook to get started.
              </div>
            ) : (
              filteredItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                          <IconFile className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">
                              {item.name}
                            </h3>
                            {item.language && (
                              <Badge variant="secondary" className="text-xs">
                                {item.language}
                              </Badge>
                            )}
                            {item.status && (
                              <Badge
                                variant={
                                  item.status === "running"
                                    ? "default"
                                    : item.status === "error"
                                    ? "destructive"
                                    : "outline"
                                }
                                className="text-xs"
                              >
                                {item.status}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                            <span>{item.lastCommit}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            <div>
                              <p className="text-muted-foreground">Author</p>
                              <p className="font-medium">{item.author}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Cells</p>
                              <p className="font-medium">
                                {item.cellCount || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Language</p>
                              <p className="font-medium">
                                {item.language || "unknown"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleRunNotebook(item)}
                          disabled={
                            isActionLoading || item.status === "running"
                          }
                        >
                          <IconPlayerPlay className="h-3.5 w-3.5 mr-1" />
                          Run
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              disabled={isActionLoading}
                            >
                              <IconDotsVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <IconFile className="mr-2 h-4 w-4" />
                              Open
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicateItem(item)}
                            >
                              <IconCopy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleExportNotebook(item)}
                            >
                              <IconDownload className="mr-2 h-4 w-4" />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setItemToDelete(item.id)}
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
              ))
            )}
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
          className="max-w-2xl"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Create New Notebook</DialogTitle>
            <DialogDescription>
              Add a new transformation notebook
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                placeholder="e.g., transform_customer_data"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="language">Language</Label>
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
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
                  <SelectItem value="scala">Scala</SelectItem>
                  <SelectItem value="r">R</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What does this notebook do?"
                rows={2}
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
              onClick={handleCreateItem}
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
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notebook?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this notebook. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
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
