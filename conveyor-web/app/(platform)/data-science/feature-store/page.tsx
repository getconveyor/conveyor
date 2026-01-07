"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  IconDatabase,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconFilter,
  IconSettings,
  IconCloud,
  IconCloudUpload,
  IconChartBar,
  IconTable,
  IconClock,
  IconCheck,
  IconAlertCircle,
  IconLoader2,
  IconArrowRight,
  IconBrain,
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  dataScienceApi,
  FeatureGroup,
  FeatureEngineeringJob,
  FeatureMaterialization,
  FeatureStoreSummary,
  TrainingDataset,
} from "@/lib/api/datascience";

export default function FeatureStorePage() {
  const [loading, setLoading] = useState(true);
  const [featureGroups, setFeatureGroups] = useState<FeatureGroup[]>([]);
  const [engineeringJobs, setEngineeringJobs] = useState<
    FeatureEngineeringJob[]
  >([]);
  const [trainingDatasets, setTrainingDatasets] = useState<TrainingDataset[]>(
    []
  );
  const [summary, setSummary] = useState<FeatureStoreSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [groupsRes, jobsRes, datasetsRes, summaryRes] = await Promise.all([
        dataScienceApi.getFeatureGroups(),
        dataScienceApi.getFeatureEngineeringJobs(),
        dataScienceApi.getTrainingDatasets(),
        dataScienceApi.getFeatureStoreSummary(),
      ]);
      setFeatureGroups(groupsRes || []);
      setEngineeringJobs(jobsRes || []);
      setTrainingDatasets(datasetsRes || []);
      setSummary(summaryRes);
    } catch (error) {
      console.error("Failed to load feature store data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredGroups = featureGroups.filter((group) => {
    const matchesSearch =
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "online" && group.online_enabled) ||
      (statusFilter === "offline" && !group.online_enabled);
    return matchesSearch && matchesStatus;
  });

  const stats = [
    {
      title: "Feature Groups",
      value: summary?.total_feature_groups?.toString() || "0",
      description: "Organized feature collections",
      icon: IconDatabase,
      color: "text-blue-500",
    },
    {
      title: "Total Features",
      value: summary?.total_features?.toString() || "0",
      description: "Individual features",
      icon: IconTable,
      color: "text-green-500",
    },
    {
      title: "Feature Views",
      value: summary?.total_feature_views?.toString() || "0",
      description: "Composed feature sets",
      icon: IconChartBar,
      color: "text-purple-500",
    },
    {
      title: "Training Datasets",
      value: summary?.total_training_datasets?.toString() || "0",
      description: "Ready for ML training",
      icon: IconBrain,
      color: "text-orange-500",
    },
  ];

  const getStatusBadge = (group: FeatureGroup) => {
    if (group.online_enabled) {
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <IconCloud className="w-3 h-3 mr-1" />
          Online
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <IconDatabase className="w-3 h-3 mr-1" />
        Offline
      </Badge>
    );
  };

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "paused":
        return <Badge variant="secondary">Paused</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <IconLoader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feature Store</h1>
          <p className="text-muted-foreground">
            Manage features for ML training and serving
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <IconRefresh className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href="/data-science/feature-store/new-group">
            <Button>
              <IconPlus className="w-4 h-4 mr-2" />
              New Feature Group
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="groups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="groups">Feature Groups</TabsTrigger>
          <TabsTrigger value="engineering">Feature Engineering</TabsTrigger>
          <TabsTrigger value="datasets">Training Datasets</TabsTrigger>
        </TabsList>

        {/* Feature Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search feature groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="online">Online Enabled</SelectItem>
                    <SelectItem value="offline">Offline Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Feature Groups Table */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Groups</CardTitle>
              <CardDescription>
                Collections of related features for entities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rows</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <IconDatabase className="w-8 h-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            No feature groups found
                          </p>
                          <Link href="/data-science/feature-store/new-group">
                            <Button variant="outline" size="sm">
                              <IconPlus className="w-4 h-4 mr-2" />
                              Create Feature Group
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGroups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>
                          <Link
                            href={`/data-science/feature-store/groups/${group.id}`}
                            className="font-medium hover:underline"
                          >
                            {group.name}
                          </Link>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {group.description}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{group.entity_type}</Badge>
                        </TableCell>
                        <TableCell>{group.feature_count}</TableCell>
                        <TableCell>{getStatusBadge(group)}</TableCell>
                        <TableCell>
                          {group.row_count?.toLocaleString() || "-"}
                        </TableCell>
                        <TableCell>
                          {group.last_updated_at
                            ? new Date(
                                group.last_updated_at
                              ).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/data-science/feature-store/groups/${group.id}`}
                            >
                              <Button variant="ghost" size="sm">
                                <IconArrowRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Engineering Tab */}
        <TabsContent value="engineering" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">
                Feature Engineering Jobs
              </h3>
              <p className="text-sm text-muted-foreground">
                Automated pipelines for feature computation
              </p>
            </div>
            <Link href="/data-science/feature-store/new-job">
              <Button>
                <IconPlus className="w-4 h-4 mr-2" />
                New Engineering Job
              </Button>
            </Link>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Target Group</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {engineeringJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <IconSettings className="w-8 h-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            No feature engineering jobs
                          </p>
                          <Link href="/data-science/feature-store/new-job">
                            <Button variant="outline" size="sm">
                              <IconPlus className="w-4 h-4 mr-2" />
                              Create Job
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    engineeringJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <Link
                            href={`/data-science/feature-store/jobs/${job.id}`}
                            className="font-medium hover:underline"
                          >
                            {job.name}
                          </Link>
                        </TableCell>
                        <TableCell>{job.target_feature_group_name}</TableCell>
                        <TableCell>{getJobStatusBadge(job.status)}</TableCell>
                        <TableCell>
                          {job.last_run_at
                            ? new Date(job.last_run_at).toLocaleString()
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          {job.total_runs > 0 ? (
                            <div className="flex items-center gap-2">
                              <Progress
                                value={
                                  (job.successful_runs / job.total_runs) * 100
                                }
                                className="w-16 h-2"
                              />
                              <span className="text-sm">
                                {Math.round(
                                  (job.successful_runs / job.total_runs) * 100
                                )}
                                %
                              </span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await dataScienceApi.runFeatureEngineeringJob(
                                  job.id
                                );
                                loadData();
                              } catch (error) {
                                console.error("Failed to run job:", error);
                              }
                            }}
                          >
                            Run Now
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Datasets Tab */}
        <TabsContent value="datasets" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Training Datasets</h3>
              <p className="text-sm text-muted-foreground">
                Prepared datasets ready for ML model training
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Feature View</TableHead>
                    <TableHead>Rows</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainingDatasets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <IconBrain className="w-8 h-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            No training datasets yet
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Create a training dataset from a feature view
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    trainingDatasets.map((dataset) => (
                      <TableRow key={dataset.id}>
                        <TableCell className="font-medium">
                          {dataset.name}
                        </TableCell>
                        <TableCell>{dataset.feature_view_name}</TableCell>
                        <TableCell>
                          {(dataset as any).row_count?.toLocaleString() || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{dataset.format}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(dataset.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const result =
                                  await dataScienceApi.downloadTrainingDataset(
                                    dataset.id
                                  );
                                window.open(result.url, "_blank");
                              } catch (error) {
                                console.error("Download failed:", error);
                              }
                            }}
                          >
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/data-science/feature-store/new-group">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <IconDatabase className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    Create Feature Group
                  </CardTitle>
                  <CardDescription>
                    Define a new collection of features
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/data-science/feature-store/new-job">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <IconSettings className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    Feature Engineering Job
                  </CardTitle>
                  <CardDescription>
                    Automate feature computation pipeline
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/data-science/feature-store/online-store">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <IconCloud className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Online Store</CardTitle>
                  <CardDescription>
                    Configure low-latency feature serving
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  );
}
