"use client"

import Link from "next/link"
import {
  IconServer,
  IconDatabase,
  IconTable,
  IconChartLine,
  IconClock,
  IconPlus,
  IconCheck,
  IconCode,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function DataWarehousePage() {
  const stats = [
    { title: "Total Tables", value: "487", change: "+23 this month", icon: IconTable },
    { title: "Queries Today", value: "8,342", change: "+12% vs yesterday", icon: IconCode },
    { title: "Avg Query Time", value: "2.4s", change: "-0.3s improvement", icon: IconClock },
    { title: "Data Volume", value: "18.7 TB", change: "Optimized storage", icon: IconDatabase },
  ]

  const recentQueries = [
    { query: "SELECT * FROM sales WHERE...", user: "Sarah Chen", duration: "1.2s", status: "success" as const },
    { query: "SELECT customer_id, SUM(...", user: "Mike Johnson", duration: "3.8s", status: "success" as const },
    { query: "CREATE TABLE analytics...", user: "Lisa Park", duration: "0.9s", status: "success" as const },
    { query: "UPDATE inventory SET...", user: "Tom Wilson", duration: "5.2s", status: "running" as const },
  ]

  const quickActions = [
    {
      title: "SQL Editor",
      description: "Write and run queries",
      icon: IconCode,
      href: "/data-warehouse/editor",
      color: "text-blue-500",
    },
    {
      title: "Browse Tables",
      description: "Explore database schema",
      icon: IconTable,
      href: "/data-warehouse/tables",
      color: "text-purple-500",
    },
    {
      title: "Query History",
      description: "View past queries",
      icon: IconClock,
      href: "/data-warehouse/history",
      color: "text-green-500",
    },
    {
      title: "Create View",
      description: "Build materialized views",
      icon: IconPlus,
      href: "/data-warehouse/views",
      color: "text-orange-500",
    },
  ]

  const topTables = [
    { name: "sales_transactions", rows: "124.2M", size: "8.4 GB", queries: "2,341" },
    { name: "customer_profiles", rows: "42.8M", size: "3.2 GB", queries: "1,847" },
    { name: "product_inventory", rows: "18.5M", size: "1.8 GB", queries: "1,523" },
    { name: "order_history", rows: "95.3M", size: "6.7 GB", queries: "1,289" },
  ]

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10">
            <IconServer className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Data Warehouse</h1>
            <p className="text-sm text-muted-foreground">
              High-performance SQL analytics engine for complex queries and reporting
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/data-warehouse/editor">
            <IconCode className="mr-2 h-4 w-4" />
            Open SQL Editor
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
              <CardTitle>Recent Queries</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/data-warehouse/history">View All</Link>
              </Button>
            </div>
            <CardDescription>Recently executed SQL queries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentQueries.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <IconCode className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm truncate">{item.query}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.user} • {item.duration}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={item.status === "running" ? "default" : "outline"}
                    className="text-xs ml-2"
                  >
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Queried Tables</CardTitle>
            <CardDescription>Top tables by query frequency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTables.map((table, idx) => (
                <div key={idx} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{table.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {table.queries} queries
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {table.rows} rows • {table.size}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Query Performance</CardTitle>
          <CardDescription>Last 24 hours performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Fast Queries (&lt;1s)</span>
                <span className="text-sm font-medium">5,234 (62.7%)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "62.7%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Medium Queries (1-5s)</span>
                <span className="text-sm font-medium">2,648 (31.7%)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "31.7%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Slow Queries (&gt;5s)</span>
                <span className="text-sm font-medium">460 (5.6%)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: "5.6%" }} />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-start gap-3">
              <IconChartLine className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Performance Optimized
                </p>
                <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                  Query optimization reduced average execution time by 24% this week
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Warehouse Capabilities</CardTitle>
          <CardDescription>
            Scalable SQL engine optimized for analytics with support for complex queries and large datasets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconCode className="h-4 w-4 text-blue-500" />
                Query Engine
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Full ANSI SQL support</div>
                <div>• Window functions</div>
                <div>• CTEs and subqueries</div>
                <div>• Query optimization</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconTable className="h-4 w-4 text-purple-500" />
                Data Management
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Materialized views</div>
                <div>• Partitioning</div>
                <div>• Indexing strategies</div>
                <div>• Data clustering</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-green-500" />
                Features
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Query history</div>
                <div>• Result caching</div>
                <div>• CSV export</div>
                <div>• Saved queries</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
