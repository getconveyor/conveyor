"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconRefresh,
  IconKey,
  IconTrash,
  IconUser,
  IconUsers,
  IconDatabase,
  IconLoader2,
  IconShield,
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
import { governanceApi, Policy } from "@/lib/api/governance";
import { useToast } from "@/hooks/use-toast";

interface AccessGrant {
  id: string;
  name: string;
  description: string;
  principal: string;
  principalType: "user" | "group";
  resource: string;
  resourceType: string;
  permission: string;
  enforcement: string;
  grantedBy: string;
  grantedAt: string;
  isActive: boolean;
}

export default function AccessPage() {
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [principalTypeFilter, setPrincipalTypeFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);
  const [grantToRevoke, setGrantToRevoke] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    principal: "",
    principalType: "user",
    resource: "",
    resourceType: "table",
    permission: "read",
    enforcement: "blocking",
  });
  const { toast } = useToast();

  const fetchPolicies = useCallback(async () => {
    try {
      setIsLoading(true);
      const policies = await governanceApi.getPolicies({
        type: "access_control",
      });

      // Convert policies to access grants format
      const grantsData: AccessGrant[] = policies.map((policy: Policy) => {
        const applies = policy.applies_to || {};
        const rules = policy.rules || {};

        return {
          id: policy.id,
          name: policy.name,
          description: policy.description,
          principal:
            applies.principal || applies.user || applies.group || "Unknown",
          principalType: applies.principal_type === "group" ? "group" : "user",
          resource:
            applies.resource || applies.table || applies.schema || "All",
          resourceType: applies.resource_type || "table",
          permission: rules.permission || rules.access_level || "read",
          enforcement: policy.enforcement_level,
          grantedBy: policy.created_by_name || "System",
          grantedAt: new Date(policy.created_at).toLocaleDateString(),
          isActive: policy.is_active,
        };
      });

      setGrants(grantsData);
    } catch (error) {
      console.error("Failed to fetch access policies:", error);
      toast({
        title: "Error",
        description: "Failed to fetch access policies",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const filteredGrants = grants.filter((grant) => {
    const matchesSearch =
      grant.principal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grant.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grant.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      principalTypeFilter === "all" ||
      grant.principalType === principalTypeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: grants.length,
    users: grants.filter((g) => g.principalType === "user").length,
    groups: grants.filter((g) => g.principalType === "group").length,
    active: grants.filter((g) => g.isActive).length,
  };

  const handleGrantAccess = async () => {
    if (
      !formData.name.trim() ||
      !formData.principal.trim() ||
      !formData.resource.trim()
    )
      return;

    setIsActionLoading(true);
    try {
      await governanceApi.createPolicy({
        name: formData.name,
        description: formData.description,
        policy_type: "access_control",
        rules: {
          permission: formData.permission,
        },
        applies_to: {
          principal: formData.principal,
          principal_type: formData.principalType,
          resource: formData.resource,
          resource_type: formData.resourceType,
        },
        enforcement_level: formData.enforcement as
          | "advisory"
          | "warning"
          | "blocking",
        is_active: true,
      });

      toast({
        title: "Success",
        description: "Access policy created successfully",
      });
      setIsGrantDialogOpen(false);
      resetForm();
      fetchPolicies();
    } catch (error) {
      console.error("Failed to create access policy:", error);
      toast({
        title: "Error",
        description: "Failed to create access policy",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRevokeAccess = async () => {
    if (!grantToRevoke) return;

    setIsActionLoading(true);
    try {
      await governanceApi.deletePolicy(grantToRevoke);
      toast({
        title: "Success",
        description: "Access policy revoked successfully",
      });
      setGrantToRevoke(null);
      fetchPolicies();
    } catch (error) {
      console.error("Failed to revoke access:", error);
      toast({
        title: "Error",
        description: "Failed to revoke access",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      principal: "",
      principalType: "user",
      resource: "",
      resourceType: "table",
      permission: "read",
      enforcement: "blocking",
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
          <h1 className="text-2xl font-bold">Access Control</h1>
          <p className="text-sm text-muted-foreground">
            Manage data access permissions
          </p>
        </div>
        <Button onClick={() => setIsGrantDialogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Grant Access
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Total Policies
            </div>
            <div className="text-xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              User Policies
            </div>
            <div className="text-xl font-bold text-blue-500">{stats.users}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Group Policies
            </div>
            <div className="text-xl font-bold text-green-500">
              {stats.groups}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Active
            </div>
            <div className="text-xl font-bold text-orange-500">
              {stats.active}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Access Grants List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search access policies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={principalTypeFilter}
                onValueChange={setPrincipalTypeFilter}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="group">Groups</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchPolicies()}
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
            {filteredGrants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No access policies found. Create your first policy to get
                started.
              </div>
            ) : (
              filteredGrants.map((grant) => (
                <Card key={grant.id}>
                  <CardContent className="p-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <IconShield className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold text-sm">
                            {grant.name}
                          </h3>
                          <Badge
                            variant={grant.isActive ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {grant.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {grant.permission}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {grant.principalType === "user" ? (
                              <IconUser className="h-3 w-3 text-blue-500" />
                            ) : (
                              <IconUsers className="h-3 w-3 text-green-500" />
                            )}
                            <span>{grant.principal}</span>
                          </div>
                          <span>→</span>
                          <div className="flex items-center gap-1">
                            <IconDatabase className="h-3 w-3" />
                            <span>
                              {grant.resource} ({grant.resourceType})
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <p className="text-muted-foreground">Created By</p>
                            <p className="font-medium">{grant.grantedBy}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Created</p>
                            <p className="font-medium">{grant.grantedAt}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Enforcement</p>
                            <p className="font-medium capitalize">
                              {grant.enforcement}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Type</p>
                            <p className="font-medium capitalize">
                              {grant.principalType}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
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
                              <IconKey className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setGrantToRevoke(grant.id)}
                            >
                              <IconTrash className="mr-2 h-4 w-4" />
                              Revoke Access
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

      {/* Grant Access Dialog */}
      <Dialog
        open={isGrantDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsGrantDialogOpen(false);
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
            <DialogTitle>Create Access Policy</DialogTitle>
            <DialogDescription>
              Create a new access control policy
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="policy-name">Policy Name</Label>
              <Input
                id="policy-name"
                placeholder="e.g., Sales Team Read Access"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What does this policy grant access to?"
                rows={2}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="principal-type">Principal Type</Label>
              <Select
                value={formData.principalType}
                onValueChange={(value) =>
                  setFormData({ ...formData, principalType: value })
                }
              >
                <SelectTrigger id="principal-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="principal">
                {formData.principalType === "user"
                  ? "User Email"
                  : "Group Name"}
              </Label>
              <Input
                id="principal"
                placeholder={
                  formData.principalType === "user"
                    ? "user@company.com"
                    : "Analytics Team"
                }
                value={formData.principal}
                onChange={(e) =>
                  setFormData({ ...formData, principal: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resource-type">Resource Type</Label>
              <Select
                value={formData.resourceType}
                onValueChange={(value) =>
                  setFormData({ ...formData, resourceType: value })
                }
              >
                <SelectTrigger id="resource-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="schema">Schema</SelectItem>
                  <SelectItem value="table">Table</SelectItem>
                  <SelectItem value="dataset">Dataset</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resource">Resource Name</Label>
              <Input
                id="resource"
                placeholder="e.g., customer_profiles"
                value={formData.resource}
                onChange={(e) =>
                  setFormData({ ...formData, resource: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="permission">Permission Level</Label>
              <Select
                value={formData.permission}
                onValueChange={(value) =>
                  setFormData({ ...formData, permission: value })
                }
              >
                <SelectTrigger id="permission">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="write">Write</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="enforcement">Enforcement Level</Label>
              <Select
                value={formData.enforcement}
                onValueChange={(value) =>
                  setFormData({ ...formData, enforcement: value })
                }
              >
                <SelectTrigger id="enforcement">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advisory">Advisory</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="blocking">Blocking</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsGrantDialogOpen(false);
                resetForm();
              }}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGrantAccess}
              disabled={
                !formData.name.trim() ||
                !formData.principal.trim() ||
                !formData.resource.trim() ||
                isActionLoading
              }
            >
              {isActionLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Policy"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog
        open={!!grantToRevoke}
        onOpenChange={(open) => !open && setGrantToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this access policy. The user or group
              will no longer have access as defined by this policy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAccess}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                "Revoke Access"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
