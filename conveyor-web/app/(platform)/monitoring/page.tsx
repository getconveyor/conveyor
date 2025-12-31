"use client"

import Link from "next/link"
import {
  IconActivity,
  IconPlayerPlay,
  IconAlertTriangle,
  IconFileText,
  IconChartLine,
  IconClock,
  IconCheck,
  IconX,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function MonitoringPage() {
  const stats = [
    { title: "System Health", value: "98.7%", change: "All systems operational", icon: IconCheck },
    { title: "Pipeline Runs", value: "1,847", change: "+124 today", icon: IconPlayerPlay },
    { title: "Active Alerts", value: "3", change: "1 critical", icon: IconAlertTriangle },
    { title: "Avg Response Time", value: "142ms", change: "-23ms improvement", icon: IconClock },
  ]

  const recentAlerts = [
    {
      title: "High CPU Usage",
      resource: "warehouse-cluster-01",
      severity: "warning" as const,
      time: "2 min ago",
      status: "active" as const
    },
    {
      title: "Pipeline Failed",
      resource: "customer-sync-pipeline",
      severity: "critical" as const,
      time: "15 min ago",
      status: "active" as const
    },
    {
      title: "Slow Query Detected",
      resource: "analytics-warehouse",
      severity: "warning" as const,
      time: "1 hour ago",
      status: "resolved" as const
    },
    {
      title: "Storage Threshold",
      resource: "data-lake-storage",
      severity: "info" as const,
      time: "2 hours ago",
      status: "resolved" as const
    },
  ]

  const quickActions = [
    {
      title: "System Health",
      description: "View platform status",
      icon: IconActivity,
      href: "/monitoring/health",
      color: "text-blue-500",
    },
    {
      title: "Pipeline Runs",
      description: "Monitor executions",
      icon: IconPlayerPlay,
      href: "/monitoring/pipelines",
      color: "text-purple-500",
    },
    {
      title: "Alert Manager",
      description: "Configure alerts",
      icon: IconAlertTriangle,
      href: "/monitoring/alerts",
      color: "text-orange-500",
    },
    {
      title: "View Logs",
      description: "Browse system logs",
      icon: IconFileText,
      href: "/monitoring/logs",
      color: "text-green-500",
    },
  ]

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10">
            <IconActivity className="h-6 w-6 text-cyan-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Monitoring</h1>
            <p className="text-sm text-muted-foreground">
              Track platform health, pipeline execution, and performance metrics
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/monitoring/alerts">
            <IconAlertTriangle className="mr-2 h-4 w-4" />
            View Alerts
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
              <CardTitle>Recent Alerts</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/monitoring/alerts">View All</Link>
              </Button>
            </div>
            <CardDescription>Latest system alerts and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts.map((alert, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <IconAlertTriangle
                      className={`h-4 w-4 flex-shrink-0 ${
                        alert.severity === 'critical' ? 'text-red-500' :
                        alert.severity === 'warning' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{alert.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {alert.resource} • {alert.time}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={alert.status === "active" ? "destructive" : "outline"}
                    className="text-xs ml-2"
                  >
                    {alert.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Health</CardTitle>
            <CardDescription>Platform component status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Data Integration</span>
                </div>
                <Badge variant="outline" className="text-green-600 text-xs">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Data Warehouse</span>
                </div>
                <Badge variant="outline" className="text-green-600 text-xs">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-sm">Real-Time Analytics</span>
                </div>
                <Badge variant="outline" className="text-yellow-600 text-xs">Degraded</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Data Lake Storage</span>
                </div>
                <Badge variant="outline" className="text-green-600 text-xs">Healthy</Badge>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-start gap-3">
                <IconCheck className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    Systems Operational
                  </p>
                  <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                    98.7% uptime over the last 30 days
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline Execution Summary</CardTitle>
          <CardDescription>Last 24 hours execution statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Successful Runs</span>
                <span className="text-sm font-medium">1,723 (93.3%)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "93.3%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Running</span>
                <span className="text-sm font-medium">87 (4.7%)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "4.7%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Failed</span>
                <span className="text-sm font-medium">37 (2.0%)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: "2%" }} />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-cyan-50 dark:bg-cyan-950 rounded-lg">
            <div className="flex items-start gap-3">
              <IconChartLine className="h-5 w-5 text-cyan-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                  Reliability Improving
                </p>
                <p className="text-xs text-cyan-600/80 dark:text-cyan-400/80 mt-1">
                  Success rate increased 2.1% this week through improved error handling
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monitoring Capabilities</CardTitle>
          <CardDescription>
            Comprehensive platform monitoring with health tracking, alerts, logs, and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconActivity className="h-4 w-4 text-blue-500" />
                System Health
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Service status tracking</div>
                <div>• Resource monitoring</div>
                <div>• Performance metrics</div>
                <div>• Uptime reporting</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconPlayerPlay className="h-4 w-4 text-purple-500" />
                Pipeline Monitoring
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Execution tracking</div>
                <div>• Run history</div>
                <div>• Failure analysis</div>
                <div>• Duration metrics</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconAlertTriangle className="h-4 w-4 text-orange-500" />
                Alerts & Logs
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Alert configuration</div>
                <div>• Notification routing</div>
                <div>• Log aggregation</div>
                <div>• Audit trails</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
