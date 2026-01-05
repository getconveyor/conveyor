"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconRefresh,
  IconCloud,
  IconTrash,
  IconPlayerStop,
  IconEye,
  IconLink,
  IconActivity,
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
import { dataScienceApi, ModelVersion, MLModel } from "@/lib/api/datascience";
import { useToast } from "@/hooks/use-toast";

type DeploymentStatus = "active" | "inactive" | "deploying" | "failed";

interface Deployment {
  id: string;
  versionId: string;
  modelName: string;
  version: string;
  status: DeploymentStatus;
  endpoint: string;
  requests: string;
  latency: string;
  uptime: string;
  deployedAt: string;
  deployedBy: string;
  replicas: number;
  cpu: string;
  memory: string;
  framework: string;
}

const statusConfig: Record<
  DeploymentStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  active: { label: "Active", variant: "default" },
  inactive: { label: "Inactive", variant: "secondary" },
  deploying: { label: "Deploying", variant: "outline" },
  failed: { label: "Failed", variant: "destructive" },
};

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [models, setModels] = useState<MLModel[]>([]);
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deploymentToDelete, setDeploymentToDelete] = useState<string | null>(
    null
  );
  const [formData, setFormData] = useState({
    modelId: "",
    versionId: "",
    replicas: 2,
  });
  const { toast } = useToast();

  // Fetch deployed model versions
  const fetchDeployments = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get all model versions, especially production/staging
      const [allVersions, modelsData] = await Promise.all([
        dataScienceApi.getModelVersions(),
        dataScienceApi.getModels(),
      ]);

      setModels(modelsData);
      setVersions(allVersions);

      // Get serving info for each version to check if deployed
      const deploymentPromises = allVersions.map(async (version) => {
        try {
          const servingInfo = await dataScienceApi.getServingInfo(version.id);
          return { version, servingInfo };
        } catch {
          return { version, servingInfo: null };
        }
      });

      const results = await Promise.all(deploymentPromises);

      // Convert to deployment format
      const deploymentData: Deployment[] = results
        .filter(
          (r) => r.servingInfo?.is_deployed || r.version.stage === "production"
        )
        .map(({ version, servingInfo }) => {
          const model = modelsData.find((m) => m.id === version.model);
          return {
            id: version.id,
            versionId: version.id,
            modelName: model?.name || version.model_name || "Unknown Model",
            version: `v${version.version_number}`,
            status: servingInfo?.is_deployed
              ? ("active" as DeploymentStatus)
              : ("inactive" as DeploymentStatus),
            endpoint:
              servingInfo?.endpoint ||
              `/api/data-science/versions/${version.id}/predict/`,
            requests: "-",
            latency: "-",
            uptime: servingInfo?.is_deployed ? "99.9%" : "-",
            deployedAt: servingInfo?.deployed_at
              ? new Date(servingInfo.deployed_at).toLocaleString()
              : version.created_at,
            deployedBy: version.created_by_name || "System",
            replicas: servingInfo?.is_deployed ? 1 : 0,
            cpu: "2 cores",
            memory: "4 GB",
            framework: servingInfo?.framework || model?.framework || "unknown",
          };
        });

      setDeployments(deploymentData);
    } catch (error) {
      console.error("Failed to fetch deployments:", error);
      toast({
        title: "Error",
        description: "Failed to fetch deployments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  const filteredDeployments = deployments.filter((deployment) => {
    const matchesSearch = deployment.modelName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || deployment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: deployments.length,
    active: deployments.filter((d) => d.status === "active").length,
    inactive: deployments.filter((d) => d.status === "inactive").length,
    totalRequests: "-",
  };

  const handleCreateDeployment = async () => {
    if (!formData.versionId) return;

    setIsActionLoading(true);
    try {
      await dataScienceApi.deployModelVersion(formData.versionId);
      toast({
        title: "Success",
        description: "Model deployed successfully",
      });
      setIsCreateDialogOpen(false);
      resetForm();
      fetchDeployments();
    } catch (error) {
      console.error("Failed to deploy model:", error);
      toast({
        title: "Error",
        description: "Failed to deploy model",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStopDeployment = async (deployment: Deployment) => {
    setIsActionLoading(true);
    try {
      await dataScienceApi.undeployModelVersion(deployment.versionId);
      toast({
        title: "Success",
        description: "Model undeployed successfully",
      });
      fetchDeployments();
    } catch (error) {
      console.error("Failed to undeploy model:", error);
      toast({
        title: "Error",
        description: "Failed to undeploy model",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStartDeployment = async (deployment: Deployment) => {
    setIsActionLoading(true);
    try {
      await dataScienceApi.deployModelVersion(deployment.versionId);
      toast({
        title: "Success",
        description: "Model deployed successfully",
      });
      fetchDeployments();
    } catch (error) {
      console.error("Failed to deploy model:", error);
      toast({
        title: "Error",
        description: "Failed to deploy model",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteDeployment = async () => {
    if (!deploymentToDelete) return;

    setIsActionLoading(true);
    try {
      await dataScienceApi.undeployModelVersion(deploymentToDelete);
      toast({
        title: "Success",
        description: "Deployment removed successfully",
      });
      setDeploymentToDelete(null);
      fetchDeployments();
    } catch (error) {
      console.error("Failed to delete deployment:", error);
      toast({
        title: "Error",
        description: "Failed to delete deployment",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCopyEndpoint = (endpoint: string) => {
    navigator.clipboard.writeText(endpoint);
    toast({
      title: "Copied",
      description: "Endpoint copied to clipboard",
    });
  };

  const resetForm = () => {
    setFormData({
      modelId: "",
      versionId: "",
      replicas: 2,
    });
  };

  // Get versions for selected model
  const selectedModelVersions = formData.modelId
    ? versions.filter((v) => v.model === formData.modelId)
    : [];

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
          <h1 className="text-2xl font-bold">Model Deployments</h1>
          <p className="text-sm text-muted-foreground">
            Manage and monitor deployed ML models
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Deploy Model
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
              Active
            </div>
            <div className="text-xl font-bold text-green-500">
              {stats.active}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Inactive
            </div>
            <div className="text-xl font-bold text-gray-500">
              {stats.inactive}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Total Requests
            </div>
            <div className="text-xl font-bold">{stats.totalRequests}</div>
          </CardContent>
        </Card>
      </div>

      {/* Deployments List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search deployments..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="deploying">Deploying</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchDeployments()}
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
          <div className="space-y-2">
            {filteredDeployments.map((deployment) => (
              <Card key={deployment.id}>
                <CardContent className="p-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <IconCloud className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">
                          {deployment.modelName}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {deployment.version}
                        </Badge>
                        <Badge
                          variant={statusConfig[deployment.status].variant}
                          className="text-xs"
                        >
                          {statusConfig[deployment.status].label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-xs text-muted-foreground font-mono">
                          {deployment.endpoint}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() =>
                            handleCopyEndpoint(deployment.endpoint)
                          }
                        >
                          <IconLink className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Requests</p>
                          <p className="font-medium">{deployment.requests}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Latency</p>
                          <p className="font-medium">{deployment.latency}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Uptime</p>
                          <p className="font-medium">{deployment.uptime}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Replicas</p>
                          <p className="font-medium">{deployment.replicas}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Resources</p>
                          <p className="font-medium">
                            {deployment.cpu}, {deployment.memory}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Deployed</p>
                          <p className="font-medium">{deployment.deployedAt}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {deployment.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleStopDeployment(deployment)}
                          disabled={isActionLoading}
                        >
                          <IconPlayerStop className="h-3.5 w-3.5 mr-1" />
                          Stop
                        </Button>
                      )}
                      {deployment.status === "inactive" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleStartDeployment(deployment)}
                          disabled={isActionLoading}
                        >
                          <IconCloud className="h-3.5 w-3.5 mr-1" />
                          Start
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={isActionLoading}
                          >
                            {isActionLoading ? (
                              <IconLoader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <IconDotsVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <IconEye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <IconActivity className="mr-2 h-4 w-4" />
                            View Metrics
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeploymentToDelete(deployment.id)}
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

      {/* Create Deployment Dialog */}
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
            <DialogTitle>Deploy Model</DialogTitle>
            <DialogDescription>
              Deploy a model version to production
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="model">Model</Label>
              <Select
                value={formData.modelId}
                onValueChange={(value) =>
                  setFormData({ ...formData, modelId: value, versionId: "" })
                }
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="version">Version</Label>
              <Select
                value={formData.versionId}
                onValueChange={(value) =>
                  setFormData({ ...formData, versionId: value })
                }
                disabled={!formData.modelId}
              >
                <SelectTrigger id="version">
                  <SelectValue placeholder="Select a version" />
                </SelectTrigger>
                <SelectContent>
                  {selectedModelVersions.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      v{version.version_number} ({version.stage})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="replicas">Replicas</Label>
              <Select
                value={formData.replicas.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, replicas: parseInt(value) })
                }
              >
                <SelectTrigger id="replicas">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Replica</SelectItem>
                  <SelectItem value="2">2 Replicas</SelectItem>
                  <SelectItem value="3">3 Replicas</SelectItem>
                  <SelectItem value="4">4 Replicas</SelectItem>
                  <SelectItem value="5">5 Replicas</SelectItem>
                </SelectContent>
              </Select>
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
              onClick={handleCreateDeployment}
              disabled={!formData.versionId || isActionLoading}
            >
              {isActionLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deploying...
                </>
              ) : (
                "Deploy Model"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deploymentToDelete}
        onOpenChange={(open) => !open && setDeploymentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deployment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this deployment and stop serving the
              model. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDeployment}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Deployment"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
