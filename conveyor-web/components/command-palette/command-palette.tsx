"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  IconSearch,
  IconArrowRight,
  IconDatabase,
  IconChartLine,
  IconCode,
  IconPlaylist,
  IconSettings,
  IconHelp,
  IconClock,
  IconPlus,
  IconArrowsExchange,
  IconTransform,
  IconStack,
  IconChartBar,
  IconBrain,
  IconShield,
  IconActivity,
  IconCommand,
  IconKeyboard,
  IconMoon,
  IconSun,
  IconLogout,
  IconUser,
  IconFolder,
  IconTable,
  IconWaveSine,
} from "@tabler/icons-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type CommandCategory =
  | "navigation"
  | "actions"
  | "search"
  | "settings"
  | "recent";

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ElementType;
  category: CommandCategory;
  shortcut?: string[];
  action?: () => void;
  href?: string;
  keywords?: string[];
}

const navigationItems: CommandItem[] = [
  {
    id: "dashboard",
    title: "Go to Dashboard",
    icon: IconChartLine,
    category: "navigation",
    href: "/dashboard",
    shortcut: ["g", "d"],
    keywords: ["home", "overview"],
  },
  {
    id: "pipelines",
    title: "Go to Pipelines",
    icon: IconArrowsExchange,
    category: "navigation",
    href: "/data-integration/pipelines",
    shortcut: ["g", "p"],
    keywords: ["etl", "integration"],
  },
  {
    id: "data-sources",
    title: "Go to Data Sources",
    icon: IconDatabase,
    category: "navigation",
    href: "/data-integration/data-sources",
    shortcut: ["g", "s"],
    keywords: ["connections", "connectors"],
  },
  {
    id: "lakehouse",
    title: "Go to Lakehouse",
    icon: IconStack,
    category: "navigation",
    href: "/lakehouse",
    shortcut: ["g", "l"],
    keywords: ["data lake", "warehouse", "iceberg"],
  },
  {
    id: "sql-editor",
    title: "Open SQL Editor",
    icon: IconCode,
    category: "navigation",
    href: "/lakehouse/sql-editor",
    shortcut: ["g", "q"],
    keywords: ["query", "trino", "sql"],
  },
  {
    id: "workflows",
    title: "Go to Workflows",
    icon: IconTransform,
    category: "navigation",
    href: "/data-transformation/workflows",
    shortcut: ["g", "w"],
    keywords: ["jobs", "transformation"],
  },
  {
    id: "notebooks",
    title: "Go to Notebooks",
    icon: IconCode,
    category: "navigation",
    href: "/data-transformation/notebooks",
    shortcut: ["g", "n"],
    keywords: ["jupyter", "python"],
  },
  {
    id: "analytics",
    title: "Go to Analytics",
    icon: IconChartBar,
    category: "navigation",
    href: "/data-analytics",
    keywords: ["dashboards", "reports", "bi"],
  },
  {
    id: "real-time",
    title: "Go to Real-Time Analytics",
    icon: IconWaveSine,
    category: "navigation",
    href: "/real-time-analytics",
    keywords: ["streaming", "events"],
  },
  {
    id: "data-science",
    title: "Go to Data Science",
    icon: IconBrain,
    category: "navigation",
    href: "/data-science",
    keywords: ["ml", "models", "experiments"],
  },
  {
    id: "governance",
    title: "Go to Data Governance",
    icon: IconShield,
    category: "navigation",
    href: "/data-governance",
    keywords: ["catalog", "lineage", "quality"],
  },
  {
    id: "monitoring",
    title: "Go to Monitoring",
    icon: IconActivity,
    category: "navigation",
    href: "/monitoring",
    keywords: ["health", "alerts", "logs"],
  },
  {
    id: "settings",
    title: "Go to Settings",
    icon: IconSettings,
    category: "navigation",
    href: "/settings",
    shortcut: ["g", ","],
    keywords: ["preferences", "configuration"],
  },
];

