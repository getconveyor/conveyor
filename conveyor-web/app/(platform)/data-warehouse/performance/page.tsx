"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconActivity, IconClock, IconDatabase, IconTrendingUp } from "@tabler/icons-react"

interface PerformanceMetric {
  id: string
  name: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
  icon: any
  color: string
}

const mockMetrics: PerformanceMetric[] = [
  {
    id: "1",
    name: "Avg Query Time",
    value: "245ms",
    change: "-12% from yesterday",
    trend: "down",
    icon: IconClock,
    color: "text-blue-500",
  },
  {
    id: "2",
    name: "Queries/Hour",
    value: "1,248",
    change: "+8% from yesterday",
    trend: "up",
    icon: IconActivity,
    color: "text-green-500",
  },
  {
    id: "3",
    name: "Cache Hit Rate",
    value: "87%",
    change: "+3% from yesterday",
    trend: "up",
    icon: IconDatabase,
    color: "text-purple-500",
  },
  {
    id: "4",
    name: "Data Scanned",
    value: "24.5 GB",
    change: "+15% from yesterday",
    trend: "up",
    icon: IconTrendingUp,
    color: "text-orange-500",
  },
]

interface SlowQuery {
  id: string
  query: string
  executionTime: string
  table: string
  executedAt: string
}

const mockSlowQueries: SlowQuery[] = [
  {
    id: "1",
    query: "SELECT * FROM fact_sales WHERE date BETWEEN '2023-01-01' AND '2024-12-31'",
    executionTime: "8.5s",
    table: "fact_sales",
    executedAt: "15 minutes ago",
  },
  {
    id: "2",
    query: "SELECT customer_id, COUNT(*) FROM fact_orders GROUP BY customer_id",
    executionTime: "6.2s",
    table: "fact_orders",
    executedAt: "1 hour ago",
  },
  {
    id: "3",
    query: "SELECT * FROM dim_customers JOIN fact_sales ON customer_id",
    executionTime: "4.8s",
    table: "fact_sales",
    executedAt: "2 hours ago",
  },
]

export default function PerformancePage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance</h1>
          <p className="text-sm text-muted-foreground">
            Monitor query performance and optimization
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-2 md:grid-cols-4">
        {mockMetrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.id}>
              <CardContent className="pt-2 pb-2">
                <div className="flex items-start justify-between mb-1">
                  <div className="text-[10px] font-medium text-muted-foreground">{metric.name}</div>
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                  </div>
                </div>
                <div className="text-xl font-bold mb-0.5">{metric.value}</div>
                <div className={`text-xs ${metric.trend === "up" ? "text-green-500" : metric.trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
                  {metric.change}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Slow Queries */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Slow Queries</h2>
            <Badge variant="secondary" className="text-xs">Last 24 hours</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-2">
            {mockSlowQueries.map((query) => (
              <Card key={query.id}>
                <CardContent className="p-2">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="destructive" className="text-xs">
                          {query.executionTime}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {query.table}
                        </Badge>
                      </div>
                      <div className="font-mono text-xs bg-muted/50 p-2 rounded overflow-x-auto">
                        {query.query}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Executed {query.executedAt}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
