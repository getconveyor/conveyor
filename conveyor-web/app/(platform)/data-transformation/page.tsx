"use client"

import Link from "next/link"
import {
  IconTransform,
  IconCode,
  IconPlayerPlay,
  IconClock,
  IconCheck,
  IconBook,
  IconPlus,
  IconChartLine,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function DataTransformationPage() {
  const stats = [
    { title: "Active Jobs", value: "8", change: "+2 today", icon: IconPlayerPlay },
    { title: "Notebooks", value: "15", change: "3 Python, 12 SQL", icon: IconCode },
    { title: "Workflows", value: "12", change: "8 active", icon: IconTransform },
    { title: "Success Rate", value: "96.8%", change: "+4.2% this week", icon: IconCheck },
  ]

  const recentJobs = [
    { name: "Daily Sales Aggregation", status: "running" as const, duration: "2m 34s", type: "SQL" },
    { name: "Customer Data Cleanup", status: "success" as const, duration: "4m 12s", type: "Python" },
    { name: "Product Enrichment", status: "running" as const, duration: "1m 45s", type: "Python" },
    { name: "Revenue Calculations", status: "success" as const, duration: "3m 22s", type: "SQL" },
  ]

  const quickActions = [
    {
      title: "New Notebook",
      description: "Create Python or SQL notebook",
      icon: IconPlus,
      href: "/data-transformation/notebooks",
      color: "text-green-500",
    },
    {
      title: "Create Workflow",
      description: "Build multi-step workflow",
      icon: IconTransform,
      href: "/data-transformation/workflows",
      color: "text-purple-500",
    },
    {
      title: "View Jobs",
      description: "Monitor transformation jobs",
      icon: IconPlayerPlay,
      href: "/data-transformation/jobs",
      color: "text-blue-500",
    },
    {
      title: "Code Repository",
      description: "Browse transformation code",
      icon: IconBook,
      href: "/data-transformation/repository",
      color: "text-orange-500",
    },
  ]

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
            <IconTransform className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Data Transformation</h1>
            <p className="text-sm text-muted-foreground">
              Transform and process your data with notebooks and jobs
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/data-transformation/notebooks">
            <IconPlus className="mr-2 h-4 w-4" />
            New Notebook
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
              <CardTitle>Recent Jobs</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/data-transformation/jobs">View All</Link>
              </Button>
            </div>
            <CardDescription>Recently executed transformation jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentJobs.map((job, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <IconCode className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{job.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.type} • {job.duration}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={job.status === "running" ? "default" : "outline"}
                    className="text-xs"
                  >
                    {job.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Processing Metrics</CardTitle>
            <CardDescription>Transformation performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">CPU Usage</span>
                  <span className="text-sm font-medium">64%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: "64%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Memory Usage</span>
                  <span className="text-sm font-medium">72%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: "72%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Job Queue</span>
                  <span className="text-sm font-medium">3 queued</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "15%" }} />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-start gap-3">
                <IconChartLine className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    High Throughput
                  </p>
                  <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                    Processing 2.4M records/hour - 23% above average
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transformation Capabilities</CardTitle>
          <CardDescription>
            Powerful data transformation with Python and SQL notebooks, workflow orchestration, and job scheduling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconCode className="h-4 w-4 text-green-500" />
                Notebooks
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Interactive Python & SQL</div>
                <div>• Jupyter-style interface</div>
                <div>• Version control</div>
                <div>• Collaborative editing</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconTransform className="h-4 w-4 text-purple-500" />
                Workflows
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Multi-step pipelines</div>
                <div>• Visual builder</div>
                <div>• Error handling</div>
                <div>• Parallel execution</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconClock className="h-4 w-4 text-blue-500" />
                Scheduling
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Cron-based triggers</div>
                <div>• Event-driven runs</div>
                <div>• Dependency management</div>
                <div>• SLA monitoring</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
