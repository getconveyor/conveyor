"use client";

import * as React from "react";
import {
  IconActivity,
  IconArrowsExchange,
  IconBrain,
  IconChartBar,
  IconInnerShadowTop,
  IconServer,
  IconSettings,
  IconShield,
  IconStack,
  IconTransform,
  IconWaveSine,
  IconSchool,
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
          title: "Pipelines",
          url: "/data-integration/pipelines",
        },
        {
          title: "Sources",
          url: "/data-integration/sources",
        },
        {
          title: "Schedules",
          url: "/data-integration/schedules",
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
          title: "Jobs",
          url: "/data-transformation/jobs",
        },
        {
          title: "Workflows",
          url: "/data-transformation/workflows",
        },
        {
          title: "Code Repository",
          url: "/data-transformation/repository",
        },
      ],
    },
    {
      title: "Data Lake",
      url: "/data-lake",
      icon: IconStack,
      items: [
        {
          title: "Explorer",
          url: "/data-lake/explorer",
        },
        {
          title: "Files & Folders",
          url: "/data-lake/files",
        },
        {
          title: "Schemas",
          url: "/data-lake/schemas",
        },
        {
          title: "Storage Settings",
          url: "/data-lake/storage",
        },
      ],
    },
    {
      title: "Data Warehouse",
      url: "/data-warehouse",
      icon: IconServer,
      items: [
        {
          title: "SQL Editor",
          url: "/data-warehouse/editor",
        },
        {
          title: "Tables & Views",
          url: "/data-warehouse/tables",
        },
        {
          title: "Query History",
          url: "/data-warehouse/history",
        },
        {
          title: "Performance",
          url: "/data-warehouse/performance",
        },
      ],
    },
    {
      title: "Real-Time Analytics",
      url: "/real-time-analytics",
      icon: IconWaveSine,
      items: [
        {
          title: "Streaming Jobs",
          url: "/real-time-analytics/streaming",
        },
        {
          title: "Event Hubs",
          url: "/real-time-analytics/events",
        },
        {
          title: "Live Dashboards",
          url: "/real-time-analytics/dashboards",
        },
        {
          title: "Alerts",
          url: "/real-time-analytics/alerts",
        },
      ],
    },
    {
      title: "Data Analytics",
      url: "/data-analytics",
      icon: IconChartBar,
      items: [
        {
          title: "Dashboards",
          url: "/data-analytics/dashboards",
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
    {
      title: "Monitoring",
      url: "/monitoring",
      icon: IconActivity,
      items: [
        {
          title: "Overview",
          url: "/monitoring/overview",
        },
        {
          title: "Pipeline Runs",
          url: "/monitoring/pipelines",
        },
        {
          title: "System Health",
          url: "/monitoring/health",
        },
        {
          title: "Alerts & Logs",
          url: "/monitoring/logs",
        },
      ],
    },
  ],
  navSecondary: [
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
