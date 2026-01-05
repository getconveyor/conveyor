"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconCpu,
  IconDatabase,
  IconServer,
  IconCloud,
  IconRefresh,
  IconCircleCheck,
  IconAlertCircle,
  IconTrendingUp,
  IconTrendingDown,
  IconActivity,
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { monitoringApi, SystemHealth } from "@/lib/api/monitoring";
import { formatDistanceToNow } from "date-fns";

interface ServiceStatus {
  name: string;
  status: "healthy" | "degraded" | "down" | "unknown";
  uptime: string;
  responseTime: string;
  lastCheck: string;
}

const chartConfig = {
  usage: {
    label: "Usage %",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function SystemHealthPage() {
  const [timeRange, setTimeRange] = useState("24h");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<SystemHealth[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const healthData = await monitoringApi.getCurrentHealth();
      setHealth(healthData);
    } catch (err) {
      console.error("Failed to fetch health data:", err);
      setError("Failed to load health data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Transform health data into services
  const services: ServiceStatus[] = health.map((h) => ({
    name: h.service,
    status: h.status === "unhealthy" ? "down" : h.status,
    uptime: "N/A",
    responseTime: h.response_time_ms ? `${h.response_time_ms}ms` : "N/A",
    lastCheck: formatDistanceToNow(new Date(h.checked_at), { addSuffix: true }),
  }));

  // Calculate resource metrics from health data
  const avgCpu =
    health.length > 0
      ? Math.round(
          health.reduce((sum, h) => sum + (h.cpu_usage || 0), 0) / health.length
        )
      : 0;
  const avgMemory =
    health.length > 0
      ? Math.round(
          health.reduce((sum, h) => sum + (h.memory_usage || 0), 0) /
            health.length
        )
      : 0;
  const avgDisk =
    health.length > 0
      ? Math.round(
          health.reduce((sum, h) => sum + (h.disk_usage || 0), 0) /
            health.length
        )
      : 0;

  const resourceMetrics = {
    cpu: {
      usage: avgCpu,
      trend: 0,
      status: avgCpu > 80 ? "warning" : "normal",
    },
    memory: {
      usage: avgMemory,
      trend: 0,
      status: avgMemory > 80 ? "warning" : "normal",
    },
    disk: {
      usage: avgDisk,
      trend: 0,
      status: avgDisk > 80 ? "warning" : "normal",
    },
    network: { usage: 0, trend: 0, status: "normal" },
  };

  // Generate chart data from current metrics (simplified since we don't have historical)
  const cpuData = [{ time: "Now", usage: avgCpu }];
  const memoryData = [{ time: "Now", usage: avgMemory }];

  // Database metrics from health data or defaults
  const databaseMetrics = [
    {
      name: "Active Services",
      value: health.length.toString(),
      max: undefined,
      percentage: undefined,
    },
    {
      name: "Healthy Services",
      value: health.filter((h) => h.status === "healthy").length.toString(),
      trend: "stable",
    },
    {
      name: "Degraded Services",
      value: health.filter((h) => h.status === "degraded").length.toString(),
      trend: "stable",
    },
    {
      name: "Avg Response Time",
      value:
        health.length > 0
          ? `${Math.round(
              health.reduce((sum, h) => sum + (h.response_time_ms || 0), 0) /
                health.length
            )}ms`
          : "N/A",
      trend: "stable",
    },
  ];

  const getStatusColor = (
    status: "healthy" | "degraded" | "down" | "unknown"
  ) => {
    switch (status) {
      case "healthy":
        return "text-green-500";
      case "degraded":
        return "text-orange-500";
      case "down":
        return "text-red-500";
      case "unknown":
        return "text-gray-500";
    }
  };

  const getStatusBadge = (
    status: "healthy" | "degraded" | "down" | "unknown"
  ) => {
    switch (status) {
      case "healthy":
        return "outline";
      case "degraded":
        return "secondary";
      case "down":
      case "unknown":
        return "destructive";
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Health</h1>
          <p className="text-sm text-muted-foreground">
            Infrastructure and resource monitoring
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

      {/* Resource Metrics */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="pt-3 pb-3">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <IconCpu className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium">CPU</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {resourceMetrics.cpu.usage}%
                    </span>
                  </div>
                  <Progress value={resourceMetrics.cpu.usage} className="h-2" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-3 pb-3">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <IconServer className="h-5 w-5 text-purple-500" />
                    <span className="text-sm font-medium">Memory</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {resourceMetrics.memory.usage}%
                    </span>
                  </div>
                  <Progress
                    value={resourceMetrics.memory.usage}
                    className="h-2"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-3 pb-3">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <IconDatabase className="h-5 w-5 text-orange-500" />
                    <span className="text-sm font-medium">Disk</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {resourceMetrics.disk.usage}%
                    </span>
                  </div>
                  <Progress
                    value={resourceMetrics.disk.usage}
                    className="h-2"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-3 pb-3">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <IconCloud className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium">Network</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {resourceMetrics.network.usage}%
                    </span>
                  </div>
                  <Progress
                    value={resourceMetrics.network.usage}
                    className="h-2"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* CPU Usage Trend */}
        <Card>
          <CardHeader>
            <CardTitle>CPU Usage Trend</CardTitle>
            <CardDescription>CPU utilization over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <LineChart data={cpuData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="usage"
                  stroke="var(--color-usage)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Memory Usage Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Memory Usage Trend</CardTitle>
            <CardDescription>Memory utilization over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <LineChart data={memoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="usage"
                  stroke="var(--color-usage)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Service Status */}
        <Card>
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
            <CardDescription>Health check for all services</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : services.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No services found
              </p>
            ) : (
              <div className="space-y-3">
                {services.map((service) => (
                  <div
                    key={service.name}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {service.status === "healthy" ? (
                        <IconCircleCheck
                          className={`h-5 w-5 ${getStatusColor(
                            service.status
                          )}`}
                        />
                      ) : service.status === "degraded" ? (
                        <IconAlertCircle
                          className={`h-5 w-5 ${getStatusColor(
                            service.status
                          )}`}
                        />
                      ) : (
                        <IconActivity
                          className={`h-5 w-5 ${getStatusColor(
                            service.status
                          )}`}
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium">{service.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {service.responseTime} • Last check:{" "}
                          {service.lastCheck}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={getStatusBadge(service.status)}
                        className="text-xs"
                      >
                        {service.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {service.uptime}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Service Metrics</CardTitle>
            <CardDescription>Key service metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {databaseMetrics.map((metric, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">
                        {metric.name}
                      </span>
                      <span className="text-sm font-medium">
                        {metric.value}
                      </span>
                    </div>
                    {metric.max && metric.percentage !== undefined && (
                      <Progress value={metric.percentage} className="h-1.5" />
                    )}
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
