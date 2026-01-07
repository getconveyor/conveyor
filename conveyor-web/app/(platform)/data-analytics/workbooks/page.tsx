"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconPlus,
  IconBook,
  IconUsers,
  IconClock,
  IconDots,
  IconEdit,
  IconTrash,
  IconCopy,
  IconShare,
  IconEye,
  IconStar,
  IconStarFilled,
  IconCode,
  IconChartBar,
  IconSearch,
  IconLayoutGrid,
  IconLayoutList,
  IconRefresh,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { analyticsApi, Exploration } from "@/lib/api/analytics";
import { formatDistanceToNow } from "date-fns";

interface Workbook {
  id: string;
  name: string;
  description: string;
  cellCount: number;
  createdBy: string;
  createdAt: string;
  lastModified: string;
  sourceType: string;
  sourceReference: string;
  favorite: boolean;
}

// Convert Exploration to Workbook format
function explorationToWorkbook(exp: Exploration): Workbook {
  return {
    id: exp.id,
    name: exp.name,
    description: `${exp.source_type} exploration from ${exp.source_reference}`,
    cellCount: exp.cell_count,
    createdBy: exp.user_name || "Unknown",
    createdAt: exp.created_at,
    lastModified: formatDistanceToNow(new Date(exp.updated_at), {
      addSuffix: true,
    }),
    sourceType: exp.source_type,
    sourceReference: exp.source_reference,
    favorite: false, // Would need to store favorites locally or in backend
  };
}

export default function WorkbooksPage() {
  const router = useRouter();
  const [workbooks, setWorkbooks] = useState<Workbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const fetchWorkbooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const explorations = await analyticsApi.getExplorations();
      const workbooksList = explorations.map(explorationToWorkbook);
      // Restore favorites from localStorage
      const storedFavorites = localStorage.getItem("workbook-favorites");
      if (storedFavorites) {
        const favSet = new Set<string>(JSON.parse(storedFavorites));
        setFavorites(favSet);
        // Apply favorites to workbooks
        workbooksList.forEach((w) => {
          w.favorite = favSet.has(w.id);
        });
      }
      setWorkbooks(workbooksList);
    } catch (err) {
      console.error("Failed to fetch workbooks:", err);
      setError("Failed to load workbooks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkbooks();
  }, [fetchWorkbooks]);

  const filteredWorkbooks = workbooks.filter(
    (workbook) =>
      workbook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workbook.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateWorkbook = async () => {
    try {
      const newExploration = await analyticsApi.createExploration({
        name: formData.name,
        state: { description: formData.description },
        source_type: "workbook",
        source_reference: "manual",
      });
      setCreateDialogOpen(false);
      setFormData({ name: "", description: "" });
      // Navigate to the new workbook
      router.push(`/data-analytics/workbooks/${newExploration.id}`);
    } catch (err) {
      console.error("Failed to create workbook:", err);
    }
  };

  const toggleFavorite = (id: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
    localStorage.setItem(
      "workbook-favorites",
      JSON.stringify([...newFavorites])
    );
    setWorkbooks(
      workbooks.map((w) =>
        w.id === id ? { ...w, favorite: newFavorites.has(id) } : w
      )
    );
  };

  const deleteWorkbook = async (id: string) => {
    try {
      await analyticsApi.deleteExploration(id);
      setWorkbooks(workbooks.filter((w) => w.id !== id));
    } catch (err) {
      console.error("Failed to delete workbook:", err);
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Workbooks</h1>
            <p className="text-sm text-muted-foreground">
              Interactive data analysis and visualization notebooks
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                  </div>
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Workbooks</h1>
            <p className="text-sm text-muted-foreground">
              Interactive data analysis and visualization notebooks
            </p>
          </div>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchWorkbooks} className="mt-4">
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
          <h1 className="text-xl font-semibold">Workbooks</h1>
          <p className="text-sm text-muted-foreground">
            Interactive data analysis and visualization notebooks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as "grid" | "list")}
          >
            <TabsList>
              <TabsTrigger value="grid">
                <IconLayoutGrid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list">
                <IconLayoutList className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <IconPlus className="h-4 w-4 mr-2" />
                New Workbook
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Workbook</DialogTitle>
                <DialogDescription>
                  Create an interactive notebook for data analysis
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="workbook-name">Workbook Name</Label>
                  <Input
                    id="workbook-name"
                    placeholder="e.g., Sales Analysis"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workbook-description">Description</Label>
                  <Textarea
                    id="workbook-description"
                    placeholder="Describe the purpose of this workbook"
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
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateWorkbook}>Create Workbook</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workbooks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWorkbooks.map((workbook) => (
            <Card
              key={workbook.id}
              className="hover:bg-accent/30 transition-colors"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <IconBook className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <CardTitle className="text-lg truncate">
                        {workbook.name}
                      </CardTitle>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {workbook.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(workbook.id)}
                    >
                      {workbook.favorite ? (
                        <IconStarFilled className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <IconStar className="h-4 w-4" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <IconDots className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <IconEye className="h-4 w-4 mr-2" />
                          Open Workbook
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <IconEdit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <IconCopy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <IconShare className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteWorkbook(workbook.id)}
                        >
                          <IconTrash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-muted/50 rounded">
                      <div className="flex items-center justify-center gap-1">
                        <IconCode className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">Cells</p>
                      <p className="text-lg font-semibold">
                        {workbook.cellCount}
                      </p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <div className="flex items-center justify-center gap-1">
                        <IconChartBar className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">Source</p>
                      <p className="text-sm font-semibold truncate">
                        {workbook.sourceType}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>{workbook.createdBy}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <IconClock className="h-3 w-3" />
                    <span>Modified {workbook.lastModified}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredWorkbooks.map((workbook) => (
                <div
                  key={workbook.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(workbook.id)}
                    >
                      {workbook.favorite ? (
                        <IconStarFilled className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <IconStar className="h-4 w-4" />
                      )}
                    </Button>
                    <IconBook className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{workbook.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {workbook.sourceType}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {workbook.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{workbook.createdBy}</span>
                        <span>•</span>
                        <span>{workbook.cellCount} cells</span>
                        <span>•</span>
                        <span>Modified {workbook.lastModified}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <IconDots className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/data-analytics/workbooks/${workbook.id}`
                            )
                          }
                        >
                          <IconEye className="h-4 w-4 mr-2" />
                          Open Workbook
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteWorkbook(workbook.id)}
                        >
                          <IconTrash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredWorkbooks.length === 0 && !loading && (
        <Card>
          <CardContent className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <IconBook className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">No workbooks found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Create your first workbook to get started"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <IconPlus className="h-4 w-4 mr-2" />
                  Create Workbook
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
