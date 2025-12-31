"use client"

import { useState } from "react"
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
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Mock data for charts
const workflowTrendsData = [
  { time: "00:00", successful: 45, failed: 2 },
  { time: "04:00", successful: 38, failed: 1 },
  { time: "08:00", successful: 67, failed: 4 },
  { time: "12:00", successful: 89, failed: 3 },
  { time: "16:00", successful: 76, failed: 5 },
  { time: "20:00", successful: 54, failed: 2 },
]

const resourceUsageData = [
  { metric: "CPU", usage: 68 },
  { metric: "Memory", usage: 72 },
  { metric: "Disk", usage: 45 },
  { metric: "Network", usage: 34 },
]

const recentActivity = [
  {
    id: "1",
    workflow: "Customer Data ETL",
    status: "success" as const,
    duration: "8m 42s",
    time: "2 minutes ago",
  },
  {
    id: "2",
    workflow: "Sales Analytics Pipeline",
    status: "running" as const,
    duration: "2m 15s",
    time: "5 minutes ago",
  },
  {
    id: "3",
    workflow: "Data Quality Check",
    status: "failed" as const,
    duration: "1m 23s",
    time: "12 minutes ago",
  },
  {
    id: "4",
    workflow: "Real-time Event Processing",
    status: "success" as const,
    duration: "Continuous",
    time: "15 minutes ago",
  },
  {
    id: "5",
    workflow: "Weekly Report Generation",
    status: "success" as const,
    duration: "15m 32s",
    time: "1 hour ago",
  },
]

const activeAlerts = [
  {
    id: "1",
    title: "High Memory Usage",
    severity: "warning" as const,
    message: "Data warehouse memory usage at 85%",
    time: "5 minutes ago",
  },
  {
    id: "2",
    title: "Workflow Failed",
    severity: "error" as const,
    message: "Data Quality Check failed on validation step",
    time: "12 minutes ago",
  },
  {
    id: "3",
    title: "Slow Query Detected",
    severity: "warning" as const,
    message: "Query execution time exceeded threshold (45s)",
    time: "1 hour ago",
  },
]

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
} satisfies ChartConfig

export default function MonitoringOverviewPage() {
  const [timeRange, setTimeRange] = useState("24h")

  const stats = {
    activeWorkflows: 12,
    runningJobs: 3,
    successRate: 96.8,
    failedToday: 7,
    avgDuration: "8m 24s",
    dataProcessed: "2.4 TB",
  }

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
          <Button variant="outline" size="icon">
            <IconRefresh className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Workflows</p>
                <p className="text-2xl font-bold">{stats.activeWorkflows}</p>
              </div>
              <IconActivity className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Running Now</p>
                <p className="text-2xl font-bold">{stats.runningJobs}</p>
              </div>
              <IconClock className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-500">{stats.successRate}%</p>
              </div>
              <IconCircleCheck className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Failed Today</p>
                <p className="text-2xl font-bold text-red-500">{stats.failedToday}</p>
              </div>
              <IconAlertCircle className="h-8 w-8 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold">{stats.avgDuration}</p>
              </div>
              <IconTrendingUp className="h-8 w-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Data Processed</p>
                <p className="text-2xl font-bold">{stats.dataProcessed}</p>
              </div>
              <IconDatabase className="h-8 w-8 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Workflow Execution Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Executions</CardTitle>
            <CardDescription>Success and failure trends over time</CardDescription>
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
            <CardDescription>Current system resource utilization</CardDescription>
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
                      <p className="text-sm font-medium truncate">{activity.workflow}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
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
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
            <CardDescription>Recent warnings and errors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50"
                >
                  <IconAlertCircle
                    className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                      alert.severity === "error" ? "text-red-500" : "text-orange-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <Badge
                        variant={alert.severity === "error" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
