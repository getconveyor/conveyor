"use client"

import Link from "next/link"
import {
  IconStack,
  IconDatabase,
  IconFile,
  IconFolder,
  IconChartBar,
  IconPlus,
  IconCheck,
  IconClock,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function DataLakePage() {
  const stats = [
    { title: "Total Storage", value: "24.8 TB", change: "+2.1 TB this month", icon: IconDatabase },
    { title: "Files", value: "1.2M", change: "847K active", icon: IconFile },
    { title: "Tables", value: "342", change: "28 partitioned", icon: IconFolder },
    { title: "Data Quality", value: "94.2%", change: "+1.8% this week", icon: IconCheck },
  ]

  const recentFiles = [
    { name: "customer_data_2024.parquet", size: "2.4 GB", type: "Parquet", lastModified: "2 hours ago" },
    { name: "sales_transactions.json", size: "850 MB", type: "JSON", lastModified: "5 hours ago" },
    { name: "product_catalog.csv", size: "124 MB", type: "CSV", lastModified: "1 day ago" },
    { name: "event_logs_stream.avro", size: "4.1 GB", type: "Avro", lastModified: "3 hours ago" },
  ]

  const quickActions = [
    {
      title: "Browse Files",
      description: "Explore data lake storage",
      icon: IconFolder,
      href: "/data-lake/explorer",
      color: "text-blue-500",
    },
    {
      title: "Manage Schemas",
      description: "Define and update schemas",
      icon: IconDatabase,
      href: "/data-lake/schemas",
      color: "text-purple-500",
    },
    {
      title: "Upload Data",
      description: "Add files to data lake",
      icon: IconPlus,
      href: "/data-lake/upload",
      color: "text-green-500",
    },
    {
      title: "Storage Config",
      description: "Configure storage settings",
      icon: IconChartBar,
      href: "/data-lake/config",
      color: "text-orange-500",
    },
  ]

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
            <IconStack className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Data Lake</h1>
            <p className="text-sm text-muted-foreground">
              Centralized storage for structured, semi-structured, and unstructured data
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/data-lake/upload">
            <IconPlus className="mr-2 h-4 w-4" />
            Upload Data
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
              <CardTitle>Recent Files</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/data-lake/explorer">View All</Link>
              </Button>
            </div>
            <CardDescription>Recently uploaded or modified files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <IconFile className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.type} • {file.size} • {file.lastModified}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage Distribution</CardTitle>
            <CardDescription>Data lake storage breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Parquet Files</span>
                  <span className="text-sm font-medium">12.4 TB (50%)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: "50%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">JSON Files</span>
                  <span className="text-sm font-medium">6.2 TB (25%)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: "25%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">CSV Files</span>
                  <span className="text-sm font-medium">3.7 TB (15%)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "15%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Other Formats</span>
                  <span className="text-sm font-medium">2.5 TB (10%)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: "10%" }} />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-start gap-3">
                <IconCheck className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    Optimized Storage
                  </p>
                  <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                    Data compression saving 40% storage costs
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Lake Capabilities</CardTitle>
          <CardDescription>
            Scalable storage supporting multiple formats with schema management and data cataloging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconFile className="h-4 w-4 text-blue-500" />
                Supported Formats
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Parquet & ORC</div>
                <div>• JSON & Avro</div>
                <div>• CSV & TSV</div>
                <div>• Delta Lake</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconDatabase className="h-4 w-4 text-purple-500" />
                Data Management
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Schema evolution</div>
                <div>• Partitioning</div>
                <div>• Compression</div>
                <div>• Lifecycle policies</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconClock className="h-4 w-4 text-green-500" />
                Access & Query
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• SQL queries</div>
                <div>• File browsing</div>
                <div>• Metadata search</div>
                <div>• Access control</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
