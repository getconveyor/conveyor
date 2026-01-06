"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { workspaceApi, Workspace } from "@/lib/api/workspace";
import {
  IconPlus,
  IconLoader2,
  IconBuildingSkyscraper,
  IconLogout,
  IconUsers,
  IconSparkles,
  IconArrowRight,
  IconCheck,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SelectWorkspacePage() {
  const { user, logout } = useAuth();
  const { switchWorkspace: switchWorkspaceContext } = useWorkspace();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      const workspacesData = await workspaceApi
        .getWorkspaces()
        .catch((error) => {
          console.error("Failed to load workspaces:", error);
          return [];
        });

      setWorkspaces(workspacesData);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error(error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectWorkspace(workspaceId: string) {
    try {
      setSelectedWorkspace(workspaceId);
      await switchWorkspaceContext(workspaceId);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Failed to select workspace:", error);
      toast.error(error.message || "Failed to select workspace");
      setSelectedWorkspace(null);
    }
  }

  async function handleCreateWorkspace() {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    try {
      const newWorkspace = await workspaceApi.createWorkspace(formData);
      toast.success("Workspace created successfully");

      await switchWorkspaceContext(newWorkspace.id);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Failed to create workspace:", error);
      toast.error(error.message || "Failed to create workspace");
    } finally {
      setIsCreating(false);
    }
  }

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    }));
  };

  const getWorkspaceInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getWorkspaceColor = (name: string) => {
    const colors = [
      "from-blue-500 to-blue-600",
      "from-purple-500 to-purple-600",
      "from-emerald-500 to-emerald-600",
      "from-orange-500 to-orange-600",
      "from-pink-500 to-pink-600",
      "from-cyan-500 to-cyan-600",
      "from-indigo-500 to-indigo-600",
      "from-rose-500 to-rose-600",
    ];
    const index =
      name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <IconBuildingSkyscraper className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-background flex items-center justify-center">
                <IconLoader2 className="h-4 w-4 animate-spin text-blue-500" />
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Loading workspaces...
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <header className="relative z-10 border-b border-border/50 bg-background/50 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <IconSparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">
                Conveyor
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    {user?.first_name?.[0]}
                    {user?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">{user?.email}</span>
              </div>
              <ThemeToggle variant="icon" />
              <button
                onClick={logout}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-muted"
              >
                <IconLogout className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Welcome back
              {user?.first_name && (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  , {user.first_name}
                </span>
              )}
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Select a workspace to continue building your data pipelines
            </p>
          </div>

          {/* Workspaces */}
          {workspaces.length > 0 ? (
            <div className="space-y-4 mb-8">
              {workspaces.map((workspace, index) => (
                <button
                  key={workspace.id}
                  onClick={() => handleSelectWorkspace(workspace.id)}
                  disabled={selectedWorkspace === workspace.id}
                  className={cn(
                    "w-full group relative overflow-hidden rounded-2xl border transition-all duration-300",
                    "bg-card/50 backdrop-blur-sm hover:bg-muted/50",
                    "border-border hover:border-border/80",
                    selectedWorkspace === workspace.id &&
                      "border-blue-500 bg-blue-500/10"
                  )}
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="p-6 flex items-center gap-5">
                    {/* Workspace Icon */}
                    <div
                      className={cn(
                        "h-14 w-14 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-lg",
                        getWorkspaceColor(workspace.name)
                      )}
                    >
                      <span className="text-xl font-bold text-white">
                        {getWorkspaceInitials(workspace.name)}
                      </span>
                    </div>

                    {/* Workspace Info */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-foreground truncate">
                          {workspace.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 text-xs border",
                            workspace.status === "active"
                              ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                              : workspace.status === "trial"
                              ? "border-blue-500/50 text-blue-400 bg-blue-500/10"
                              : "border-muted text-muted-foreground bg-muted/10"
                          )}
                        >
                          {workspace.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mb-2">
                        {workspace.description || "No description"}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
                        <span className="flex items-center gap-1.5">
                          <IconUsers className="h-3.5 w-3.5" />
                          {workspace.member_count}{" "}
                          {workspace.member_count === 1 ? "member" : "members"}
                        </span>
                        <span className="text-muted-foreground/30">•</span>
                        <span>/{workspace.slug}</span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="shrink-0">
                      {selectedWorkspace === workspace.id ? (
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <IconLoader2 className="h-5 w-5 text-white animate-spin" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted group-hover:bg-muted/80 flex items-center justify-center transition-all group-hover:translate-x-1">
                          <IconArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 mb-8 rounded-2xl border border-dashed border-border bg-card/30">
              <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                <IconBuildingSkyscraper className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No workspaces yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Create your first workspace to start building data pipelines and
                managing your data infrastructure.
              </p>
              <Button
                size="lg"
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-blue-500/25"
              >
                <IconPlus className="mr-2 h-5 w-5" />
                Create Your First Workspace
              </Button>
            </div>
          )}

          {/* Create New Button (when workspaces exist) */}
          {workspaces.length > 0 && (
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-blue-500/25 group"
              >
                <IconPlus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
                Create New Workspace
              </Button>
            </div>
          )}
        </main>

        {/* Create Workspace Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-lg bg-card border-border">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <IconBuildingSkyscraper className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-foreground">
                    Create New Workspace
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Set up a new workspace for your team
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-muted-foreground">
                  Workspace Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., My Company"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug" className="text-muted-foreground">
                  Workspace Slug <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    /
                  </span>
                  <Input
                    id="slug"
                    placeholder="my-company"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    className="pl-7 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Used in URLs and API calls
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-muted-foreground">
                  Description{" "}
                  <span className="text-muted-foreground/70">(optional)</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your workspace"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:ring-blue-500/20 resize-none"
                />
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
                className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateWorkspace}
                disabled={
                  !formData.name.trim() || !formData.slug.trim() || isCreating
                }
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
              >
                {isCreating ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <IconCheck className="mr-2 h-4 w-4" />
                    Create Workspace
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
