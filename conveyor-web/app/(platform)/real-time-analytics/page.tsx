"use client"

import Link from "next/link"
import {
  IconWaveSine,
  IconPlayerPlay,
  IconBolt,
  IconAlertCircle,
  IconChartLine,
  IconPlus,
  IconCheck,
  IconClock,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function RealTimeAnalyticsPage() {
  const stats = [
    { title: "Active Streams", value: "18", change: "+2 this week", icon: IconPlayerPlay },
    { title: "Events/Second", value: "8.4K", change: "Peak: 12.1K", icon: IconBolt },
    { title: "Avg Latency", value: "24ms", change: "-8ms improvement", icon: IconClock },
    { title: "Active Alerts", value: "5", change: "2 triggered", icon: IconAlertCircle },
  ]

  const activeStreams = [
    { name: "User Activity Stream", throughput: "2.4K/s", latency: "18ms", status: "healthy" as const },
    { name: "Transaction Processing", throughput: "1.8K/s", latency: "22ms", status: "healthy" as const },
    { name: "IoT Sensor Data", throughput: "3.2K/s", latency: "31ms", status: "warning" as const },
    { name: "Application Logs", throughput: "1.0K/s", latency: "15ms", status: "healthy" as const },
  ]

  const quickActions = [
    {
      title: "Streaming Jobs",
      description: "Monitor data streams",
      icon: IconPlayerPlay,
      href: "/real-time-analytics/streaming",
      color: "text-blue-500",
    },
    {
      title: "Live Dashboards",
      description: "Real-time visualizations",
      icon: IconChartLine,
      href: "/real-time-analytics/dashboards",
      color: "text-purple-500",
    },
    {
      title: "Event Streams",
      description: "View live events",
      icon: IconBolt,
      href: "/real-time-analytics/events",
      color: "text-green-500",
    },
    {
      title: "Alert Rules",
      description: "Configure alerts",
      icon: IconAlertCircle,
      href: "/real-time-analytics/alerts",
      color: "text-orange-500",
    },
  ]

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/10">
            <IconWaveSine className="h-6 w-6 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Real-Time Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Process and analyze streaming data with low-latency event processing
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/real-time-analytics/streaming">
            <IconPlus className="mr-2 h-4 w-4" />
            New Stream
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="hover:shadow-md transition-all hover:border-primary cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-opacity-10 ${action.color}`}>
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Streams</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/real-time-analytics/streaming">View All</Link>
              </Button>
            </div>
            <CardDescription>Currently running data streams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeStreams.map((stream, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <IconWaveSine className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{stream.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {stream.throughput} • {stream.latency}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={stream.status === "healthy" ? "outline" : "secondary"}
                    className="text-xs"
                  >
                    {stream.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stream Performance</CardTitle>
            <CardDescription>Real-time processing metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Throughput Utilization</span>
                  <span className="text-sm font-medium">84%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: "84%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Processing Capacity</span>
                  <span className="text-sm font-medium">72%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: "72%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Buffer Usage</span>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "45%" }} />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-violet-50 dark:bg-violet-950 rounded-lg">
              <div className="flex items-start gap-3">
                <IconBolt className="h-5 w-5 text-violet-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
                    Low Latency
                  </p>
                  <p className="text-xs text-violet-600/80 dark:text-violet-400/80 mt-1">
                    Average processing latency of 24ms across all streams
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Processing Summary</CardTitle>
          <CardDescription>Last 24 hours processing statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Successfully Processed</span>
                <span className="text-sm font-medium">647.2M events (99.8%)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "99.8%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Queued/Buffered</span>
                <span className="text-sm font-medium">842K events (0.13%)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "0.13%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Failed/Dropped</span>
                <span className="text-sm font-medium">458K events (0.07%)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: "0.07%" }} />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="flex items-start gap-3">
              <IconCheck className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  High Reliability
                </p>
                <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                  99.8% success rate with automatic retry and dead letter queue handling
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Real-Time Capabilities</CardTitle>
          <CardDescription>
            Low-latency stream processing with event detection, anomaly detection, and automated alerting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconPlayerPlay className="h-4 w-4 text-blue-500" />
                Stream Processing
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Event streaming</div>
                <div>• Real-time ETL</div>
                <div>• Windowing & aggregation</div>
                <div>• Join operations</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconChartLine className="h-4 w-4 text-purple-500" />
                Analytics & Insights
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Live dashboards</div>
                <div>• Time-series analysis</div>
                <div>• Anomaly detection</div>
                <div>• Pattern recognition</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconAlertCircle className="h-4 w-4 text-orange-500" />
                Monitoring & Alerts
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Custom alert rules</div>
                <div>• Threshold monitoring</div>
                <div>• Automated actions</div>
                <div>• Notification routing</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
