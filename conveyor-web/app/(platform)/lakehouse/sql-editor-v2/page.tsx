"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import {
  IconPlayerPlay,
  IconDeviceFloppy,
  IconClock,
  IconDownload,
  IconPlus,
  IconX,
  IconDatabase,
  IconTable,
  IconRefresh,
} from "@tabler/icons-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SchemaTree, SchemaTreeNode } from "@/components/schema-tree";
import { DataGrid, commonColumns, dateFormatter } from "@/components/data-grid";
import { toast } from "sonner";
import {
  executeQuery,
  getQueryHistory,
  QueryHistory,
} from "@/lib/api/lakehouse";

// Demo schema data
const demoSchemaData: SchemaTreeNode[] = [
  {
    id: "iceberg",
    name: "iceberg",
    type: "catalog",
    children: [
      {
        id: "iceberg-bronze",
        name: "bronze",
        type: "layer",
        layer: "bronze",
        children: [
          {
            id: "iceberg-bronze-default",
            name: "default",
            type: "schema",
            children: [
              {
                id: "iceberg-bronze-default-customers",
                name: "customers",
                type: "table",
                children: [
                  {
                    id: "c-id",
                    name: "id",
                    type: "column",
                    dataType: "BIGINT",
                    isPrimaryKey: true,
                  },
                  {
                    id: "c-name",
                    name: "name",
                    type: "column",
                    dataType: "VARCHAR",
                  },
                  {
                    id: "c-email",
                    name: "email",
                    type: "column",
                    dataType: "VARCHAR",
                  },
                  {
                    id: "c-created",
                    name: "created_at",
                    type: "column",
                    dataType: "TIMESTAMP",
                  },
                ],
              },
              {
                id: "iceberg-bronze-default-orders",
                name: "orders",
                type: "table",
                children: [
                  {
                    id: "o-id",
                    name: "id",
                    type: "column",
                    dataType: "BIGINT",
                    isPrimaryKey: true,
                  },
                  {
                    id: "o-customer",
                    name: "customer_id",
                    type: "column",
                    dataType: "BIGINT",
                  },
                  {
                    id: "o-total",
                    name: "total",
                    type: "column",
                    dataType: "DECIMAL",
                  },
                  {
                    id: "o-status",
                    name: "status",
                    type: "column",
                    dataType: "VARCHAR",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "iceberg-silver",
        name: "silver",
        type: "layer",
        layer: "silver",
        children: [
          {
            id: "iceberg-silver-analytics",
            name: "analytics",
            type: "schema",
            children: [
              {
                id: "iceberg-silver-analytics-customer_metrics",
                name: "customer_metrics",
                type: "table",
                children: [
                  {
                    id: "cm-id",
                    name: "customer_id",
                    type: "column",
                    dataType: "BIGINT",
                    isPrimaryKey: true,
                  },
                  {
                    id: "cm-orders",
                    name: "total_orders",
                    type: "column",
                    dataType: "INTEGER",
                  },
                  {
                    id: "cm-revenue",
                    name: "total_revenue",
                    type: "column",
                    dataType: "DECIMAL",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "iceberg-gold",
        name: "gold",
        type: "layer",
        layer: "gold",
        children: [
          {
            id: "iceberg-gold-reporting",
            name: "reporting",
            type: "schema",
            children: [
              {
                id: "iceberg-gold-reporting-daily_sales",
                name: "daily_sales",
                type: "table",
                children: [
                  {
                    id: "ds-date",
                    name: "date",
                    type: "column",
                    dataType: "DATE",
                    isPrimaryKey: true,
                  },
                  {
                    id: "ds-revenue",
                    name: "revenue",
                    type: "column",
                    dataType: "DECIMAL",
                  },
                  {
                    id: "ds-orders",
                    name: "order_count",
                    type: "column",
                    dataType: "INTEGER",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

interface QueryTab {
  id: string;
  name: string;
  query: string;
  results: any | null;
}

function parseTrinoError(error: string | undefined | null): {
  type?: string;
  name?: string;
  message: string;
} {
  if (!error) return { message: "Unknown error" };
  const messageMatch = error.match(/message="([^"]+)"/);
  const typeMatch = error.match(/type=([A-Z_]+)/);
  const nameMatch = error.match(/name=([A-Z_]+)/);
  if (messageMatch) {
    return {
      type: typeMatch?.[1],
      name: nameMatch?.[1],
      message: messageMatch[1],
    };
  }
  return { message: error };
}

export default function EnhancedSqlEditorPage() {
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("table");

  const [tabs, setTabs] = useState<QueryTab[]>([
    {
      id: "tab-1",
      name: "Query 1",
      query: tableParam
        ? `SELECT * FROM ${tableParam} LIMIT 100;`
        : "-- Welcome to the SQL Editor\n-- Select a table from the schema browser to get started\n\nSHOW SCHEMAS FROM iceberg;",
      results: null,
    },
  ]);
  const [activeTab, setActiveTab] = useState("tab-1");
  const [isRunning, setIsRunning] = useState(false);
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [schemaData, setSchemaData] =
    useState<SchemaTreeNode[]>(demoSchemaData);
  const [schemaLoading, setSchemaLoading] = useState(false);

  const currentTab = tabs.find((t) => t.id === activeTab);

  useEffect(() => {
    loadQueryHistory();
  }, []);

  const loadQueryHistory = async () => {
    try {
      const history = await getQueryHistory();
      setQueryHistory(history);
    } catch (error: any) {
      console.error("Failed to load query history:", error);
    }
  };

  const updateCurrentTab = useCallback(
    (updates: Partial<QueryTab>) => {
      setTabs((prev) =>
        prev.map((tab) => (tab.id === activeTab ? { ...tab, ...updates } : tab))
      );
    },
    [activeTab]
  );

  const addTab = () => {
    const newId = `tab-${Date.now()}`;
    setTabs((prev) => [
      ...prev,
      {
        id: newId,
        name: `Query ${prev.length + 1}`,
        query: "",
        results: null,
      },
    ]);
    setActiveTab(newId);
  };

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return;
    const index = tabs.findIndex((t) => t.id === tabId);
    const newTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(newTabs);
    if (activeTab === tabId) {
      setActiveTab(newTabs[Math.max(0, index - 1)].id);
    }
  };

  const handleRun = async () => {
    if (!currentTab?.query.trim()) {
      toast.error("Please enter a SQL query to execute");
      return;
    }

    setIsRunning(true);
    updateCurrentTab({ results: null });

    try {
      const response = await executeQuery({
        query: currentTab.query.trim(),
        catalog: "iceberg",
        limit: 1000,
      });

      updateCurrentTab({ results: response });

      if (response.status === "failed") {
        const parsedError = parseTrinoError(response.error);
        toast.error(parsedError.message);
      } else {
        toast.success(
          `Returned ${response.rows_returned} rows in ${response.execution_time_display}`
        );
      }

      loadQueryHistory();
    } catch (error: any) {
      const rawError =
        error.response?.data?.error ||
        error.message ||
        "Failed to execute query";
      const parsedError = parseTrinoError(rawError);
      toast.error(parsedError.message);
      updateCurrentTab({
        results: {
          status: "failed",
          error: rawError,
          execution_time_ms: error.response?.data?.execution_time_ms,
        },
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSchemaSelect = (node: SchemaTreeNode) => {
    if (node.type === "table") {
      // Build full path
      const path: string[] = [];
      const findPath = (nodes: SchemaTreeNode[], target: string): boolean => {
        for (const n of nodes) {
          if (n.id === target) {
            if (n.type !== "column") path.unshift(n.name);
            return true;
          }
          if (n.children && findPath(n.children, target)) {
            if (n.type !== "column" && n.type !== "layer") path.unshift(n.name);
            return true;
          }
        }
        return false;
      };
      findPath(schemaData, node.id);
      const tablePath = path.join(".");
      updateCurrentTab({
        query: `SELECT * FROM ${tablePath} LIMIT 100;`,
      });
    } else if (node.type === "column") {
      // Insert column name at cursor or append
      const colName = node.name;
      updateCurrentTab({
        query: currentTab?.query
          ? `${currentTab.query.trimEnd()}\n-- Column: ${colName}`
          : colName,
      });
    }
  };

  const handleExportResults = () => {
    if (!currentTab?.results || currentTab.results.status === "failed") return;

    const results = currentTab.results;
    const csv = [
      results.columns.join(","),
      ...results.data.map((row: any) =>
        results.columns
          .map((col: string) => {
            const value = row[col];
            if (
              typeof value === "string" &&
              (value.includes(",") || value.includes('"'))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? "";
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query-results-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Results exported to CSV");
  };

  const refreshSchema = async () => {
    setSchemaLoading(true);
    // Simulate schema refresh
    await new Promise((r) => setTimeout(r, 1000));
    setSchemaLoading(false);
    toast.success("Schema refreshed");
  };

  return (
    <div className="h-[calc(100vh-var(--header-height)-2rem)]">
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full rounded-lg border"
      >
        {/* Schema Browser */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
          <div className="h-full flex flex-col">
            <div className="p-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconDatabase className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Schema Browser</span>
              </div>
            </div>
            <SchemaTree
              data={schemaData}
              onSelect={handleSchemaSelect}
              onRefresh={refreshSchema}
              loading={schemaLoading}
              height={600}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Editor and Results */}
        <ResizablePanel defaultSize={80}>
          <ResizablePanelGroup direction="vertical">
            {/* Editor */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full flex flex-col">
                {/* Toolbar */}
                <div className="flex items-center justify-between p-2 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleRun}
                      disabled={!currentTab?.query.trim() || isRunning}
                      size="sm"
                      className="gap-2"
                    >
                      <IconPlayerPlay className="h-4 w-4" />
                      {isRunning ? "Running..." : "Run"}
                    </Button>
                    <Badge variant="outline" className="text-xs">
                      Ctrl+Enter
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Catalog: iceberg
                    </Badge>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <IconClock className="h-4 w-4" />
                      History
                      {queryHistory.length > 0 && (
                        <Badge variant="secondary" className="text-xs ml-1">
                          {queryHistory.length}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Query Tabs */}
                <div className="flex items-center border-b bg-muted/20">
                  <ScrollArea className="flex-1">
                    <div className="flex items-center">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          className={`flex items-center gap-2 px-4 py-2 text-sm border-r transition-colors ${
                            activeTab === tab.id
                              ? "bg-background border-b-2 border-b-primary"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => setActiveTab(tab.id)}
                        >
                          <span>{tab.name}</span>
                          {tabs.length > 1 && (
                            <IconX
                              className="h-3 w-3 text-muted-foreground hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                closeTab(tab.id);
                              }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 mx-1"
                    onClick={addTab}
                  >
                    <IconPlus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Monaco Editor */}
                <div className="flex-1">
                  <Editor
                    value={currentTab?.query || ""}
                    onChange={(value) =>
                      updateCurrentTab({ query: value || "" })
                    }
                    language="sql"
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: "on",
                      readOnly: isRunning,
                      automaticLayout: true,
                      padding: { top: 16 },
                      scrollBeyondLastLine: false,
                    }}
                    onMount={(editor, monaco) => {
                      editor.addCommand(
                        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
                        () => {
                          if (!isRunning && currentTab?.query.trim()) {
                            handleRun();
                          }
                        }
                      );
                    }}
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Results */}
            <ResizablePanel defaultSize={50} minSize={20}>
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-2 border-b bg-muted/30">
                  <span className="font-medium text-sm">
                    {currentTab?.results?.status === "failed"
                      ? "Error"
                      : "Results"}
                  </span>
                  {currentTab?.results?.status === "finished" && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {currentTab.results.rows_returned} rows
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {currentTab.results.execution_time_display}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportResults}
                        className="gap-2"
                      >
                        <IconDownload className="h-3.5 w-3.5" />
                        Export
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-auto">
                  {!currentTab?.results ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <IconTable className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Run a query to see results</p>
                      </div>
                    </div>
                  ) : currentTab.results.status === "failed" ? (
                    <div className="p-4">
                      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-medium text-destructive">
                            Query Execution Failed
                          </p>
                          {parseTrinoError(currentTab.results.error).name && (
                            <Badge variant="destructive" className="text-xs">
                              {parseTrinoError(
                                currentTab.results.error
                              ).name?.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">
                          {parseTrinoError(currentTab.results.error).message}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full">
                      <div className="rounded-lg overflow-x-auto h-full">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 sticky top-0">
                            <tr>
                              {currentTab.results.columns.map((col: string) => (
                                <th
                                  key={col}
                                  className="px-4 py-2 text-left font-medium border-b"
                                >
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {currentTab.results.data.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={currentTab.results.columns.length}
                                  className="px-4 py-8 text-center text-muted-foreground"
                                >
                                  No results found
                                </td>
                              </tr>
                            ) : (
                              currentTab.results.data.map(
                                (row: any, idx: number) => (
                                  <tr
                                    key={idx}
                                    className="border-b hover:bg-muted/50"
                                  >
                                    {currentTab.results.columns.map(
                                      (col: string) => (
                                        <td key={col} className="px-4 py-2">
                                          {row[col] === null ? (
                                            <span className="text-muted-foreground italic">
                                              null
                                            </span>
                                          ) : (
                                            String(row[col])
                                          )}
                                        </td>
                                      )
                                    )}
                                  </tr>
                                )
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
