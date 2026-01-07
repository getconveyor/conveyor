"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconArrowLeft,
  IconRefresh,
  IconPlayerPlay,
  IconPlayerStop,
  IconTrash,
  IconClock,
  IconCheck,
  IconX,
  IconLoader2,
  IconAlertCircle,
  IconWand,
  IconSettings,
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
  dataScienceApi,
  FeatureEngineeringJob,
  FeatureEngineeringRun,
  FeatureGroup,
} from "@/lib/api/datascience";

export default function FeatureEngineeringJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<FeatureEngineeringJob | null>(null);
  const [runs, setRuns] = useState<FeatureEngineeringRun[]>([]);
  const [sourceGroup, setSourceGroup] = useState<FeatureGroup | null>(null);
  const [targetGroup, setTargetGroup] = useState<FeatureGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    loadData();
  }, [jobId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobData, runsData] = await Promise.all([
        dataScienceApi.getFeatureEngineeringJob(jobId),
        dataScienceApi.getFeatureEngineeringRuns({ job: jobId }),
      ]);
      setJob(jobData);
      setRuns(runsData || []);

      // Load feature group
      if (jobData.target_feature_group) {
        const tgt = await dataScienceApi.getFeatureGroup(
          jobData.target_feature_group
        );
        setTargetGroup(tgt);
      }
    } catch (error) {
      console.error("Failed to load job:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunJob = async () => {
    if (!job) return;
    try {
      setRunning(true);
      await dataScienceApi.runFeatureEngineeringJob(job.id);
      await loadData();
    } catch (error) {
      console.error("Failed to run job:", error);
    } finally {
      setRunning(false);
    }
  };

  const handleDelete = async () => {
    if (!job) return;
    try {
      await dataScienceApi.deleteFeatureEngineeringJob(job.id);
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
      case "pending":
        return (
          <Badge variant="secondary">
            <IconClock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTransformLabel = (type: string): string => {
    const labels: Record<string, string> = {
      passthrough: "Passthrough",
      standard_scale: "Standard Scaling",
      min_max_scale: "Min-Max Scaling",
      log_transform: "Log Transform",
      one_hot: "One-Hot Encoding",
      label_encode: "Label Encoding",
      bucketize: "Bucketize",
      time_since: "Time Since",
      date_parts: "Date Parts",
      rolling_agg: "Rolling Aggregation",
      custom_sql: "Custom SQL",
      custom_python: "Custom Python",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <IconAlertCircle className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Job Not Found</h2>
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
              <h1 className="text-2xl font-bold">{job.name}</h1>
              <Badge
                variant={job.status === "active" ? "default" : "secondary"}
              >
                {job.status === "active" ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-muted-foreground">{job.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <IconRefresh className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleRunJob}
            disabled={running || job.status !== "active"}
          >
            {running ? (
              <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <IconPlayerPlay className="w-4 h-4 mr-2" />
            )}
            Run Now
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <IconTrash className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Job</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{job.name}"? This action
                  cannot be undone and will remove all run history.
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
              Total Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Successful Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {runs.filter((r) => r.status === "completed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {runs.filter((r) => r.status === "failed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-mono">
              {job.schedule_cron || "Manual"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="runs">
        <TabsList>
          <TabsTrigger value="runs">Run History</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        {/* Runs Tab */}
        <TabsContent value="runs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Run History</CardTitle>
              <CardDescription>Recent execution history</CardDescription>
            </CardHeader>
            <CardContent>
              {runs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <IconClock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No runs yet</p>
                  <p className="text-sm">Click "Run Now" to execute this job</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Run ID</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rows Processed</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell className="font-mono text-sm">
                          {run.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {run.started_at
                            ? new Date(run.started_at).toLocaleString()
                            : "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(run.status)}</TableCell>
                        <TableCell>
                          {run.rows_processed?.toLocaleString() || "-"}
                        </TableCell>
                        <TableCell>
                          {run.duration_seconds
                            ? `${run.duration_seconds.toFixed(1)}s`
                            : "-"}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-red-600">
                          {run.error_message || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transformation Pipeline</CardTitle>
              <CardDescription>
                Steps in this feature engineering pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!job.feature_engineering_steps ||
              job.feature_engineering_steps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <IconWand className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No transformations defined</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {job.feature_engineering_steps.map((step, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="default">
                            {getTransformLabel(step.type)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Source:
                            </span>{" "}
                            <span className="font-mono">{step.source}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Output:
                            </span>{" "}
                            <span className="font-mono">{step.name}</span>
                          </div>
                        </div>
                        {step.config && Object.keys(step.config).length > 0 && (
                          <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">
                              Config:
                            </span>
                            <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                              {JSON.stringify(step.config, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Preparation */}
          {job.data_prep_config && (
            <Card>
              <CardHeader>
                <CardTitle>Data Preparation</CardTitle>
                <CardDescription>
                  Cleaning and preparation steps before transformation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Null Handling
                    </h4>
                    <p>
                      {job.data_prep_config.handle_nulls?.strategy || "None"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Outlier Handling
                    </h4>
                    <p>
                      {job.data_prep_config.handle_outliers?.method || "None"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Deduplication
                    </h4>
                    <p>
                      {job.data_prep_config.deduplicate
                        ? "Enabled"
                        : "Disabled"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Configuration</CardTitle>
              <CardDescription>Settings and metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Source Feature Group
                  </h4>
                  {sourceGroup ? (
                    <Link
                      href={`/data-science/feature-store/groups/${sourceGroup.id}`}
                      className="text-primary hover:underline"
                    >
                      {sourceGroup.name}
                    </Link>
                  ) : (
                    <p>Not set</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Target Feature Group
                  </h4>
                  {targetGroup ? (
                    <Link
                      href={`/data-science/feature-store/groups/${targetGroup.id}`}
                      className="text-primary hover:underline"
                    >
                      {targetGroup.name}
                    </Link>
                  ) : (
                    <p>Creates new group</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Schedule</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Cron Expression
                    </h4>
                    <p className="font-mono">
                      {job.schedule_cron || "Not scheduled"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Status
                    </h4>
                    <Badge
                      variant={
                        job.status === "active" ? "default" : "secondary"
                      }
                    >
                      {job.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Metadata</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Created At
                    </h4>
                    <p>{new Date(job.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Updated At
                    </h4>
                    <p>{new Date(job.updated_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Last Run
                    </h4>
                    <p>
                      {job.last_run_at
                        ? new Date(job.last_run_at).toLocaleString()
                        : "Never"}
                    </p>
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
