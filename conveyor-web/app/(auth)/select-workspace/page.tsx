"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { workspaceApi, Workspace, Plan } from "@/lib/api/workspace";
import {
  IconPlus,
  IconLoader2,
  IconBuildingSkyscraper,
  IconChevronRight,
} from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function SelectWorkspacePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    plan_id: "",
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

      // Load plans and workspaces separately to handle auth errors gracefully
      const plansPromise = workspaceApi.getPlans().catch((error) => {
        console.error("Failed to load plans:", error);
        return [];
      });

      const workspacesPromise = workspaceApi.getWorkspaces().catch((error) => {
        console.error("Failed to load workspaces:", error);
        // Auth errors will be handled by the API client interceptor
        // which will auto-refresh or redirect to login
        return [];
      });

      const [plansData, workspacesData] = await Promise.all([
        plansPromise,
        workspacesPromise,
      ]);

      setWorkspaces(workspacesData);
      setPlans(plansData);

      // Set default plan (free plan)
      const freePlan = plansData.find((p) => p.plan_type === "free");
      if (freePlan) {
        setFormData((prev) => ({ ...prev, plan_id: freePlan.id }));
      }
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error(error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectWorkspace(workspaceId: string) {
    try {
      await workspaceApi.switchWorkspace(workspaceId);
      localStorage.setItem("currentWorkspaceId", workspaceId);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Failed to select workspace:", error);
      toast.error(error.message || "Failed to select workspace");
    }
  }

  async function handleCreateWorkspace() {
    if (!formData.name.trim() || !formData.slug.trim() || !formData.plan_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    try {
      const newWorkspace = await workspaceApi.createWorkspace(formData);
      toast.success("Workspace created successfully");

      // Switch to the new workspace and redirect
      await workspaceApi.switchWorkspace(newWorkspace.id);
      localStorage.setItem("currentWorkspaceId", newWorkspace.id);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Failed to create workspace:", error);
      toast.error(error.message || "Failed to create workspace");
    } finally {
      setIsCreating(false);
    }
  }

  // Auto-generate slug from name
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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <IconLoader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4 py-12">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              Select a Workspace
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Choose a workspace to continue or create a new one
            </p>
          </div>

          {/* Workspaces Grid */}
          {workspaces.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
              {workspaces.map((workspace) => (
                <Card
                  key={workspace.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleSelectWorkspace(workspace.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                        <IconBuildingSkyscraper className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <IconChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-1">
                      {workspace.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {workspace.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        {workspace.member_count}{" "}
                        {workspace.member_count === 1 ? "member" : "members"}
                      </span>
                      <span
                        className={`px-2 py-1 rounded font-medium ${
                          workspace.status === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : workspace.status === "trial"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400"
                        }`}
                      >
                        {workspace.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 mb-6">
              <IconBuildingSkyscraper className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                You don't have any workspaces yet
              </p>
            </div>
          )}

          {/* Create New Workspace Button */}
          <div className="text-center">
            <Button
              size="lg"
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <IconPlus className="mr-2 h-5 w-5" />
              Create New Workspace
            </Button>
          </div>

          {/* Create Workspace Dialog */}
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Workspace</DialogTitle>
                <DialogDescription>
                  Set up a new workspace for your team
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Workspace Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., My Company"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">Workspace Slug *</Label>
                  <Input
                    id="slug"
                    placeholder="e.g., my-company"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Used in URLs and API calls
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of your workspace"
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="plan">Plan *</Label>
                  <Select
                    value={formData.plan_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, plan_id: value })
                    }
                  >
                    <SelectTrigger id="plan" className="w-full">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - ${plan.price_monthly}/month
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateWorkspace}
                  disabled={
                    !formData.name.trim() ||
                    !formData.slug.trim() ||
                    !formData.plan_id ||
                    isCreating
                  }
                >
                  {isCreating ? (
                    <>
                      <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Workspace"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProtectedRoute>
  );
}
