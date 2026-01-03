"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { integrationApi, Source, SourceType } from "@/lib/api/integration";
import { toast } from "sonner";
import {
  IconPlus,
  IconSearch,
  IconApi,
  IconDatabase,
  IconCloud,
  IconFile,
  IconBrandGithub,
  IconBrandGoogle,
  IconBrandStripe,
  IconBrandSlack,
  IconExternalLink,
  IconLoader2,
} from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SourceCategory = "api" | "database" | "cloud" | "file";

// Helper function to get icon for source type
function getIconForType(type: string): React.ElementType {
  const lowerType = type.toLowerCase();
  if (lowerType.includes("mysql")) return IconDatabase;
  if (lowerType.includes("postgres")) return IconDatabase;
  if (lowerType.includes("s3") || lowerType.includes("aws")) return IconCloud;
  if (lowerType.includes("sftp") || lowerType.includes("ftp")) return IconFile;
  if (lowerType.includes("github")) return IconBrandGithub;
  if (lowerType.includes("google")) return IconBrandGoogle;
  if (lowerType.includes("stripe")) return IconBrandStripe;
  if (lowerType.includes("slack")) return IconBrandSlack;
  if (
    lowerType.includes("api") ||
    lowerType.includes("rest") ||
    lowerType.includes("graphql")
  )
    return IconApi;
  return IconDatabase;
}

export default function SourceConnectorsPage() {
  const { currentWorkspace } = useWorkspace();
  const [sourceTypes, setSourceTypes] = useState<SourceType[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState("");
  const [catalogCategory, setCatalogCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSourceTypes();
    loadSources();
  }, [currentWorkspace]);

  async function loadSourceTypes() {
    try {
      setIsLoading(true);
      const response = await integrationApi.getSourceCatalog();
      setSourceTypes(response.source_types);
    } catch (error: any) {
      console.error("Failed to load source types:", error);
      toast.error("Failed to load available source types");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadSources() {
    if (!currentWorkspace) return;

    try {
      const data = await integrationApi.getSources();
      setSources(data);
    } catch (error: any) {
      console.error("Failed to load sources:", error);
      toast.error(error.message || "Failed to load sources");
    }
  }

  const filteredCatalog = sourceTypes.filter((sourceType) => {
    const matchesSearch = sourceType.name
      .toLowerCase()
      .includes(catalogSearchQuery.toLowerCase());
    const matchesCategory =
      catalogCategory === "all" || sourceType.category === catalogCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Source Connectors</h1>
          <p className="text-sm text-muted-foreground">
            List of available data source connectors
          </p>
        </div>
        <Button onClick={() => setIsCatalogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Add Source
        </Button>
      </div>

      <div className="py-4 min-h-0 overflow-hidden flex-1 flex flex-col">
        <Tabs
          value={catalogCategory}
          onValueChange={setCatalogCategory}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="flex items-center justify-between gap-4 mb-4 flex-shrink-0">
            <TabsList>
              <TabsTrigger value="all">All Sources</TabsTrigger>
              <TabsTrigger value="api">APIs</TabsTrigger>
              <TabsTrigger value="database">Databases</TabsTrigger>
              <TabsTrigger value="cloud">Cloud Storage</TabsTrigger>
              <TabsTrigger value="file">File Systems</TabsTrigger>
            </TabsList>
            <div className="relative w-80">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search source types..."
                value={catalogSearchQuery}
                onChange={(e) => setCatalogSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <IconDatabase className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No source types found</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
                {filteredCatalog.map((sourceType) => {
                  const TypeIcon = getIconForType(sourceType.id);
                  return (
                    <Card
                      key={sourceType.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <TypeIcon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg leading-tight">
                                {sourceType.name}
                              </h3>
                              {sourceType.popular && (
                                <Badge variant="secondary" className="text-xs">
                                  Popular
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                              {sourceType.category.charAt(0).toUpperCase() +
                                sourceType.category.slice(1)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {sourceType.description}
                        </p>
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground mb-1">
                            Authentication
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {sourceType.auth_types
                              .slice(0, 3)
                              .map((auth, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {auth}
                                </Badge>
                              ))}
                            {sourceType.auth_types.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{sourceType.auth_types.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            asChild
                          >
                            <a
                              href={sourceType.documentation}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <IconExternalLink className="mr-1 h-3 w-3" />
                              Docs
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </>
  );
}
