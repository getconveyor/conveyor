"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  IconFile,
  IconBrain,
  IconActivity,
  IconTag,
  IconBook,
  IconLoader2,
} from "@tabler/icons-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/auth-context";

interface SearchResult {
  id: string;
  type: string;
  name: string;
  description: string;
  url: string;
  relevance_score?: number;
  status?: string;
  connector_type?: string;
  model_type?: string;
  file_type?: string;
  stream_type?: string;
  asset_type?: string;
}

interface SearchResponse {
  query: string;
  total_results: number;
  results: SearchResult[];
}

const recentSearches = [
  { query: "Sales dashboard", timestamp: "2 hours ago" },
  { query: "ETL workflow", timestamp: "Yesterday" },
  { query: "PostgreSQL", timestamp: "3 days ago" },
];

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { token, currentWorkspace } = useAuth();

  // Debounced search function
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim() || !token) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        if (currentWorkspace?.id) {
          headers["X-Workspace-ID"] = currentWorkspace.id;
        }

        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
          }/api/monitoring/search/?q=${encodeURIComponent(searchQuery)}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data: SearchResponse = await response.json();
        setResults(data.results);
      } catch (err) {
        console.error("Search error:", err);
        setError("Search failed. Please try again.");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [token, currentWorkspace?.id]
  );

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "pipeline":
        return <IconPlaylist className="h-4 w-4" />;
      case "dashboard":
        return <IconChartLine className="h-4 w-4" />;
      case "query":
        return <IconCode className="h-4 w-4" />;
      case "source":
        return <IconDatabase className="h-4 w-4" />;
      case "transformation":
        return <IconSettings className="h-4 w-4" />;
      case "model":
        return <IconBrain className="h-4 w-4" />;
      case "file":
        return <IconFile className="h-4 w-4" />;
      case "stream":
        return <IconActivity className="h-4 w-4" />;
      case "asset":
        return <IconTag className="h-4 w-4" />;
      case "glossary":
        return <IconBook className="h-4 w-4" />;
      default:
        return <IconSearch className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pipeline: "Pipeline",
      dashboard: "Dashboard",
      query: "Query",
      source: "Data Source",
      transformation: "Transformation",
      model: "ML Model",
      file: "File",
      stream: "Stream",
      asset: "Data Asset",
      glossary: "Glossary",
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      pipeline: "text-purple-500",
      dashboard: "text-blue-500",
      query: "text-cyan-500",
      source: "text-green-500",
      transformation: "text-orange-500",
      model: "text-pink-500",
      file: "text-yellow-500",
      stream: "text-red-500",
      asset: "text-indigo-500",
      glossary: "text-teal-500",
    };
    return colors[type] || "text-muted-foreground";
  };

  const handleResultClick = (url: string) => {
    router.push(url);
    onOpenChange(false);
    setQuery("");
  };

  const handleRecentSearch = (searchQuery: string) => {
    setQuery(searchQuery);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <div className="flex items-center border-b px-4 py-3">
          <IconSearch className="h-5 w-5 text-muted-foreground mr-3" />
          <Input
            placeholder="Search workflows, dashboards, notebooks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0 text-base"
            autoFocus
          />
          <Badge variant="outline" className="text-xs ml-2">
            ⌘K
          </Badge>
        </div>

        <ScrollArea className="max-h-[400px]">
          {query.trim().length === 0 ? (
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-3">Recent Searches</h3>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors group"
                      onClick={() => handleRecentSearch(search.query)}
                    >
                      <div className="flex items-center gap-2">
                        <IconClock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{search.query}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {search.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Quick Links</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                    onClick={() =>
                      handleResultClick("/data-transformation/workflows")
                    }
                  >
                    <IconPlaylist className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Workflows</span>
                  </div>
                  <div
                    className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                    onClick={() =>
                      handleResultClick("/data-analytics/dashboards")
                    }
                  >
                    <IconChartLine className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Dashboards</span>
                  </div>
                  <div
                    className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                    onClick={() =>
                      handleResultClick("/data-transformation/notebooks")
                    }
                  >
                    <IconCode className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Notebooks</span>
                  </div>
                  <div
                    className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => handleResultClick("/help")}
                  >
                    <IconHelp className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Help Center</span>
                  </div>
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="p-12 text-center">
              <IconLoader2 className="h-12 w-12 text-muted-foreground mx-auto mb-3 animate-spin" />
              <p className="text-sm text-muted-foreground">Searching...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <IconSearch className="h-12 w-12 text-red-500 mx-auto mb-3 opacity-50" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              <div className="space-y-1">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors group"
                    onClick={() => handleResultClick(result.url)}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`mt-0.5 ${getTypeColor(result.type)}`}>
                        {getTypeIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">
                            {result.name}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(result.type)}
                          </Badge>
                          {result.status && (
                            <Badge
                              variant={
                                result.status === "active" ||
                                result.status === "running"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {result.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {result.description}
                        </p>
                      </div>
                    </div>
                    <IconArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <IconSearch className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                No results found for "{query}"
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for workflows, dashboards, or notebooks
              </p>
            </div>
          )}
        </ScrollArea>

        {results.length > 0 && (
          <div className="border-t px-4 py-2 text-xs text-muted-foreground">
            {results.length} result{results.length === 1 ? "" : "s"} found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
