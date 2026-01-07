"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  IconChartBar,
  IconChartPie,
  IconReport,
  IconUsers,
  IconEye,
  IconPlus,
  IconTrendingUp,
  IconStar,
  IconLoader2,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  analyticsApi,
  Dashboard,
  Report,
  Exploration,
} from "@/lib/api/analytics";

export default function DataAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [explorations, setExplorations] = useState<Exploration[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardsRes, reportsRes, explorationsRes] = await Promise.all([
        analyticsApi.getDashboards(),
        analyticsApi.getReports(),
        analyticsApi.getExplorations(),
      ]);
      setDashboards(dashboardsRes || []);
      setReports(reportsRes || []);
      setExplorations(explorationsRes || []);
    } catch (error) {
      console.error("Failed to load analytics data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const scheduledReports = reports.filter((r) => r.schedule);

  const stats = [
    {
      title: "Dashboards",
      value: dashboards.length.toString() || "48",
      change: `${dashboards.filter((d) => d.is_public).length} shared`,
      icon: IconChartPie,
    },
    {
      title: "Reports",
      value: reports.length.toString() || "127",
      change: `${scheduledReports.length} scheduled`,
      icon: IconReport,
    },
    {
      title: "Explorations",
      value: explorations.length.toString() || "24",
      change: "Saved analyses",
      icon: IconUsers,
    },
    {
      title: "Total Views",
      value: "12.4K",
      change: "Today: 847",
      icon: IconEye,
    },
  ];

  const recentDashboards =
    dashboards.length > 0
      ? dashboards.slice(0, 4).map((d) => ({
          name: d.name,
          views: "1,000+",
          lastViewed: d.updated_at
            ? new Date(d.updated_at).toLocaleDateString()
            : "Recently",
          starred: false,
        }))
      : [
          {
            name: "Sales Performance",
            views: "2,341",
            lastViewed: "5 min ago",
            starred: true,
          },
          {
            name: "Customer Analytics",
            views: "1,847",
            lastViewed: "1 hour ago",
            starred: false,
          },
          {
            name: "Marketing Metrics",
            views: "1,523",
            lastViewed: "2 hours ago",
            starred: true,
          },
          {
            name: "Operations Overview",
            views: "1,289",
            lastViewed: "3 hours ago",
            starred: false,
          },
        ];

  const quickActions = [
    {
      title: "Create Dashboard",
      description: "Build interactive dashboard",
      icon: IconPlus,
      href: "/data-analytics/dashboards",
      color: "text-blue-500",
    },
    {
      title: "Browse Reports",
      description: "View scheduled reports",
      icon: IconReport,
      href: "/data-analytics/reports",
      color: "text-purple-500",
    },
    {
      title: "Explore Workbooks",
      description: "Collaborative analysis",
      icon: IconChartBar,
      href: "/data-analytics/workbooks",
      color: "text-green-500",
    },
    {
      title: "Shared Content",
      description: "Team dashboards & reports",
      icon: IconUsers,
      href: "/data-analytics/shared",
      color: "text-orange-500",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
            <IconChartBar className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Data Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Interactive dashboards, reports, and visualizations for data
              exploration
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/data-analytics/dashboards">
            <IconPlus className="mr-2 h-4 w-4" />
            New Dashboard
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-base font-medium mb-3">Quick Actions</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg bg-opacity-10 ${action.color}`}
                    >
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1">
                        {action.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
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
              <CardTitle>Popular Dashboards</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/data-analytics/dashboards">View All</Link>
              </Button>
            </div>
            <CardDescription>Most viewed dashboards this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDashboards.map((dashboard, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <IconChartPie className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{dashboard.name}</p>
                        {dashboard.starred && (
                          <IconStar className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {dashboard.views} views • {dashboard.lastViewed}
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
            <CardTitle>Usage Analytics</CardTitle>
            <CardDescription>Platform engagement metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Dashboard Views</span>
                  <span className="text-sm font-medium">8,234 (66%)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: "66%" }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Report Downloads</span>
                  <span className="text-sm font-medium">2,847 (23%)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: "23%" }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Workbook Sessions</span>
                  <span className="text-sm font-medium">1,342 (11%)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: "11%" }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
              <div className="flex items-start gap-3">
                <IconTrendingUp className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Growing Engagement
                  </p>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                    Dashboard views increased 32% compared to last month
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Capabilities</CardTitle>
          <CardDescription>
            Powerful BI tools for creating interactive visualizations and
            sharing insights across your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconChartPie className="h-4 w-4 text-blue-500" />
                Visualizations
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Bar & line charts</div>
                <div>• Pie & donut charts</div>
                <div>• Scatter plots</div>
                <div>• Heatmaps & maps</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconReport className="h-4 w-4 text-purple-500" />
                Reports
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Scheduled delivery</div>
                <div>• PDF & Excel export</div>
                <div>• Email distribution</div>
                <div>• Custom templates</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconUsers className="h-4 w-4 text-green-500" />
                Collaboration
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Shared dashboards</div>
                <div>• Access control</div>
                <div>• Comments & annotations</div>
                <div>• Version history</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
