"use client";

import { useState, useEffect } from "react";
import { listTables, IcebergTable } from "@/lib/api/lakehouse";
import {
  IconTable,
  IconRefresh,
  IconSearch,
  IconDatabase,
  IconLoader2,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

interface LakehouseCatalog {
  name: string;
  connector: string;
  is_system: boolean;
  is_default: boolean;
}

export default function TablesPage() {
  const { token, currentWorkspace } = useAuth();
  const [tables, setTables] = useState<IcebergTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [layerFilter, setLayerFilter] = useState<string>("all");

  // Catalog state
  const [catalogs, setCatalogs] = useState<LakehouseCatalog[]>([]);
  const [selectedCatalog, setSelectedCatalog] = useState<string>("iceberg");
  const [isFetchingCatalogs, setIsFetchingCatalogs] = useState(false);

  // Fetch available catalogs
  useEffect(() => {
    const fetchCatalogs = async () => {
      if (!token || !currentWorkspace) return;

      setIsFetchingCatalogs(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/warehouse/catalogs/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Workspace-ID": currentWorkspace.id,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Filter to only show Iceberg catalogs (not system catalogs)
          const icebergCatalogs = (data.catalogs || []).filter(
            (c: LakehouseCatalog) => c.connector === "iceberg" && !c.is_system
          );
          setCatalogs(icebergCatalogs);

          // Set default catalog if available
          const defaultCatalog = icebergCatalogs.find(
            (c: LakehouseCatalog) => c.is_default
          );
          if (defaultCatalog) {
            setSelectedCatalog(defaultCatalog.name);
          } else if (icebergCatalogs.length > 0) {
            setSelectedCatalog(icebergCatalogs[0].name);
          }
        }
      } catch (error) {
        console.error("Failed to fetch catalogs:", error);
      } finally {
        setIsFetchingCatalogs(false);
      }
    };

    fetchCatalogs();
  }, [token, currentWorkspace]);

  useEffect(() => {
    loadTables();
  }, [layerFilter, selectedCatalog]);

  const loadTables = async () => {
    setIsLoading(true);
    try {
      const params: { layer?: "bronze" | "silver" | "gold"; catalog?: string } =
        {};
      if (layerFilter !== "all") {
        params.layer = layerFilter as "bronze" | "silver" | "gold";
      }
      if (selectedCatalog) {
        params.catalog = selectedCatalog;
      }
      const response = await listTables(params);
      setTables(response.tables);
    } catch (error) {
      console.error("Failed to load tables:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTables = tables.filter(
    (table) =>
      table.table_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.namespace.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.schema.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedByLayer = filteredTables.reduce((acc, table) => {
    const layer = table.layer;
    if (!acc[layer]) {
      acc[layer] = [];
    }
    acc[layer].push(table);
    return acc;
  }, {} as Record<string, IcebergTable[]>);

  const getLayerIcon = (layer: string) => {
    switch (layer) {
      case "bronze":
        return "🥉";
      case "silver":
        return "🥈";
      case "gold":
        return "🥇";
      default:
        return "📊";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Table Explorer</h1>
          <p className="text-sm text-muted-foreground">
            Browse and manage Iceberg tables across all layers
          </p>
        </div>
        <Link href="/lakehouse/sql-editor">
          <Button>
            <IconDatabase className="mr-2 h-4 w-4" />
            SQL Editor
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={selectedCatalog}
          onValueChange={setSelectedCatalog}
          disabled={isFetchingCatalogs}
        >
          <SelectTrigger className="w-44">
            {isFetchingCatalogs ? (
              <div className="flex items-center gap-2">
                <IconLoader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <SelectValue placeholder="Select catalog" />
            )}
          </SelectTrigger>
          <SelectContent>
            {catalogs.length === 0 ? (
              <SelectItem value="iceberg">
                <div className="flex items-center gap-2">
                  <IconDatabase className="h-4 w-4" />
                  iceberg (default)
                </div>
              </SelectItem>
            ) : (
              catalogs.map((cat) => (
                <SelectItem key={cat.name} value={cat.name}>
                  <div className="flex items-center gap-2">
                    <IconDatabase className="h-4 w-4" />
                    {cat.name}
                    {cat.is_default && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        default
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Select value={layerFilter} onValueChange={setLayerFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Layers</SelectItem>
            <SelectItem value="bronze">🥉 Bronze</SelectItem>
            <SelectItem value="silver">🥈 Silver</SelectItem>
            <SelectItem value="gold">🥇 Gold</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={loadTables} disabled={isLoading}>
          <IconRefresh
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <IconRefresh className="h-4 w-4 animate-spin" />
              <span>Loading tables...</span>
            </div>
          </CardContent>
        </Card>
      ) : filteredTables.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            {searchQuery ? (
              <>
                <p className="mb-2">No tables match your search</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </Button>
              </>
            ) : (
              <>
                <p className="mb-2">No tables found</p>
                <p className="text-sm mb-4">
                  Create pipelines to start ingesting data into the lakehouse
                </p>
                <Link href="/data-integration/pipelines">
                  <Button size="sm">Create Pipeline →</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByLayer)
            .sort(([a], [b]) => {
              const order = { bronze: 0, silver: 1, gold: 2 };
              return (
                (order[a as keyof typeof order] || 999) -
                (order[b as keyof typeof order] || 999)
              );
            })
            .map(([layer, layerTables]) => (
              <div key={layer} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getLayerIcon(layer)}</span>
                  <h2 className="text-lg font-semibold capitalize">
                    {layer} Layer
                  </h2>
                  <Badge variant="secondary">{layerTables.length} tables</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {layerTables.map((table) => (
                    <Card
                      key={table.full_name}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <IconTable className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">
                              {table.table_name}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {table.namespace}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {table.row_count !== null && (
                                <Badge variant="outline" className="text-xs">
                                  {table.row_count.toLocaleString()} rows
                                </Badge>
                              )}
                            </div>
                            <code className="block text-xs text-muted-foreground mt-1 truncate">
                              {table.full_name}
                            </code>
                            <Link
                              href={`/lakehouse/sql-editor?table=${table.full_name}`}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 h-7 text-xs w-full"
                              >
                                Query in SQL Editor →
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Total: {filteredTables.length} table
              {filteredTables.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>Catalog: {selectedCatalog}</span>
              <span>Storage: MinIO (S3)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
