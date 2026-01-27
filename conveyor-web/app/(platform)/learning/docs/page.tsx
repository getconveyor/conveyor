"use client"

import Link from "next/link"
import {
  IconBook,
  IconSearch,
  IconDatabase,
  IconTransform,
  IconChartBar,
  IconBrain,
  IconShield,
  IconActivity,
  IconWaveSine,
  IconStack,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function DocumentationPage() {
  const sections = [
    {
      title: "Data Integration",
      description: "ETL/ELT pipelines, connectors, and scheduling",
      icon: IconDatabase,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      articles: 12,
      topics: ["Pipelines", "Connections", "Schedules", "Sources"],
    },
    {
      title: "Data Transformation",
      description: "Notebooks, workflows, and job orchestration",
      icon: IconTransform,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      articles: 15,
      topics: ["Notebooks", "Workflows", "Jobs", "Code Repository"],
    },
    {
      title: "Data Lake",
      description: "Storage, schema management, and file organization",
      icon: IconStack,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      articles: 8,
      topics: ["File Explorer", "Schemas", "Storage Config", "Partitioning"],
    },
    {
      title: "Data Warehouse",
      description: "SQL queries, tables, views, and optimization",
      icon: IconDatabase,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      articles: 18,
      topics: ["SQL Editor", "Tables & Views", "Query History", "Performance"],
    },
    {
      title: "Real-Time Analytics",
      description: "Streaming, events, live dashboards, and alerts",
      icon: IconWaveSine,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
      articles: 10,
      topics: ["Streaming Jobs", "Events", "Dashboards", "Alerts"],
    },
    {
      title: "Data Analytics",
      description: "Dashboards, reports, and visualizations",
      icon: IconChartBar,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      articles: 14,
      topics: ["Dashboards", "Reports", "Workbooks", "Sharing"],
    },
    {
      title: "Data Science",
      description: "ML models, experiments, and deployments",
      icon: IconBrain,
      color: "text-fuchsia-500",
      bgColor: "bg-fuchsia-500/10",
      articles: 11,
      topics: ["Models", "Experiments", "Notebooks", "Deployments"],
    },
    {
      title: "Data Governance",
      description: "Catalog, lineage, policies, and compliance",
      icon: IconShield,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      articles: 9,
      topics: ["Catalog", "Lineage", "Policies", "Access Control"],
    },
    {
      title: "Monitoring",
      description: "System health, alerts, logs, and metrics",
      icon: IconActivity,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      articles: 7,
      topics: ["Health", "Alerts", "Logs", "Pipeline Runs"],
    },
  ]

  const popularDocs = [
    { title: "Getting Started with Pipelines", category: "Data Integration", views: "5.2K" },
    { title: "Writing SQL Queries", category: "Data Warehouse", views: "4.8K" },
    { title: "Creating Dashboards", category: "Data Analytics", views: "4.1K" },
    { title: "Notebook Best Practices", category: "Data Transformation", views: "3.7K" },
    { title: "Setting Up Governance", category: "Data Governance", views: "3.2K" },
  ]

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
          <IconBook className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Documentation</h1>
          <p className="text-sm text-muted-foreground">
            Complete reference documentation for all platform features
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documentation..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section, idx) => (
          <Card key={idx} className="hover:bg-accent/30 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${section.bgColor}`}>
                  <section.icon className={`h-6 w-6 ${section.color}`} />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {section.articles} articles
                </Badge>
              </div>
              <CardTitle className="text-lg">{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {section.topics.map((topic, topicIdx) => (
                  <div key={topicIdx} className="text-sm">
                    <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                      • {topic}
                    </Link>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full">
                View All
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Popular Documentation</CardTitle>
          <CardDescription>Most viewed articles this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {popularDocs.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <IconBook className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">{doc.category}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {doc.views} views
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Start Guides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                • Platform Overview
              </Link>
              <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                • First Pipeline
              </Link>
              <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                • SQL Basics
              </Link>
              <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                • Dashboard Creation
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">API & Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                • REST API Reference
              </Link>
              <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                • SDK Documentation
              </Link>
              <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                • Webhooks
              </Link>
              <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                • Authentication
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Advanced Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                • Performance Tuning
              </Link>
              <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                • Security Best Practices
              </Link>
              <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                • Disaster Recovery
              </Link>
              <Link href="#" className="block text-muted-foreground hover:text-primary transition-colors">
                • Scaling Strategies
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
