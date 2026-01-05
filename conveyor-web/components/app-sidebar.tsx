"use client";

import * as React from "react";
import {
  IconArrowsExchange,
  IconBrain,
  IconChartBar,
  IconDatabase,
  IconInnerShadowTop,
  IconServer,
  IconSettings,
  IconShield,
  IconStack,
  IconTransform,
  IconWaveSine,
  IconSchool,
  IconActivity,
} from "@tabler/icons-react";

import { NavPlatform } from "@/components/nav-platform";
import { NavSecondary } from "@/components/nav-secondary";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: IconInnerShadowTop,
    },
    {
      title: "Data Integration",
      url: "/data-integration",
      icon: IconArrowsExchange,
      items: [
        {
          title: "Overview",
          url: "/data-integration",
        },
        {
          title: "Connections",
          url: "/data-integration/data-sources",
        },
        {
          title: "Connectors",
          url: "/data-integration/source-connectors",
        },
        {
          title: "Pipelines",
          url: "/data-integration/pipelines",
        },
        {
          title: "Schedules",
          url: "/data-integration/schedules",
        },
        {
          title: "Run History",
          url: "/data-integration/pipeline-runs",
        },
      ],
    },
    {
      title: "Data Transformation",
      url: "/data-transformation",
      icon: IconTransform,
      items: [
        {
          title: "Notebooks",
          url: "/data-transformation/notebooks",
        },
        {
          title: "Workflows",
          url: "/data-transformation/workflows",
        },
        {
          title: "Jobs",
          url: "/data-transformation/jobs",
        },
        {
          title: "Repository",
          url: "/data-transformation/repository",
        },
        {
          title: "Streaming",
          url: "/real-time-analytics/streaming",
        },
        {
          title: "Events",
          url: "/real-time-analytics/events",
        },
      ],
    },
    {
      title: "Data Lakehouse",
      url: "/lakehouse",
      icon: IconDatabase,
      items: [
        {
          title: "Overview",
          url: "/lakehouse",
        },
        {
          title: "SQL Editor",
          url: "/lakehouse/sql-editor",
        },
        {
          title: "Table Explorer",
          url: "/lakehouse/tables",
        },
        {
          title: "Query History",
          url: "/lakehouse/history",
        },
        {
          title: "Catalogs",
          url: "/lakehouse/catalogs",
        },
        {
          title: "Storage Settings",
          url: "/lakehouse/storage",
        },
      ],
    },
    {
      title: "Data Analytics",
      url: "/data-analytics",
      icon: IconChartBar,
      items: [
        {
          title: "Overview",
          url: "/data-analytics",
        },
        {
          title: "Dashboards",
          url: "/data-analytics/dashboards",
        },
        {
          title: "Live Dashboards",
          url: "/real-time-analytics/dashboards",
        },
        {
          title: "Reports",
          url: "/data-analytics/reports",
        },
        {
          title: "Workbooks",
          url: "/data-analytics/workbooks",
        },
        {
          title: "Shared Content",
          url: "/data-analytics/shared",
        },
      ],
    },
    {
      title: "Data Science",
      url: "/data-science",
      icon: IconBrain,
      items: [
        {
          title: "Overview",
          url: "/data-science",
        },
        {
          title: "Notebooks",
          url: "/data-science/notebooks",
        },
        {
          title: "Models",
          url: "/data-science/models",
        },
        {
          title: "Experiments",
          url: "/data-science/experiments",
        },
        {
          title: "Deployments",
          url: "/data-science/deployments",
        },
      ],
    },
    {
      title: "Data Governance",
      url: "/data-governance",
      icon: IconShield,
      items: [
        {
          title: "Overview",
          url: "/data-governance",
        },
        {
          title: "Data Catalog",
          url: "/data-governance/catalog",
        },
        {
          title: "Lineage",
          url: "/data-governance/lineage",
        },
        {
          title: "Policies",
          url: "/data-governance/policies",
        },
        {
          title: "Access Control",
          url: "/data-governance/access",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Monitoring",
      url: "/monitoring",
      icon: IconActivity,
      items: [
        {
          title: "Overview",
          url: "/monitoring",
        },
        {
          title: "System Health",
          url: "/monitoring/health",
        },
        {
          title: "Logs",
          url: "/monitoring/logs",
        },
        {
          title: "Alerts",
          url: "/monitoring/alerts",
        },
      ],
    },
    {
      title: "Learning",
      url: "/learning",
      icon: IconSchool,
      items: [
        {
          title: "Getting Started",
          url: "/learning/getting-started",
        },
        {
          title: "Tutorials",
          url: "/learning/tutorials",
        },
        {
          title: "Documentation",
          url: "/learning/docs",
        },
        {
          title: "API Reference",
          url: "/learning/api",
        },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
      items: [
        {
          title: "General",
          url: "/settings/general",
        },
        {
          title: "Users & Teams",
          url: "/settings/users",
        },
        {
          title: "Integrations",
          url: "/settings/integrations",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Conveyor</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavPlatform items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  );
}
