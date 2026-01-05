"use client";

import {
  IconArrowsExchange,
  IconTransform,
  IconStack,
  IconServer,
  IconWaveSine,
  IconChartBar,
  IconBrain,
  IconShield,
  IconActivity,
  IconDatabase,
  IconClock,
  IconAlertTriangle,
  IconPlus,
  IconPlayerPlay,
  IconEye,
  IconCode,
  IconBook,
  IconVideo,
  IconSchool,
  IconRocket,
  IconLayoutDashboard,
} from "@tabler/icons-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";

export default function Page() {
  const platformStats = [
    {
      title: "Active Pipelines",
      value: "24",
      change: "+12%",
      icon: IconArrowsExchange,
      trend: "up",
    },
    {
      title: "Data Processed",
      value: "1.2TB",
      change: "+8%",
      icon: IconDatabase,
      trend: "up",
    },
    {
      title: "Running Jobs",
      value: "8",
      change: "-3%",
      icon: IconClock,
      trend: "down",
    },
    {
      title: "Active Alerts",
      value: "3",
      change: "+2",
      icon: IconAlertTriangle,
      trend: "up",
    },
  ];

  const quickLinks = [
    {
      title: "Create Pipeline",
      description: "Set up a new data pipeline",
      icon: IconPlus,
      url: "/data-integration/pipelines",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Run SQL Query",
      description: "Query your data warehouse",
      icon: IconCode,
      url: "/data-warehouse/editor",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Create Notebook",
      description: "Start a new Jupyter notebook",
      icon: IconPlus,
      url: "/data-transformation/notebooks",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "View Dashboards",
      description: "Access analytics dashboards",
      icon: IconEye,
      url: "/data-analytics/dashboards",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Monitor Pipelines",
      description: "Check pipeline health",
      icon: IconActivity,
      url: "/monitoring/pipelines",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Browse Catalog",
      description: "Explore data catalog",
      icon: IconBook,
      url: "/data-governance/catalog",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
  ];

  const tutorials = [
    {
      title: "Getting Started",
      description:
        "Learn the basics of the platform and create your first pipeline",
      icon: IconRocket,
      duration: "10 min",
      type: "Tutorial",
      url: "#",
      color: "text-blue-500",
    },
    {
      title: "Building ETL Pipelines",
      description: "Step-by-step guide to creating data integration workflows",
      icon: IconSchool,
      duration: "25 min",
      type: "Hands-on Lab",
      url: "#",
      color: "text-purple-500",
    },
    {
      title: "Data Transformation Best Practices",
      description: "Learn how to efficiently transform and process your data",
      icon: IconVideo,
      duration: "15 min",
      type: "Video",
      url: "#",
      color: "text-green-500",
    },
    {
      title: "API Reference",
      description: "Complete documentation for platform APIs and SDKs",
      icon: IconBook,
      duration: "Read",
      type: "Documentation",
      url: "#",
      color: "text-orange-500",
    },
  ];

  const platformSections = [
    {
      title: "Data Integration",
      description: "ETL/ELT pipelines and data movement",
      icon: IconArrowsExchange,
      url: "/data-integration",
      stats: { pipelines: 24, connections: 12, schedules: 18 },
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Data Transformation",
      description: "Transform and process your data",
      icon: IconTransform,
      url: "/data-transformation",
      stats: { notebooks: 15, jobs: 32, workflows: 8 },
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Data Lake",
      description: "Store and manage raw data at scale",
      icon: IconStack,
      url: "/data-lake",
      stats: { files: 2847, schemas: 45, storage: "842GB" },
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Data Warehouse",
      description: "Query and analyze structured data",
      icon: IconServer,
      url: "/data-warehouse",
      stats: { tables: 156, views: 89, queries: "1.2K" },
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Real-Time Analytics",
      description: "Stream processing and live insights",
      icon: IconWaveSine,
      url: "/real-time-analytics",
      stats: { streams: 12, events: "245K/min", dashboards: 6 },
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Data Analytics",
      description: "Business intelligence and reporting",
      icon: IconChartBar,
      url: "/data-analytics",
      stats: { dashboards: 42, reports: 128, workbooks: 34 },
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      title: "Data Science",
      description: "ML models and experiments",
      icon: IconBrain,
      url: "/data-science",
      stats: { models: 18, experiments: 67, deployments: 12 },
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
    {
      title: "Data Governance",
      description: "Policies, lineage, and access control",
      icon: IconShield,
      url: "/data-governance",
      stats: { policies: 23, catalog: 892, lineage: 1245 },
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
    {
      title: "Monitoring",
      description: "System health and pipeline status",
      icon: IconActivity,
      url: "/monitoring",
      stats: { pipelines: "98% healthy", alerts: 3, logs: "45K" },
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Overview"
        description="Monitor and manage your data platform"
        icon={IconLayoutDashboard}
      />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {platformStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p
                className={`text-xs ${
                  stat.trend === "up" ? "text-green-500" : "text-red-500"
                }`}
              >
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link key={link.title} href={link.url}>
              <Card className="hover:shadow-md transition-all hover:border-primary cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${link.bgColor}`}
                    >
                      <link.icon className={`h-5 w-5 ${link.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{link.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {link.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Tutorials & Documentation */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Learning Resources</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="#">View All</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {tutorials.map((tutorial) => (
            <Card
              key={tutorial.title}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${tutorial.color} bg-opacity-10`}
                    >
                      <tutorial.icon className={`h-5 w-5 ${tutorial.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {tutorial.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full bg-opacity-10 ${tutorial.color}`}
                        >
                          {tutorial.type}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {tutorial.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {tutorial.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button asChild variant="ghost" size="sm" className="w-full">
                  <Link href={tutorial.url}>
                    Start Learning <IconPlayerPlay className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Platform Sections */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Platform Services</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {platformSections.map((section) => (
            <Card
              key={section.title}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${section.bgColor}`}
                  >
                    <section.icon className={`h-5 w-5 ${section.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{section.title}</CardTitle>
                  </div>
                </div>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 mb-4">
                  {Object.entries(section.stats).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground capitalize">
                        {key}
                      </span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href={section.url}>Open {section.title}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest events across your platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                title: "Pipeline 'customer-data-sync' completed successfully",
                time: "2 minutes ago",
                icon: IconArrowsExchange,
                color: "text-green-500",
              },
              {
                title: "New ML model 'churn-prediction-v2' deployed",
                time: "15 minutes ago",
                icon: IconBrain,
                color: "text-purple-500",
              },
              {
                title: "Data quality check failed on 'orders' table",
                time: "32 minutes ago",
                icon: IconAlertTriangle,
                color: "text-yellow-500",
              },
              {
                title: "Streaming job 'real-time-events' started",
                time: "1 hour ago",
                icon: IconWaveSine,
                color: "text-blue-500",
              },
              {
                title: "New policy 'PII-protection' applied to 12 tables",
                time: "2 hours ago",
                icon: IconShield,
                color: "text-indigo-500",
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${activity.color} bg-opacity-10`}
                >
                  <activity.icon className={`h-4 w-4 ${activity.color}`} />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
