"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconPlus,
  IconLayoutDashboard,
  IconCalendar,
  IconUsers,
  IconDots,
  IconEdit,
  IconTrash,
  IconShare,
  IconCopy,
  IconEye,
  IconStar,
  IconStarFilled,
  IconLayoutGrid,
  IconLayoutList,
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
import { analyticsApi, Dashboard as APIDashboard } from "@/lib/api/analytics";
import { toast } from "sonner";

interface Dashboard {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  lastModified: string;
  widgets: number;
  views: number;
  shared: boolean;
  favorite: boolean;
  tags: string[];
}

// Transform API response to component format
function transformDashboard(apiDashboard: APIDashboard): Dashboard {
  return {
    id: apiDashboard.id,
    name: apiDashboard.name,
    description: apiDashboard.description || "",
    createdBy:
      apiDashboard.owner_name || apiDashboard.created_by_name || "Unknown",
    createdAt: apiDashboard.created_at,
    lastModified: formatRelativeTime(apiDashboard.updated_at),
    widgets: apiDashboard.widget_count || 0,
    views: apiDashboard.view_count || 0,
    shared: apiDashboard.is_public,
    favorite: false, // Would need user preferences API
    tags: [], // Would need tags from API
  };
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export default function DashboardsPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const router = useRouter();

  // Fetch dashboards on mount
  useEffect(() => {
    fetchDashboards();
  }, []);

  const fetchDashboards = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiDashboards = await analyticsApi.getDashboards();
      setDashboards(apiDashboards.map(transformDashboard));
    } catch (err) {
      console.error("Failed to fetch dashboards:", err);
      setError("Failed to load dashboards. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDashboard = async () => {
    if (!formData.name.trim()) {
      toast.error("Dashboard name is required");
      return;
    }

    try {
      setCreating(true);
      const newDashboard = await analyticsApi.createDashboard({
        name: formData.name,
        description: formData.description,
      });
      toast.success("Dashboard created successfully");
      setCreateDialogOpen(false);
      setFormData({ name: "", description: "" });
      // Navigate to builder
      router.push(`/data-analytics/dashboards/${newDashboard.id}/builder`);
    } catch (err) {
      console.error("Failed to create dashboard:", err);
      toast.error("Failed to create dashboard");
    } finally {
      setCreating(false);
    }
  };

  const handleDuplicate = async (dashboard: Dashboard) => {
    try {
      const duplicated = await analyticsApi.duplicateDashboard(
        dashboard.id,
        `${dashboard.name} (Copy)`
      );
      toast.success("Dashboard duplicated");
      setDashboards([...dashboards, transformDashboard(duplicated)]);
    } catch (err) {
      console.error("Failed to duplicate dashboard:", err);
      toast.error("Failed to duplicate dashboard");
    }
  };

  const toggleFavorite = (id: string) => {
    // TODO: Implement favorites API
    setDashboards(
      dashboards.map((d) => (d.id === id ? { ...d, favorite: !d.favorite } : d))
    );
  };

  const deleteDashboard = async (id: string) => {
    try {
      await analyticsApi.deleteDashboard(id);
      setDashboards(dashboards.filter((d) => d.id !== id));
      toast.success("Dashboard deleted");
    } catch (err) {
      console.error("Failed to delete dashboard:", err);
      toast.error("Failed to delete dashboard");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <IconAlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchDashboards}>Try Again</Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboards</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage custom analytics dashboards
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
                New Dashboard
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Dashboard</DialogTitle>
                <DialogDescription>
                  Create a custom dashboard with charts and widgets
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Dashboard Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Sales Performance"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the purpose of this dashboard"
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
                <Button onClick={handleCreateDashboard} disabled={creating}>
                  {creating && (
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Create Dashboard
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((dashboard) => (
            <Card
              key={dashboard.id}
              className="hover:bg-accent/30 transition-colors"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <IconLayoutDashboard className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-lg">
                        {dashboard.name}
                      </CardTitle>
                    </div>
                    <CardDescription className="mt-2 line-clamp-2">
                      {dashboard.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(dashboard.id)}
                    >
                      {dashboard.favorite ? (
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
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/data-analytics/dashboards/${dashboard.id}`}
                          >
                            <IconEye className="h-4 w-4 mr-2" />
                            View Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/data-analytics/dashboards/${dashboard.id}/builder`}
                          >
                            <IconEdit className="h-4 w-4 mr-2" />
                            Edit Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDuplicate(dashboard)}
                        >
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
                          onClick={() => deleteDashboard(dashboard.id)}
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
                  <div className="flex flex-wrap gap-1">
                    {dashboard.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>{dashboard.widgets} widgets</span>
                      <span>{dashboard.views} views</span>
                    </div>
                    {dashboard.shared && (
                      <Badge variant="outline" className="text-xs">
                        <IconShare className="h-3 w-3 mr-1" />
                        Shared
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                    <IconUsers className="h-3 w-3" />
                    <span>{dashboard.createdBy}</span>
                    <span>•</span>
                    <IconCalendar className="h-3 w-3" />
                    <span>Modified {dashboard.lastModified}</span>
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
              {dashboards.map((dashboard) => (
                <div
                  key={dashboard.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(dashboard.id)}
                    >
                      {dashboard.favorite ? (
                        <IconStarFilled className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <IconStar className="h-4 w-4" />
                      )}
                    </Button>
                    <IconLayoutDashboard className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/data-analytics/dashboards/${dashboard.id}`}
                          className="font-medium hover:underline"
                        >
                          {dashboard.name}
                        </Link>
                        {dashboard.shared && (
                          <Badge variant="outline" className="text-xs">
                            Shared
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {dashboard.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{dashboard.createdBy}</span>
                        <span>•</span>
                        <span>{dashboard.widgets} widgets</span>
                        <span>•</span>
                        <span>{dashboard.views} views</span>
                        <span>•</span>
                        <span>Modified {dashboard.lastModified}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-1">
                      {dashboard.tags.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <IconDots className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/data-analytics/dashboards/${dashboard.id}`}
                          >
                            <IconEye className="h-4 w-4 mr-2" />
                            View Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/data-analytics/dashboards/${dashboard.id}/builder`}
                          >
                            <IconEdit className="h-4 w-4 mr-2" />
                            Edit Dashboard
                          </Link>
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
                          onClick={() => deleteDashboard(dashboard.id)}
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
    </>
  );
}
