"use client";

import { useState, useEffect } from "react";
import { listTables, IcebergTable } from "@/lib/api/lakehouse";
import { IconTable, IconRefresh, IconSearch } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function GoldLayerPage() {
  const [tables, setTables] = useState<IcebergTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    setIsLoading(true);
    try {
      const response = await listTables({ layer: "gold" });
      setTables(response.tables);
    } catch (error) {
      console.error("Failed to load gold tables:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTables = tables.filter(
    (table) =>
      table.table_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.namespace.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🥇</span>
          <h1 className="text-xl font-semibold tracking-tight">Gold Layer</h1>
        </div>
        <p className="text-muted-foreground">
          Business-ready aggregated data • Optimized for reporting • Production metrics and KPIs
        </p>
      </div>

      <div className="rounded-lg border bg-muted/50 p-4">
        <h3 className="font-semibold mb-2">About Gold Layer</h3>
        <p className="text-sm text-muted-foreground">
          The Gold layer contains business-level aggregates and curated datasets.
          Data is optimized for consumption by BI tools, reports, and dashboards.
          This layer provides the single source of truth for business metrics.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={loadTables} disabled={isLoading}>
              <IconRefresh className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          <Link href="/lakehouse/sql-editor">
            <Button variant="outline" size="sm">
              Query with Trino SQL →
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <IconRefresh className="h-4 w-4 animate-spin" />
                <span>Loading gold tables...</span>
              </div>
            </CardContent>
          </Card>
        ) : filteredTables.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              {searchQuery ? (
                <>
                  <p className="mb-2">No tables match your search</p>
                  <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>
                    Clear search
                  </Button>
                </>
              ) : (
                <>
                  <p className="mb-2">No Gold tables found</p>
                  <p className="text-sm mb-4">
                    Create business aggregates from Silver data for reporting and analytics
                  </p>
                  <Link href="/data-transformation/jobs">
                    <Button size="sm">Create Transformation Job →</Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTables.map((table) => (
              <Card key={table.full_name} className="hover:bg-accent/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <IconTable className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{table.table_name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {table.namespace}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {table.row_count !== null && (
                          <span>{table.row_count.toLocaleString()} rows</span>
                        )}
                        <code className="text-xs">{table.schema}</code>
                      </div>
                      <Link href={`/lakehouse/sql-editor?table=${table.full_name}`}>
                        <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs">
                          Query →
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="font-semibold text-sm mb-2">Typical Use Cases</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Business KPIs and metrics for dashboards</li>
          <li>Aggregated data marts for specific departments</li>
          <li>Production-ready datasets for BI tools</li>
          <li>Performance-optimized query results</li>
        </ul>
      </div>
    </div>
  );
}
