"use client"

import { useState } from "react"
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
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Stream {
  id: string
  name: string
  status: "running" | "paused" | "stopped" | "error"
  source: string
  destination: string
  throughput: string
  recordsProcessed: number
  latency: string
  errorRate: number
  uptime: string
}

const mockStreams: Stream[] = [
  {
    id: "1",
    name: "User Events Stream",
    status: "running",
    source: "Kafka: user-events",
    destination: "BigQuery: analytics.events",
    throughput: "15.2K/s",
    recordsProcessed: 12458923,
    latency: "42ms",
    errorRate: 0.02,
    uptime: "99.98%",
  },
  {
    id: "2",
    name: "Transaction Processing",
    status: "running",
    source: "Kinesis: transactions",
    destination: "Redshift: finance.transactions",
    throughput: "8.7K/s",
    recordsProcessed: 8234567,
    latency: "125ms",
    errorRate: 0.01,
    uptime: "99.99%",
  },
  {
    id: "3",
    name: "IoT Sensor Data",
    status: "running",
    source: "MQTT: sensors/*",
    destination: "TimescaleDB: iot.metrics",
    throughput: "42.1K/s",
    recordsProcessed: 45891234,
    latency: "28ms",
    errorRate: 0.05,
    uptime: "99.95%",
  },
  {
    id: "4",
    name: "Application Logs",
    status: "paused",
    source: "Fluentd: app-logs",
    destination: "Elasticsearch: logs-2024",
    throughput: "0/s",
    recordsProcessed: 3456789,
    latency: "-",
    errorRate: 0,
    uptime: "99.87%",
  },
  {
    id: "5",
    name: "CDC - User Database",
    status: "error",
    source: "PostgreSQL CDC",
    destination: "Data Lake: raw/users",
    throughput: "0/s",
    recordsProcessed: 2345678,
    latency: "-",
    errorRate: 100,
    uptime: "98.45%",
  },
]

export default function StreamingPage() {
  const [streams, setStreams] = useState<Stream[]>(mockStreams)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "text-green-500"
      case "paused":
        return "text-yellow-500"
      case "stopped":
        return "text-gray-500"
      case "error":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return "outline"
      case "paused":
        return "secondary"
      case "stopped":
        return "secondary"
      case "error":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const totalThroughput = streams
    .filter((s) => s.status === "running")
    .reduce((acc, s) => {
      const num = parseFloat(s.throughput.replace(/[^\d.]/g, ""))
      return acc + (isNaN(num) ? 0 : num)
    }, 0)

  const totalRecords = streams.reduce((acc, s) => acc + s.recordsProcessed, 0)
  const activeStreams = streams.filter((s) => s.status === "running").length
  const avgLatency =
    streams
      .filter((s) => s.latency !== "-")
      .reduce((acc, s) => acc + parseInt(s.latency), 0) /
    streams.filter((s) => s.latency !== "-").length

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
          <Button variant="outline" size="icon">
            <IconRefresh className="h-4 w-4" />
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
                <p className="text-sm text-muted-foreground">Total Throughput</p>
                <p className="text-2xl font-bold">{totalThroughput.toFixed(1)}K/s</p>
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
                <p className="text-sm text-muted-foreground">Records Processed</p>
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
          <CardDescription>Monitor and manage real-time data pipelines</CardDescription>
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
                            <Badge variant={getStatusBadge(stream.status)} className="text-xs">
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
                            <Button variant="outline" size="sm">
                              <IconPlayerPause className="h-3 w-3 mr-2" />
                              Pause
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm">
                              <IconPlayerPlay className="h-3 w-3 mr-2" />
                              Start
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <IconSettings className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-5 gap-4">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Throughput</p>
                          <p className="text-sm font-semibold">{stream.throughput}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Records</p>
                          <p className="text-sm font-semibold">
                            {(stream.recordsProcessed / 1000000).toFixed(1)}M
                          </p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Latency</p>
                          <p className="text-sm font-semibold">{stream.latency}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Error Rate</p>
                          <p
                            className={`text-sm font-semibold ${
                              stream.errorRate > 1 ? "text-red-500" : "text-green-500"
                            }`}
                          >
                            {stream.errorRate.toFixed(2)}%
                          </p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Uptime</p>
                          <p className="text-sm font-semibold">{stream.uptime}</p>
                        </div>
                      </div>

                      {/* Status Indicators */}
                      {stream.status === "running" && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Processing rate</span>
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
  )
}
