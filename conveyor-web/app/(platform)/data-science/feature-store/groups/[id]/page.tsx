"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconArrowLeft,
  IconSettings,
  IconTrash,
  IconDownload,
  IconCloud,
  IconCloudUpload,
  IconClock,
  IconCheck,
  IconX,
  IconLoader2,
  IconAlertCircle,
  IconEdit,
  IconDatabase,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useFeatureGroup,
  useFeatureDefinitions,
  useFeatureMaterializations,
  useMaterializeFeatures,
  useSyncOnlineFeatures,
  useDeleteFeatureGroup,
} from "@/hooks/use-datascience";
import {
  FeatureGroup,
  FeatureDefinition,
  FeatureMaterialization,
} from "@/lib/api/datascience";

export default function FeatureGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  // Use hooks instead of manual loading
  const {
    data: group,
    isLoading: groupLoading,
    error: groupError,
  } = useFeatureGroup(groupId);
  const { data: definitions = [], isLoading: definitionsLoading } =
    useFeatureDefinitions({ feature_group: groupId });
  const { data: materializations = [], isLoading: materializationsLoading } =
    useFeatureMaterializations({ feature_group: groupId });
  const materializeMutation = useMaterializeFeatures();
  const syncMutation = useSyncOnlineFeatures();
  const deleteMutation = useDeleteFeatureGroup();

  const loading = groupLoading || definitionsLoading || materializationsLoading;

  const handleMaterialize = async () => {
    if (!group) return;
    try {
      await materializeMutation.mutateAsync({ groupId: group.id, data: {} });
    } catch (error) {
      console.error("Failed to materialize:", error);
    }
  };

  const handleSyncOnline = async () => {
    if (!group) return;
    try {
      await syncMutation.mutateAsync(group.id);
    } catch (error) {
      console.error("Failed to sync online:", error);
    }
  };

  const handleDelete = async () => {
    if (!group) return;
    try {
      await deleteMutation.mutateAsync(group.id);
      router.push("/data-science/feature-store");
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-500">
            <IconCheck className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "running":
        return (
          <Badge variant="default" className="bg-blue-500">
            <IconLoader2 className="w-3 h-3 mr-1 animate-spin" />
            Running
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <IconX className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      int: "bg-blue-100 text-blue-800",
      float: "bg-green-100 text-green-800",
      string: "bg-yellow-100 text-yellow-800",
      bool: "bg-purple-100 text-purple-800",
      datetime: "bg-orange-100 text-orange-800",
      array: "bg-pink-100 text-pink-800",
      embedding: "bg-indigo-100 text-indigo-800",
    };
    return (
      <Badge variant="secondary" className={colors[type] || ""}>
        {type}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <IconAlertCircle className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Feature Group Not Found</h2>
        <Link href="/data-science/feature-store">
          <Button>Back to Feature Store</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/data-science/feature-store">
            <Button variant="ghost" size="icon">
              <IconArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{group.name}</h1>
              <Badge variant="outline">{group.entity_type}</Badge>
              {group.online_enabled && (
                <Badge variant="default" className="bg-green-500">
                  <IconCloud className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{group.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMaterialize}
            disabled={materializeMutation.isPending}
          >
            {materializeMutation.isPending ? (
              <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <IconDownload className="w-4 h-4 mr-2" />
            )}
            Materialize
          </Button>
          {group.online_enabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncOnline}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? (
                <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <IconCloudUpload className="w-4 h-4 mr-2" />
              )}
              Sync Online
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <IconTrash className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Feature Group</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{group.name}"? This action
                  cannot be undone and will remove all associated feature
                  definitions and materializations.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{definitions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Primary Key
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-mono">{group.primary_key}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Materializations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materializations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg">
              {new Date(group.updated_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="features">
        <TabsList>
          <TabsTrigger value="features">Feature Definitions</TabsTrigger>
          <TabsTrigger value="materializations">Materializations</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Feature Definitions</CardTitle>
                  <CardDescription>
                    Features defined in this group
                  </CardDescription>
                </div>
                <Link
                  href={`/data-science/feature-store/groups/${groupId}/new-feature`}
                >
                  <Button size="sm">
                    <IconEdit className="w-4 h-4 mr-2" />
                    Add Feature
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {definitions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <IconDatabase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No feature definitions yet</p>
                  <p className="text-sm">
                    Add feature definitions to start engineering features
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Transformation</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {definitions.map((def) => (
                      <TableRow key={def.id}>
                        <TableCell className="font-medium font-mono">
                          {def.name}
                        </TableCell>
                        <TableCell>{getTypeBadge(def.dtype)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {def.transform_type || "passthrough"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {def.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">Raw</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Materializations Tab */}
        <TabsContent value="materializations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Materialization History</CardTitle>
              <CardDescription>
                Recent feature materialization runs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {materializations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <IconClock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No materializations yet</p>
                  <p className="text-sm">
                    Click "Materialize" to write features to the feature store
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Store Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rows</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materializations.map((mat) => (
                      <TableRow key={mat.id}>
                        <TableCell>
                          {new Date(mat.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              mat.store_type === "online"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {mat.store_type === "online" ? (
                              <IconCloud className="w-3 h-3 mr-1" />
                            ) : (
                              <IconDatabase className="w-3 h-3 mr-1" />
                            )}
                            {mat.store_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(mat.status)}</TableCell>
                        <TableCell>
                          {mat.rows_materialized?.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {mat.started_at && mat.completed_at
                            ? `${(
                                (new Date(mat.completed_at).getTime() -
                                  new Date(mat.started_at).getTime()) /
                                1000
                              ).toFixed(1)}s`
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Group Configuration</CardTitle>
              <CardDescription>
                Settings and metadata for this feature group
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Entity Type
                  </h4>
                  <p className="font-mono">{group.entity_type}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Primary Key
                  </h4>
                  <p className="font-mono">{group.primary_key}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Event Time Column
                  </h4>
                  <p className="font-mono">
                    {group.event_time_column || "Not set"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Source Table
                  </h4>
                  <p className="font-mono">{group.source_table || "Not set"}</p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Storage Configuration</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Offline Store
                    </h4>
                    <Badge
                      variant={group.offline_enabled ? "default" : "secondary"}
                      className={group.offline_enabled ? "bg-green-500" : ""}
                    >
                      {group.offline_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Online Store
                    </h4>
                    <Badge
                      variant={group.online_enabled ? "default" : "secondary"}
                      className={group.online_enabled ? "bg-green-500" : ""}
                    >
                      {group.online_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  {group.online_enabled && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        TTL (minutes)
                      </h4>
                      <p>{group.ttl_minutes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Metadata</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Created At
                    </h4>
                    <p>{new Date(group.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Updated At
                    </h4>
                    <p>{new Date(group.updated_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
