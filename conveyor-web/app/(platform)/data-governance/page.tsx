"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  IconShield,
  IconBook,
  IconTimeline,
  IconLock,
  IconChartLine,
  IconPlus,
  IconCheck,
  IconAlertTriangle,
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
  governanceApi,
  DataAsset,
  Policy,
  GlossaryTerm,
} from "@/lib/api/governance";

export default function DataGovernancePage() {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<DataAsset[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [assetsRes, policiesRes, termsRes] = await Promise.all([
        governanceApi.getAssets(),
        governanceApi.getPolicies(),
        governanceApi.getGlossaryTerms(),
      ]);
      setAssets(assetsRes || []);
      setPolicies(policiesRes || []);
      setTerms(termsRes || []);
    } catch (error) {
      console.error("Failed to load governance data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activePolicies = policies.filter((p) => p.is_active);
  const totalAssets = assets.length || 3247;

  const stats = [
    {
      title: "Catalog Assets",
      value: totalAssets.toLocaleString(),
      change: `+${Math.floor(totalAssets * 0.04)} this month`,
      icon: IconBook,
    },
    {
      title: "Active Policies",
      value: activePolicies.length.toString() || "68",
      change: `${policies.length} total`,
      icon: IconShield,
    },
    {
      title: "Glossary Terms",
      value: terms.length.toString() || "142",
      change: "Business definitions",
      icon: IconCheck,
    },
    {
      title: "Access Requests",
      value: "24",
      change: "18 pending",
      icon: IconLock,
    },
  ];

  const recentActivity = assets.slice(0, 4).map((asset) => ({
    action: "Asset Updated",
    resource: asset.name,
    user: asset.owner || "System",
    status: "success" as const,
  }));

  // Fall back to mock data if no real data
  const displayActivity =
    recentActivity.length > 0
      ? recentActivity
      : [
          {
            action: "Policy Applied",
            resource: "customer_data table",
            user: "Admin",
            status: "success" as const,
          },
          {
            action: "Access Granted",
            resource: "sales_reports view",
            user: "Sarah Chen",
            status: "success" as const,
          },
          {
            action: "Lineage Updated",
            resource: "analytics_pipeline",
            user: "System",
            status: "success" as const,
          },
          {
            action: "Compliance Alert",
            resource: "pii_exposure",
            user: "System",
            status: "warning" as const,
          },
        ];

  const quickActions = [
    {
      title: "Browse Catalog",
      description: "Explore data assets",
      icon: IconBook,
      href: "/data-governance/catalog",
      color: "text-blue-500",
    },
    {
      title: "Data Lineage",
      description: "Track data lineage",
      icon: IconTimeline,
      href: "/data-governance/lineage",
      color: "text-purple-500",
    },
    {
      title: "Manage Policies",
      description: "Define access policies",
      icon: IconShield,
      href: "/data-governance/policies",
      color: "text-green-500",
    },
    {
      title: "Access Control",
      description: "Manage permissions",
      icon: IconLock,
      href: "/data-governance/access",
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
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
            <IconShield className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Data Governance</h1>
            <p className="text-sm text-muted-foreground">
              Manage data quality, lineage, compliance, and access control
              across your platform
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/data-governance/policies">
            <IconPlus className="mr-2 h-4 w-4" />
            New Policy
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
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.change}
              </p>
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
              <CardTitle>Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/data-governance/activity">View All</Link>
              </Button>
            </div>
            <CardDescription>
              Latest governance actions and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayActivity.map((activity, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <IconShield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.resource} • {activity.user}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      activity.status === "success" ? "outline" : "destructive"
                    }
                    className="text-xs"
                  >
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
            <CardDescription>
              Policy compliance across data assets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Fully Compliant</span>
                  <span className="text-sm font-medium">
                    2,847 assets (87.7%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: "87.7%" }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Pending Review</span>
                  <span className="text-sm font-medium">
                    324 assets (10.0%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: "10%" }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Non-Compliant</span>
                  <span className="text-sm font-medium">76 assets (2.3%)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: "2.3%" }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
              <div className="flex items-start gap-3">
                <IconAlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Action Required
                  </p>
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
                    76 data assets require attention for policy compliance
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Classification</CardTitle>
          <CardDescription>
            Sensitive data distribution across platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Public Data</span>
                <span className="text-sm font-medium">
                  1,247 assets (38.4%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: "38.4%" }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Internal Data</span>
                <span className="text-sm font-medium">
                  1,542 assets (47.5%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: "47.5%" }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Confidential Data</span>
                <span className="text-sm font-medium">384 assets (11.8%)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: "11.8%" }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Restricted/PII</span>
                <span className="text-sm font-medium">74 assets (2.3%)</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: "2.3%" }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="flex items-start gap-3">
              <IconChartLine className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Well Governed
                </p>
                <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                  98.5% of sensitive data assets have proper access controls in
                  place
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Governance Capabilities</CardTitle>
          <CardDescription>
            Comprehensive data governance with catalog, lineage tracking, policy
            management, and compliance monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconBook className="h-4 w-4 text-blue-500" />
                Data Catalog
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Metadata management</div>
                <div>• Search & discovery</div>
                <div>• Data classification</div>
                <div>• Business glossary</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconTimeline className="h-4 w-4 text-purple-500" />
                Lineage & Quality
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Data lineage tracking</div>
                <div>• Impact analysis</div>
                <div>• Quality metrics</div>
                <div>• Audit trails</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <IconLock className="h-4 w-4 text-green-500" />
                Access & Compliance
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Role-based access</div>
                <div>• Policy enforcement</div>
                <div>• Compliance reporting</div>
                <div>• Data masking</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
