"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconActivity,
  IconAlertCircle,
  IconCircleCheck,
  IconClock,
  IconCpu,
  IconDatabase,
  IconRefresh,
  IconTrendingUp,
  IconX,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  monitoringApi,
  SystemHealth,
  Alert,
  SystemOverview,
} from "@/lib/api/monitoring";
import { integrationApi, PipelineRun } from "@/lib/api/integration";
import { formatDistanceToNow } from "date-fns";

const chartConfig = {
  successful: {
    label: "Successful",
    color: "hsl(var(--chart-1))",
  },
  failed: {
    label: "Failed",
    color: "hsl(var(--chart-2))",
  },
  usage: {
    label: "Usage %",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

interface Activity {
  id: string;
  workflow: string;
  status: "success" | "running" | "failed";
  duration: string;
  time: string;
}

interface AlertDisplay {
  id: string;
  title: string;
  severity: "warning" | "error";
  message: string;
  time: string;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "N/A";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function MonitoringOverviewPage() {
  const [timeRange, setTimeRange] = useState("24h");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [health, setHealth] = useState<SystemHealth[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recentRuns, setRecentRuns] = useState<PipelineRun[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewData, healthData, alertsData, runsData] =
        await Promise.all([
          monitoringApi.getSystemOverview(),
          monitoringApi.getCurrentHealth(),
          monitoringApi.getAlerts({ status: "active" }),
          integrationApi.getPipelineRuns(),
        ]);

      setOverview(overviewData);
      setHealth(healthData);
      setAlerts(alertsData);
      setRecentRuns(runsData.slice(0, 5));
    } catch (err) {
      console.error("Failed to fetch monitoring data:", err);
      setError("Failed to load monitoring data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Transform data for charts
  const resourceUsageData =
    health.length > 0
      ? [
          {
            metric: "CPU",
            usage: Math.round(
              health.reduce((sum, h) => sum + (h.cpu_usage || 0), 0) /
                Math.max(health.length, 1)
            ),
          },
          {
            metric: "Memory",
            usage: Math.round(
              health.reduce((sum, h) => sum + (h.memory_usage || 0), 0) /
                Math.max(health.length, 1)
            ),
          },
          {
            metric: "Disk",
            usage: Math.round(
              health.reduce((sum, h) => sum + (h.disk_usage || 0), 0) /
                Math.max(health.length, 1)
            ),
          },
        ]
      : [];

  // Transform recent runs to activity
  const recentActivity: Activity[] = recentRuns.map((run) => ({
    id: run.id,
    workflow: run.pipeline_name || "Pipeline",
    status:
      run.status === "success"
        ? "success"
        : run.status === "failed"
        ? "failed"
        : "running",
    duration: formatDuration(run.duration),
    time: formatDistanceToNow(new Date(run.created_at), { addSuffix: true }),
  }));

  // Transform alerts for display
  const activeAlerts: AlertDisplay[] = alerts.slice(0, 5).map((alert) => ({
    id: alert.id,
    title: alert.title,
    severity:
      alert.severity === "critical" || alert.severity === "error"
        ? "error"
        : "warning",
    message: alert.description,
    time: formatDistanceToNow(new Date(alert.created_at), { addSuffix: true }),
  }));

  // Calculate stats from overview
  const stats = {
    activeWorkflows: overview?.total_pipelines || 0,
    runningJobs: overview?.running_pipelines || 0,
    successRate: overview?.total_pipelines
      ? Math.round(
          ((overview.total_pipelines - overview.failed_pipelines) /
            overview.total_pipelines) *
            1000
        ) / 10
      : 0,
    failedToday: overview?.failed_pipelines || 0,
    avgDuration: "N/A",
    dataProcessed: formatBytes(overview?.storage_used_bytes || 0),
  };

  // Generate workflow trends from recent data (placeholder since we need historical API)
  const workflowTrendsData = [
    {
      time: "Now",
      successful: recentRuns.filter((r) => r.status === "success").length,
      failed: recentRuns.filter((r) => r.status === "failed").length,
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Monitoring Overview</h1>
          <p className="text-sm text-muted-foreground">
            Platform health and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={loading}
          >
            <IconRefresh
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchData} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardContent className="pt-3 pb-3">
            {loading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Active Workflows
                  </p>
                  <p className="text-2xl font-bold">{stats.activeWorkflows}</p>
                </div>
                <IconActivity className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            {loading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Running Now</p>
                  <p className="text-2xl font-bold">{stats.runningJobs}</p>
                </div>
                <IconClock className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            {loading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-green-500">
                    {stats.successRate}%
                  </p>
                </div>
                <IconCircleCheck className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            {loading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Failed Today</p>
                  <p className="text-2xl font-bold text-red-500">
                    {stats.failedToday}
                  </p>
                </div>
                <IconAlertCircle className="h-8 w-8 text-red-500 opacity-20" />
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            {loading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Avg Duration</p>
                  <p className="text-2xl font-bold">{stats.avgDuration}</p>
                </div>
                <IconTrendingUp className="h-8 w-8 text-purple-500 opacity-20" />
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            {loading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Data Processed
                  </p>
                  <p className="text-2xl font-bold">{stats.dataProcessed}</p>
                </div>
                <IconDatabase className="h-8 w-8 text-orange-500 opacity-20" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Workflow Execution Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Executions</CardTitle>
            <CardDescription>
              Success and failure trends over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <AreaChart data={workflowTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="successful"
                  stackId="1"
                  stroke="var(--color-successful)"
                  fill="var(--color-successful)"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stackId="1"
                  stroke="var(--color-failed)"
                  fill="var(--color-failed)"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Resource Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Resource Usage</CardTitle>
            <CardDescription>
              Current system resource utilization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={resourceUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="metric"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="usage" fill="var(--color-usage)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest workflow executions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {activity.status === "success" && (
                        <IconCircleCheck className="h-5 w-5 text-green-500 flex-shrink-0" />
                      )}
                      {activity.status === "failed" && (
                        <IconX className="h-5 w-5 text-red-500 flex-shrink-0" />
                      )}
                      {activity.status === "running" && (
                        <IconClock className="h-5 w-5 text-blue-500 flex-shrink-0 animate-pulse" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {activity.workflow}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge
                        variant={
                          activity.status === "success"
                            ? "outline"
                            : activity.status === "failed"
                            ? "destructive"
                            : "default"
                        }
                        className="text-xs"
                      >
                        {activity.duration}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
            <CardDescription>Recent warnings and errors</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : activeAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No active alerts
              </p>
            ) : (
              <div className="space-y-3">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <IconAlertCircle
                      className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        alert.severity === "error"
                          ? "text-red-500"
                          : "text-orange-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <Badge
                          variant={
                            alert.severity === "error"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
