"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import {
  IconPlayerPlay,
  IconDeviceFloppy,
  IconClock,
  IconDownload,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  executeQuery,
  getQueryHistory,
  QueryHistory,
} from "@/lib/api/lakehouse";

/**
 * Parse Trino error message to extract the human-readable message
 * Example input: "TrinoUserError(type=USER_ERROR, name=SYNTAX_ERROR, message=\"Too many dots...\", query_id=xxx)"
 * Returns: { type: "USER_ERROR", name: "SYNTAX_ERROR", message: "Too many dots..." }
 */
function parseTrinoError(error: string | undefined | null): {
  type?: string;
  name?: string;
  message: string;
} {
  if (!error) return { message: "Unknown error" };

  // Try to extract message from Trino error format
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

  // Return original error if not in Trino format
  return { message: error };
}

export default function SqlEditorPage() {
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("table");

  const [query, setQuery] = useState(
    tableParam
      ? `SELECT * FROM ${tableParam} LIMIT 100;`
      : "SELECT * FROM iceberg.bronze.default.example_table LIMIT 100;"
  );
  const [results, setResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const { toast } = useToast();

  // Update query when table parameter changes
  useEffect(() => {
    if (tableParam) {
      setQuery(`SELECT * FROM ${tableParam} LIMIT 100;`);
    }
  }, [tableParam]);

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

  const handleRun = async () => {
    if (!query.trim()) {
      toast({
        title: "Empty Query",
        description: "Please enter a SQL query to execute",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    setResults(null);

    try {
      const response = await executeQuery({
        query: query.trim(),
        catalog: "iceberg",
        limit: 1000,
      });

      setResults(response);

      // Check if query failed (backend returns status: "failed")
      if (response.status === "failed") {
        const parsedError = parseTrinoError(response.error);
        toast({
          title: "Query Execution Failed",
          description: parsedError.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Query Executed Successfully",
          description: `Returned ${response.rows_returned} rows in ${response.execution_time_display}`,
        });
      }

      // Reload history
      loadQueryHistory();
    } catch (error: any) {
      const rawError =
        error.response?.data?.error ||
        error.message ||
        "Failed to execute query";
      const parsedError = parseTrinoError(rawError);

      toast({
        title: "Query Execution Failed",
        description: parsedError.message,
        variant: "destructive",
      });

      setResults({
        status: "failed",
        error: rawError,
        execution_time_ms: error.response?.data?.execution_time_ms,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportResults = () => {
    if (!results || results.status === "failed") return;

    // Create CSV content
    const csv = [
      results.columns.join(","),
      ...results.data.map((row: any) =>
        results.columns
          .map((col: string) => {
            const value = row[col];
            // Escape values that contain commas or quotes
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

    // Create download link
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trino-query-results-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Query results exported to CSV",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SQL Editor (Trino)</h1>
          <p className="text-sm text-muted-foreground">
            Query Iceberg tables using Trino SQL engine
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/lakehouse/history")}
          >
            <IconClock className="mr-2 h-4 w-4" />
            History
            {queryHistory.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {queryHistory.length}
              </Badge>
            )}
          </Button>
          <Button onClick={handleRun} disabled={!query.trim() || isRunning}>
            <IconPlayerPlay className="mr-2 h-4 w-4" />
            {isRunning ? "Executing..." : "Run Query"}
          </Button>
        </div>
      </div>

      {/* SQL Editor */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Query Editor</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">Catalog: iceberg</Badge>
              <span>Ctrl+Enter to execute</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div
            className="border rounded-lg overflow-hidden"
            style={{ height: "300px" }}
          >
            <Editor
              value={query}
              onChange={(value) => setQuery(value || "")}
              language="sql"
              height="300px"
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                readOnly: isRunning,
                automaticLayout: true,
              }}
              onMount={(editor, monaco) => {
                // Add Ctrl+Enter / Cmd+Enter keyboard shortcut
                editor.addCommand(
                  monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
                  () => {
                    if (!isRunning && query.trim()) {
                      handleRun();
                    }
                  }
                );
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {results.status === "failed" ? "Error" : "Query Results"}
                </span>
              </div>
              {results.status === "finished" && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{results.rows_returned} rows</span>
                    <Badge variant="secondary" className="text-xs">
                      {results.execution_time_display}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportResults}
                  >
                    <IconDownload className="mr-2 h-3.5 w-3.5" />
                    Export CSV
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {results.status === "failed" ? (
              (() => {
                const parsedError = parseTrinoError(results.error);
                return (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-medium text-destructive">
                        Query Execution Failed
                      </p>
                      {parsedError.name && (
                        <Badge variant="destructive" className="text-xs">
                          {parsedError.name.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground">
                      {parsedError.message}
                    </p>
                    {results.execution_time_ms && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Execution time: {results.execution_time_ms}ms
                      </p>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {results.columns.map((col: string) => (
                        <th
                          key={col}
                          className="px-4 py-2 text-left font-medium"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.data.length === 0 ? (
                      <tr>
                        <td
                          colSpan={results.columns.length}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          No results found
                        </td>
                      </tr>
                    ) : (
                      results.data.map((row: any, idx: number) => (
                        <tr key={idx} className="border-t hover:bg-muted/50">
                          {results.columns.map((col: string) => (
                            <td key={col} className="px-4 py-2">
                              {row[col] === null ? (
                                <span className="text-muted-foreground italic">
                                  null
                                </span>
                              ) : (
                                String(row[col])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Example Queries */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium">Example Queries</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <p className="text-xs font-medium">List all schemas:</p>
            <code
              className="block p-2 rounded bg-muted text-xs cursor-pointer hover:bg-muted/80"
              onClick={() => setQuery("SHOW SCHEMAS FROM iceberg;")}
            >
              SHOW SCHEMAS FROM iceberg;
            </code>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium">List tables in bronze layer:</p>
            <code
              className="block p-2 rounded bg-muted text-xs cursor-pointer hover:bg-muted/80"
              onClick={() => setQuery("SHOW TABLES FROM iceberg.bronze;")}
            >
              SHOW TABLES FROM iceberg.bronze;
            </code>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium">Query a table:</p>
            <code
              className="block p-2 rounded bg-muted text-xs cursor-pointer hover:bg-muted/80"
              onClick={() =>
                setQuery(
                  "SELECT * FROM iceberg.bronze.default.my_table LIMIT 100;"
                )
              }
            >
              SELECT * FROM iceberg.bronze.default.my_table LIMIT 100;
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