const actionItems: CommandItem[] = [
  {
    id: "create-pipeline",
    title: "Create New Pipeline",
    description: "Set up a new data integration pipeline",
    icon: IconPlus,
    category: "actions",
    href: "/data-integration/pipelines?create=true",
    shortcut: ["c", "p"],
    keywords: ["new", "add"],
  },
  {
    id: "create-workflow",
    title: "Create New Workflow",
    description: "Build a new data transformation workflow",
    icon: IconPlus,
    category: "actions",
    href: "/data-transformation/workflows/new/builder",
    shortcut: ["c", "w"],
    keywords: ["new", "add"],
  },
  {
    id: "create-notebook",
    title: "Create New Notebook",
    description: "Start a new Jupyter notebook",
    icon: IconPlus,
    category: "actions",
    href: "/data-transformation/notebooks?create=true",
    shortcut: ["c", "n"],
    keywords: ["new", "add", "jupyter"],
  },
  {
    id: "create-dashboard",
    title: "Create New Dashboard",
    description: "Build a new analytics dashboard",
    icon: IconPlus,
    category: "actions",
    href: "/data-analytics/dashboards?create=true",
    shortcut: ["c", "d"],
    keywords: ["new", "add", "bi"],
  },
  {
    id: "run-query",
    title: "Run SQL Query",
    description: "Execute a query in the SQL editor",
    icon: IconCode,
    category: "actions",
    href: "/lakehouse/sql-editor",
    shortcut: ["r", "q"],
  },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [recentItems, setRecentItems] = useState<CommandItem[]>([]);

  // Load recent items from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("command-palette-recent");
    if (stored) {
      try {
        const ids = JSON.parse(stored) as string[];
        const items = [...navigationItems, ...actionItems].filter((item) =>
          ids.includes(item.id)
        );
        setRecentItems(items.slice(0, 5));
      } catch {
        // Ignore parse errors
      }
    }
  }, [open]);

  // Save to recent
  const saveToRecent = useCallback((itemId: string) => {
    const stored = localStorage.getItem("command-palette-recent");
    let ids: string[] = [];
    if (stored) {
      try {
        ids = JSON.parse(stored) as string[];
      } catch {
        // Ignore parse errors
      }
    }
    // Remove if exists and add to front
    ids = [itemId, ...ids.filter((id) => id !== itemId)].slice(0, 10);
    localStorage.setItem("command-palette-recent", JSON.stringify(ids));
  }, []);

  // Handle item selection
  const handleSelect = useCallback(
    (item: CommandItem) => {
      saveToRecent(item.id);
      onOpenChange(false);
      setSearch("");

      if (item.action) {
        item.action();
      } else if (item.href) {
        router.push(item.href);
      }
    },
    [router, onOpenChange, saveToRecent]
  );

  // Theme toggle items
  const settingsItems: CommandItem[] = useMemo(
    () => [
      {
        id: "toggle-theme",
        title:
          theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
        icon: theme === "dark" ? IconSun : IconMoon,
        category: "settings",
        action: () => setTheme(theme === "dark" ? "light" : "dark"),
        shortcut: ["⌘", "shift", "l"],
      },
      {
        id: "keyboard-shortcuts",
        title: "Keyboard Shortcuts",
        icon: IconKeyboard,
        category: "settings",
        action: () => {
          // TODO: Open keyboard shortcuts modal
        },
      },
    ],
    [theme, setTheme]
  );

  // Keyboard shortcut to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-lg max-w-2xl">
        <VisuallyHidden>
          <DialogTitle>Command Palette</DialogTitle>
        </VisuallyHidden>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-3">
          <div className="flex items-center border-b px-3">
            <IconSearch className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Type a command or search..."
              value={search}
              onValueChange={setSearch}
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-2">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {/* Recent */}
            {recentItems.length > 0 && !search && (
              <Command.Group heading="Recent">
                {recentItems.map((item) => (
                  <CommandItemRow
                    key={item.id}
                    item={item}
                    onSelect={() => handleSelect(item)}
                  />
                ))}
              </Command.Group>
            )}

            {/* Actions */}
            <Command.Group heading="Actions">
              {actionItems.map((item) => (
                <CommandItemRow
                  key={item.id}
                  item={item}
                  onSelect={() => handleSelect(item)}
                />
              ))}
            </Command.Group>

            {/* Navigation */}
            <Command.Group heading="Navigation">
              {navigationItems.map((item) => (
                <CommandItemRow
                  key={item.id}
                  item={item}
                  onSelect={() => handleSelect(item)}
                />
              ))}
            </Command.Group>

            {/* Settings */}
            <Command.Group heading="Settings">
              {settingsItems.map((item) => (
                <CommandItemRow
                  key={item.id}
                  item={item}
                  onSelect={() => handleSelect(item)}
                />
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

interface CommandItemRowProps {
  item: CommandItem;
  onSelect: () => void;
}

function CommandItemRow({ item, onSelect }: CommandItemRowProps) {
  return (
    <Command.Item
      value={`${item.title} ${item.keywords?.join(" ") || ""}`}
      onSelect={onSelect}
      className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
    >
      <item.icon className="mr-3 h-4 w-4 text-muted-foreground" />
      <div className="flex-1">
        <p className="font-medium">{item.title}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground">{item.description}</p>
        )}
      </div>
      {item.shortcut && (
        <div className="flex gap-1">
          {item.shortcut.map((key, index) => (
            <kbd
              key={index}
              className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground"
            >
              {key}
            </kbd>
          ))}
        </div>
      )}
    </Command.Item>
  );
}
