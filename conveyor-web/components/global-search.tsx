"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
} from "@tabler/icons-react"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SearchResult {
  id: string
  title: string
  description: string
  category: "workflows" | "dashboards" | "notebooks" | "data-sources" | "settings" | "help"
  path: string
}

const mockResults: SearchResult[] = [
  {
    id: "1",
    title: "ETL Pipeline - Daily Sales",
    description: "Extract, transform, and load daily sales data",
    category: "workflows",
    path: "/data-transformation/workflows/1",
  },
  {
    id: "2",
    title: "Sales Analytics Dashboard",
    description: "Real-time sales metrics and KPIs",
    category: "dashboards",
    path: "/data-analytics/dashboards/1",
  },
  {
    id: "3",
    title: "Customer Data Cleanup",
    description: "Python notebook for cleaning customer data",
    category: "notebooks",
    path: "/data-transformation/notebooks/1",
  },
  {
    id: "4",
    title: "PostgreSQL Production",
    description: "Main production database connection",
    category: "data-sources",
    path: "/data-sources/postgresql/1",
  },
  {
    id: "5",
    title: "Data Quality Check",
    description: "Automated data validation workflow",
    category: "workflows",
    path: "/data-transformation/workflows/2",
  },
  {
    id: "6",
    title: "Revenue Dashboard",
    description: "Monthly and yearly revenue tracking",
    category: "dashboards",
    path: "/data-analytics/dashboards/2",
  },
  {
    id: "7",
    title: "Getting Started Guide",
    description: "Quick start guide for new users",
    category: "help",
    path: "/help",
  },
  {
    id: "8",
    title: "Account Settings",
    description: "Manage your account preferences",
    category: "settings",
    path: "/settings",
  },
]

const recentSearches = [
  { query: "Sales dashboard", timestamp: "2 hours ago" },
  { query: "ETL workflow", timestamp: "Yesterday" },
  { query: "PostgreSQL", timestamp: "3 days ago" },
]

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const router = useRouter()

  useEffect(() => {
    if (query.trim().length > 0) {
      const filtered = mockResults.filter(
        (result) =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.description.toLowerCase().includes(query.toLowerCase()) ||
          result.category.toLowerCase().includes(query.toLowerCase())
      )
      setResults(filtered)
    } else {
      setResults([])
    }
  }, [query])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "workflows":
        return <IconPlaylist className="h-4 w-4" />
      case "dashboards":
        return <IconChartLine className="h-4 w-4" />
      case "notebooks":
        return <IconCode className="h-4 w-4" />
      case "data-sources":
        return <IconDatabase className="h-4 w-4" />
      case "settings":
        return <IconSettings className="h-4 w-4" />
      case "help":
        return <IconHelp className="h-4 w-4" />
      default:
        return <IconSearch className="h-4 w-4" />
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "workflows":
        return "Workflow"
      case "dashboards":
        return "Dashboard"
      case "notebooks":
        return "Notebook"
      case "data-sources":
        return "Data Source"
      case "settings":
        return "Settings"
      case "help":
        return "Help"
      default:
        return category
    }
  }

  const handleResultClick = (path: string) => {
    router.push(path)
    onOpenChange(false)
    setQuery("")
  }

  const handleRecentSearch = (searchQuery: string) => {
    setQuery(searchQuery)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        onOpenChange(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onOpenChange])

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
                    onClick={() => handleResultClick("/data-transformation/workflows")}
                  >
                    <IconPlaylist className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Workflows</span>
                  </div>
                  <div
                    className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => handleResultClick("/data-analytics/dashboards")}
                  >
                    <IconChartLine className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Dashboards</span>
                  </div>
                  <div
                    className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => handleResultClick("/data-transformation/notebooks")}
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
          ) : results.length > 0 ? (
            <div className="p-2">
              <div className="space-y-1">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors group"
                    onClick={() => handleResultClick(result.path)}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5 text-muted-foreground">
                        {getCategoryIcon(result.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">
                            {result.title}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {getCategoryLabel(result.category)}
                          </Badge>
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
  )
}
