"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconRefresh,
  IconSettings,
  IconActivity,
  IconClock,
  IconDatabase,
  IconChartLine,
  IconAlertTriangle,
  IconCircleCheck,
  IconTrendingUp,
  IconTrendingDown,
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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  streamingApi,
  StreamPipeline,
  StreamDashboard,
  StreamSource,
} from "@/lib/api/streaming";

interface Stream {
  id: string;
  name: string;
  status: "running" | "stopped" | "error" | "starting" | "stopping";
  source: string;
  destination: string;
  throughput: string;
  recordsProcessed: number;
  latency: string;
  errorRate: number;
  uptime: string;
}

// Convert StreamPipeline to Stream format
function pipelineToStream(pipeline: StreamPipeline): Stream {
  const metrics = pipeline.metrics || {};
  const throughput = metrics.throughput_per_second || 0;
  const latency = metrics.latency_ms || 0;
  const records = metrics.records_processed || 0;
  const failed = metrics.records_failed || 0;
  const errorRate = records > 0 ? (failed / records) * 100 : 0;
  const uptime = metrics.uptime_seconds || 0;
  const uptimeHours = uptime / 3600;
  const uptimePercent =
    uptimeHours > 0
      ? Math.min(99.99, 100 - (failed / Math.max(1, records)) * 100)
      : 0;

  return {
    id: pipeline.id,
    name: pipeline.name,
    status: pipeline.status as Stream["status"],
    source: pipeline.source_name || "Unknown",
    destination: pipeline.destination_config?.type || "Unknown",
    throughput:
      throughput > 1000
        ? `${(throughput / 1000).toFixed(1)}K/s`
        : `${throughput}/s`,
    recordsProcessed: records,
    latency: latency > 0 ? `${latency}ms` : "-",
    errorRate: errorRate,
    uptime: `${uptimePercent.toFixed(2)}%`,
  };
}

