"use client"

import { useState } from "react"
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
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Mock data for CPU usage over time
const cpuData = [
  { time: "00:00", usage: 45 },
  { time: "04:00", usage: 38 },
  { time: "08:00", usage: 67 },
  { time: "12:00", usage: 72 },
  { time: "16:00", usage: 68 },
  { time: "20:00", usage: 54 },
]

const memoryData = [
  { time: "00:00", usage: 62 },
  { time: "04:00", usage: 58 },
  { time: "08:00", usage: 71 },
  { time: "12:00", usage: 75 },
  { time: "16:00", usage: 73 },
  { time: "20:00", usage: 65 },
]

interface ServiceStatus {
  name: string
  status: "healthy" | "degraded" | "down"
  uptime: string
  responseTime: string
  lastCheck: string
}

const services: ServiceStatus[] = [
  {
    name: "API Gateway",
    status: "healthy",
    uptime: "99.9%",
    responseTime: "45ms",
    lastCheck: "30s ago",
  },
  {
    name: "Data Warehouse",
    status: "healthy",
    uptime: "99.8%",
    responseTime: "120ms",
    lastCheck: "1m ago",
  },
  {
    name: "Processing Engine",
    status: "healthy",
    uptime: "99.5%",
    responseTime: "200ms",
    lastCheck: "45s ago",
  },
  {
    name: "Cache Layer",
    status: "degraded",
    uptime: "98.2%",
    responseTime: "850ms",
    lastCheck: "2m ago",
  },
  {
    name: "Message Queue",
    status: "healthy",
    uptime: "99.9%",
    responseTime: "15ms",
    lastCheck: "1m ago",
  },
  {
    name: "Object Storage",
    status: "healthy",
    uptime: "99.7%",
    responseTime: "95ms",
    lastCheck: "30s ago",
  },
]

const databaseMetrics = [
  { name: "Active Connections", value: 245, max: 500, percentage: 49 },
  { name: "Query Throughput", value: "1.2K/s", trend: "up" },
  { name: "Avg Query Time", value: "125ms", trend: "down" },
  { name: "Cache Hit Rate", value: "94.5%", trend: "up" },
  { name: "Replication Lag", value: "< 1s", trend: "stable" },
  { name: "Table Size", value: "2.4 TB", trend: "up" },
]

const chartConfig = {
  usage: {
    label: "Usage %",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export default function SystemHealthPage() {
  const [timeRange, setTimeRange] = useState("24h")

  const resourceMetrics = {
    cpu: { usage: 68, trend: 2.3, status: "normal" },
    memory: { usage: 72, trend: -1.2, status: "warning" },
    disk: { usage: 45, trend: 0.5, status: "normal" },
    network: { usage: 34, trend: 1.8, status: "normal" },
  }

  const getStatusColor = (status: "healthy" | "degraded" | "down") => {
    switch (status) {
      case "healthy":
        return "text-green-500"
      case "degraded":
        return "text-orange-500"
      case "down":
        return "text-red-500"
    }
  }

  const getStatusBadge = (status: "healthy" | "degraded" | "down") => {
    switch (status) {
      case "healthy":
        return "outline"
      case "degraded":
        return "secondary"
      case "down":
        return "destructive"
    }
  }

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
          <Button variant="outline" size="icon">
            <IconRefresh className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Resource Metrics */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <IconCpu className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">CPU</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                {resourceMetrics.cpu.trend > 0 ? (
                  <IconTrendingUp className="h-3 w-3 text-red-500" />
                ) : (
                  <IconTrendingDown className="h-3 w-3 text-green-500" />
                )}
                <span className={resourceMetrics.cpu.trend > 0 ? "text-red-500" : "text-green-500"}>
                  {Math.abs(resourceMetrics.cpu.trend)}%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{resourceMetrics.cpu.usage}%</span>
              </div>
              <Progress value={resourceMetrics.cpu.usage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <IconServer className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium">Memory</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                {resourceMetrics.memory.trend > 0 ? (
                  <IconTrendingUp className="h-3 w-3 text-red-500" />
                ) : (
                  <IconTrendingDown className="h-3 w-3 text-green-500" />
                )}
                <span className={resourceMetrics.memory.trend > 0 ? "text-red-500" : "text-green-500"}>
                  {Math.abs(resourceMetrics.memory.trend)}%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{resourceMetrics.memory.usage}%</span>
              </div>
              <Progress value={resourceMetrics.memory.usage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <IconDatabase className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-medium">Disk</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                {resourceMetrics.disk.trend > 0 ? (
                  <IconTrendingUp className="h-3 w-3 text-red-500" />
                ) : (
                  <IconTrendingDown className="h-3 w-3 text-green-500" />
                )}
                <span className={resourceMetrics.disk.trend > 0 ? "text-red-500" : "text-green-500"}>
                  {Math.abs(resourceMetrics.disk.trend)}%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{resourceMetrics.disk.usage}%</span>
              </div>
              <Progress value={resourceMetrics.disk.usage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <IconCloud className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Network</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                {resourceMetrics.network.trend > 0 ? (
                  <IconTrendingUp className="h-3 w-3 text-red-500" />
                ) : (
                  <IconTrendingDown className="h-3 w-3 text-green-500" />
                )}
                <span className={resourceMetrics.network.trend > 0 ? "text-red-500" : "text-green-500"}>
                  {Math.abs(resourceMetrics.network.trend)}%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{resourceMetrics.network.usage}%</span>
              </div>
              <Progress value={resourceMetrics.network.usage} className="h-2" />
            </div>
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
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {service.status === "healthy" ? (
                      <IconCircleCheck className={`h-5 w-5 ${getStatusColor(service.status)}`} />
                    ) : service.status === "degraded" ? (
                      <IconAlertCircle className={`h-5 w-5 ${getStatusColor(service.status)}`} />
                    ) : (
                      <IconActivity className={`h-5 w-5 ${getStatusColor(service.status)}`} />
                    )}
                    <div>
                      <p className="text-sm font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {service.responseTime} • Last check: {service.lastCheck}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={getStatusBadge(service.status)} className="text-xs">
                      {service.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{service.uptime}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Database Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Database Performance</CardTitle>
            <CardDescription>Key database metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {databaseMetrics.map((metric, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">{metric.name}</span>
                    <span className="text-sm font-medium">{metric.value}</span>
                  </div>
                  {metric.max && metric.percentage !== undefined && (
                    <Progress value={metric.percentage} className="h-1.5" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
