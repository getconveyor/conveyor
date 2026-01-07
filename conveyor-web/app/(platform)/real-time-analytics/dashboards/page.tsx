"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconPlus,
  IconLayoutDashboard,
  IconRefresh,
  IconSettings,
  IconTrendingUp,
  IconTrendingDown,
  IconUsers,
  IconShoppingCart,
  IconCurrencyDollar,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  streamingApi,
  StreamDashboard,
  StreamEvent,
} from "@/lib/api/streaming";
import { formatDistanceToNow } from "date-fns";

const chartConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--chart-1))",
  },
  users: {
    label: "Users",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function RealTimeDashboardsPage() {
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<StreamDashboard | null>(null);
  const [events, setEvents] = useState<StreamEvent[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashboardData, eventsData] = await Promise.all([
        streamingApi.getDashboard(),
        streamingApi.getEvents({ hours: 0.25 }), // Last 15 minutes
      ]);
      setDashboard(dashboardData);
      setEvents(eventsData.slice(0, 6));
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh when live
    if (isLive) {
      const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchData, isLive]);

  // Generate chart data from dashboard metrics
  const realtimeData = [
    { time: "Now", value: dashboard?.total_throughput || 0 },
  ];

  const trafficData = [
    { time: "Now", users: dashboard?.running_pipelines || 0 },
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Real-time Dashboards</h1>
          <p className="text-sm text-muted-foreground">
            Live metrics and instant data visualization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isLive ? "default" : "outline"}
            size="sm"
            onClick={() => setIsLive(!isLive)}
          >
            <IconActivity
              className={`h-4 w-4 mr-2 ${isLive ? "animate-pulse" : ""}`}
            />
            {isLive ? "Live" : "Paused"}
          </Button>
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
          <Button variant="outline" size="icon">
            <IconSettings className="h-4 w-4" />
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

      {/* Live Metrics */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Running Pipelines
                  </p>
                  <p className="text-2xl font-semibold">
                    {dashboard?.running_pipelines || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {dashboard?.total_pipelines || 0} total
                  </p>
                </div>
                <IconActivity className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Throughput</p>
                  <p className="text-2xl font-semibold">
                    {dashboard?.total_throughput?.toFixed(1) || 0}/s
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Records per second
                  </p>
                </div>
                <IconTrendingUp className="h-8 w-8 text-purple-500 opacity-20" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Latency</p>
                  <p className="text-2xl font-semibold">
                    {dashboard?.avg_latency_ms?.toFixed(0) || 0}ms
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Processing delay
                  </p>
                </div>
                <IconCurrencyDollar className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Alerts</p>
                  <p
                    className={`text-2xl font-bold ${
                      (dashboard?.active_alerts || 0) > 0
                        ? "text-orange-500"
                        : ""
                    }`}
                  >
                    {dashboard?.active_alerts || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requires attention
                  </p>
                </div>
                <IconUsers className="h-8 w-8 text-orange-500 opacity-20" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Real-time Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Live Activity</CardTitle>
                <CardDescription>Events per minute</CardDescription>
              </div>
              {isLive && (
                <Badge variant="outline" className="text-xs">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2" />
                  Live
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <LineChart data={realtimeData}>
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
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Traffic Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Users</CardTitle>
                <CardDescription>Last 90 minutes</CardDescription>
              </div>
              {isLive && (
                <Badge variant="outline" className="text-xs">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2" />
                  Live
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="var(--color-users)"
                  fill="var(--color-users)"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Live Activity Feed</CardTitle>
          <CardDescription>Recent events as they happen</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent events
            </p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        event.event_type.includes("error")
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {event.event_type
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.event_time), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                  {event.pipeline_name && (
                    <Badge variant="outline" className="text-xs">
                      {event.pipeline_name}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