export default function StreamingPage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [dashboard, setDashboard] = useState<StreamDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [pipelinesData, dashboardData] = await Promise.all([
        streamingApi.getPipelines(),
        streamingApi.getDashboard(),
      ]);
      setStreams(pipelinesData.map(pipelineToStream));
      setDashboard(dashboardData);
    } catch (err) {
      console.error("Failed to fetch streaming data:", err);
      setError("Failed to load streaming data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const togglePipeline = async (id: string, currentStatus: string) => {
    try {
      if (currentStatus === "running") {
        await streamingApi.stopPipeline(id);
        setStreams(
          streams.map((s) => (s.id === id ? { ...s, status: "stopped" } : s))
        );
      } else {
        await streamingApi.startPipeline(id);
        setStreams(
          streams.map((s) => (s.id === id ? { ...s, status: "starting" } : s))
        );
      }
    } catch (err) {
      console.error("Failed to toggle pipeline:", err);
    }
  };

  const restartPipeline = async (id: string) => {
    try {
      await streamingApi.restartPipeline(id);
      setStreams(
        streams.map((s) => (s.id === id ? { ...s, status: "starting" } : s))
      );
    } catch (err) {
      console.error("Failed to restart pipeline:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "text-green-500";
      case "stopped":
      case "stopping":
        return "text-gray-500";
      case "starting":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return "outline";
      case "stopped":
      case "stopping":
        return "secondary";
      case "starting":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const activeStreams =
    dashboard?.running_pipelines ||
    streams.filter((s) => s.status === "running").length;
  const totalThroughput =
    dashboard?.total_throughput ||
    streams
      .filter((s) => s.status === "running")
      .reduce((acc, s) => {
        const num = parseFloat(s.throughput.replace(/[^\d.]/g, ""));
        return acc + (isNaN(num) ? 0 : num);
      }, 0);
  const avgLatency =
    dashboard?.avg_latency_ms ||
    streams
      .filter((s) => s.latency !== "-")
      .reduce((acc, s) => acc + parseInt(s.latency), 0) /
      Math.max(1, streams.filter((s) => s.latency !== "-").length);
  const totalRecords = streams.reduce((acc, s) => acc + s.recordsProcessed, 0);

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Streaming Data</h1>
            <p className="text-sm text-muted-foreground">
              Real-time data streams and processing pipelines
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Streaming Data</h1>
            <p className="text-sm text-muted-foreground">
              Real-time data streams and processing pipelines
            </p>
          </div>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchData} className="mt-4">
              <IconRefresh className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Streaming Data</h1>
          <p className="text-sm text-muted-foreground">
            Real-time data streams and processing pipelines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}>
            <IconRefresh
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button variant="outline" size="icon">
            <IconSettings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Streams</p>
                <p className="text-2xl font-bold">{activeStreams}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {streams.length} total
                </p>
              </div>
              <IconActivity className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Throughput
                </p>
                <p className="text-2xl font-bold">
                  {totalThroughput.toFixed(1)}K/s
                </p>
                <div className="flex items-center gap-1 text-xs text-green-500 mt-1">
                  <IconTrendingUp className="h-3 w-3" />
                  <span>12.5%</span>
                </div>
              </div>
              <IconChartLine className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Latency</p>
                <p className="text-2xl font-bold">{Math.round(avgLatency)}ms</p>
                <div className="flex items-center gap-1 text-xs text-green-500 mt-1">
                  <IconTrendingDown className="h-3 w-3" />
                  <span>3.2%</span>
                </div>
              </div>
              <IconClock className="h-8 w-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Records Processed
                </p>
                <p className="text-2xl font-bold">
                  {(totalRecords / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-muted-foreground mt-1">Last 24h</p>
              </div>
              <IconDatabase className="h-8 w-8 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Streams */}
      <Card>
        <CardHeader>
          <CardTitle>Active Data Streams</CardTitle>
          <CardDescription>
            Monitor and manage real-time data pipelines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {streams.map((stream) => (
                <Card key={stream.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{stream.name}</h3>
                            <Badge
                              variant={getStatusBadge(stream.status)}
                              className="text-xs"
                            >
                              {stream.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{stream.source}</span>
                            <span>→</span>
                            <span>{stream.destination}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {stream.status === "running" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                togglePipeline(stream.id, stream.status)
                              }
                            >
                              <IconPlayerPause className="h-3 w-3 mr-2" />
                              Stop
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                togglePipeline(stream.id, stream.status)
                              }
                              disabled={
                                stream.status === "starting" ||
                                stream.status === "stopping"
                              }
                            >
                              <IconPlayerPlay className="h-3 w-3 mr-2" />
                              {stream.status === "starting"
                                ? "Starting..."
                                : "Start"}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => restartPipeline(stream.id)}
                            disabled={
                              stream.status !== "running" &&
                              stream.status !== "error"
                            }
                          >
                            <IconRefresh className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-5 gap-4">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">
                            Throughput
                          </p>
                          <p className="text-sm font-semibold">
                            {stream.throughput}
                          </p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">
                            Records
                          </p>
                          <p className="text-sm font-semibold">
                            {(stream.recordsProcessed / 1000000).toFixed(1)}M
                          </p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">
                            Latency
                          </p>
                          <p className="text-sm font-semibold">
                            {stream.latency}
                          </p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">
                            Error Rate
                          </p>
                          <p
                            className={`text-sm font-semibold ${
                              stream.errorRate > 1
                                ? "text-red-500"
                                : "text-green-500"
                            }`}
                          >
                            {stream.errorRate.toFixed(2)}%
                          </p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">
                            Uptime
                          </p>
                          <p className="text-sm font-semibold">
                            {stream.uptime}
                          </p>
                        </div>
                      </div>

                      {/* Status Indicators */}
                      {stream.status === "running" && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Processing rate
                            </span>
                            <span className="font-medium">85%</span>
                          </div>
                          <Progress value={85} className="h-2" />
                        </div>
                      )}

                      {stream.status === "error" && (
                        <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                          <IconAlertTriangle className="h-4 w-4 text-destructive" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-destructive">
                              Connection Error
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Unable to connect to source database
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Retry
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
