"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  IconArrowsExchange,
  IconDatabase,
  IconClock,
  IconCheck,
  IconAlertTriangle,
  IconPlus,
  IconTrendingUp,
  IconPlayerPlay,
  IconSettings,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { integrationApi, Pipeline, DataSource } from "@/lib/api/integration"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"

export default function DataIntegrationPage() {
  const [loading, setLoading] = useState(true)
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [pipelinesData, sourcesData] = await Promise.all([
          integrationApi.getPipelines(),
          integrationApi.getDataSources()
        ])
        setPipelines(pipelinesData)
        setDataSources(sourcesData)
      } catch (err) {
        console.error("Failed to load integration data:", err)
        setError("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Calculate stats
  const activePipelines = pipelines.filter(p => p.status === 'active' || p.status === 'running').length
  const connectedSources = dataSources.filter(s => s.status === 'active').length

  // Calculate success rate
  const completedRuns = pipelines.reduce((acc, p) => acc + (p.run_count || 0), 0)
  const successRate = completedRuns > 0
    ? Math.round(pipelines.reduce((acc, p) => acc + (p.success_rate || 0), 0) / pipelines.length)
    : 100

  const failedRuns = pipelines.filter(p => p.status === 'error').length

  const stats = [
    {
      title: "Active Pipelines",
      value: activePipelines.toString(),
      change: `${pipelines.length} total`,
      icon: IconArrowsExchange,
      trend: "neutral",
    },
    {
      title: "Data Sources",
      value: connectedSources.toString(),
      change: `${dataSources.length} total`,
      icon: IconDatabase,
      trend: "neutral",
    },
    {
      title: "Success Rate",
      value: `${successRate}%`,
      change: "Avg. across all pipelines",
      icon: IconCheck,
      trend: successRate > 90 ? "up" : successRate < 80 ? "down" : "neutral",
    },
    {
      title: "Failed Pipelines",
      value: failedRuns.toString(),
      change: "Currently in error state",
      icon: IconAlertTriangle,
      trend: failedRuns > 0 ? "down" : "neutral",
    },
  ]

  const recentPipelines = [...pipelines]
    .sort((a, b) => new Date(b.last_run || 0).getTime() - new Date(a.last_run || 0).getTime())
    .slice(0, 5)

  const quickActions = [
    {
      title: "Create Pipeline",
      description: "Set up a new data integration pipeline",
      icon: IconPlus,
      href: "/data-integration/pipelines/new",
      color: "text-blue-500",
    },
    {
      title: "Manage Connections",
      description: "Configure data source connections",
      icon: IconDatabase,
      href: "/data-integration/sources",
      color: "text-purple-500",
    },
    {
      title: "View Schedules",
      description: "Manage pipeline execution schedules",
      icon: IconClock,
      href: "/data-integration/schedules",
      color: "text-green-500",
    },
  ]

  // Status badge helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'default'
      case 'active': return 'default'
      case 'success': return 'outline'
      case 'error': return 'destructive'
      case 'failed': return 'destructive'
      case 'paused': return 'secondary'
      default: return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
            <IconArrowsExchange className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Data Integration</h1>
            <p className="text-sm text-muted-foreground">
              Orchestrate data movement across sources and destinations
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/data-integration/pipelines/new">
            <IconPlus className="mr-2 h-4 w-4" />
            New Pipeline
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
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

      {/* Quick Actions */}
      <div className="mb-8">
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
        {/* Recent Pipelines */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Pipelines</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/data-integration/pipelines">View All</Link>
              </Button>
            </div>
            <CardDescription>Recently executed pipelines</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPipelines.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <IconArrowsExchange className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No pipelines found</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/data-integration/pipelines/new">Create your first pipeline</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPipelines.map((pipeline) => (
                  <div key={pipeline.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <IconPlayerPlay className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{pipeline.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {pipeline.destination_name || pipeline.destination_details?.name || 'Unknown'} • {pipeline.last_run ? formatDistanceToNow(new Date(pipeline.last_run), { addSuffix: true }) : 'Never ran'}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={getStatusColor(pipeline.status) as any}
                      className="text-xs capitalize"
                    >
                      {pipeline.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Integration platform status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Pipeline Orchestrator</span>
                </div>
                <Badge variant="outline" className="text-green-600 text-xs">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Connection Pool</span>
                </div>
                <Badge variant="outline" className="text-green-600 text-xs">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Scheduler Service</span>
                </div>
                <Badge variant="outline" className="text-green-600 text-xs">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Data Catalog Sync</span>
                </div>
                <Badge variant="outline" className="text-green-600 text-xs">Healthy</Badge>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-start gap-3">
                <IconTrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    System Optimal
                  </p>
                  <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                    All systems are running normally. No incidents reported in the last 24 hours.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Overview */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Platform Capabilities</CardTitle>
          <CardDescription>
            Build ETL/ELT pipelines to ingest data from databases, APIs, files, and SaaS applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-green-500" />
                Supported Sources
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>• Relational Databases</div>
                <div>• REST APIs</div>
                <div>• Cloud Storage (S3, Azure)</div>
                <div>• SaaS Applications</div>
                <div>• Streaming Platforms</div>
                <div>• File Systems</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-green-500" />
                Key Features
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>• Visual Pipeline Builder</div>
                <div>• Incremental Loading</div>
                <div>• Change Data Capture</div>
                <div>• Error Handling</div>
                <div>• Data Validation</div>
                <div>• Schedule Management</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
