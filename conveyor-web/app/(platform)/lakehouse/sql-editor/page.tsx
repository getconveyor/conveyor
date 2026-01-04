"use client";

import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { IconPlayerPlay, IconDeviceFloppy, IconClock, IconDownload } from "@tabler/icons-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { executeQuery, getQueryHistory, QueryHistory } from "@/lib/api/lakehouse";

export default function SqlEditorPage() {
  const [query, setQuery] = useState("SELECT * FROM iceberg.bronze.default.example_table LIMIT 100;");
  const [results, setResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const { toast } = useToast();

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

      toast({
        title: "Query Executed Successfully",
        description: `Returned ${response.rows_returned} rows in ${response.execution_time_display}`,
      });

      // Reload history
      loadQueryHistory();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || "Failed to execute query";

      toast({
        title: "Query Execution Failed",
        description: errorMessage,
        variant: "destructive",
      });

      setResults({
        status: "failed",
        error: errorMessage,
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
        results.columns.map((col: string) => {
          const value = row[col];
          // Escape values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(",")
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
            onClick={() => window.location.href = "/lakehouse/history"}
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
          <div className="border rounded-lg overflow-hidden" style={{ height: '300px' }}>
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
                  <Button variant="outline" size="sm" onClick={handleExportResults}>
                    <IconDownload className="mr-2 h-3.5 w-3.5" />
                    Export CSV
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {results.status === "failed" ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-sm font-medium text-destructive">Query Execution Failed</p>
                <p className="text-sm text-muted-foreground mt-1">{results.error}</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {results.columns.map((col: string) => (
                        <th key={col} className="px-4 py-2 text-left font-medium">
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
                                <span className="text-muted-foreground italic">null</span>
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
              onClick={() => setQuery("SELECT * FROM iceberg.bronze.default.my_table LIMIT 100;")}
            >
              SELECT * FROM iceberg.bronze.default.my_table LIMIT 100;
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
