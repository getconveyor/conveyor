"use client"

import { useState } from "react"
import {
  IconPlayerPlay,
  IconDeviceFloppy,
  IconClock,
  IconTable,
  IconCode,
  IconLoader2,
  IconDownload,
  IconX,
  IconTrash,
  IconFileText,
} from "@tabler/icons-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface SavedQuery {
  id: string
  name: string
  query: string
  executedAt: string
  executionTime: string
}

const initialSavedQueries: SavedQuery[] = [
  {
    id: "1",
    name: "Top Customers by Revenue",
    query: "SELECT \n  customer_id,\n  SUM(order_total) as total_spent,\n  COUNT(*) as order_count\nFROM fact_sales\nWHERE order_date >= '2024-01-01'\nGROUP BY customer_id\nORDER BY total_spent DESC\nLIMIT 100;",
    executedAt: "2 hours ago",
    executionTime: "245ms",
  },
  {
    id: "2",
    name: "Monthly Sales Trend",
    query: "SELECT \n  DATE_TRUNC('month', order_date) as month,\n  SUM(order_total) as total_revenue\nFROM fact_sales\nGROUP BY month\nORDER BY month DESC;",
    executedAt: "1 day ago",
    executionTime: "180ms",
  },
]

export default function EditorPage() {
  const [query, setQuery] = useState(
    "SELECT \n  customer_id,\n  SUM(order_total) as total_spent,\n  COUNT(*) as order_count\nFROM fact_sales\nWHERE order_date >= '2024-01-01'\nGROUP BY customer_id\nORDER BY total_spent DESC\nLIMIT 100;"
  )
  const [results, setResults] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>(initialSavedQueries)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [queryToDelete, setQueryToDelete] = useState<string | null>(null)
  const [queryName, setQueryName] = useState("")

  const mockResults = {
    rows: 100,
    executionTime: "245ms",
    columns: ["customer_id", "total_spent", "order_count"],
    data: [
      { customer_id: "C12345", total_spent: "$24,567", order_count: 45 },
      { customer_id: "C67890", total_spent: "$18,234", order_count: 32 },
      { customer_id: "C54321", total_spent: "$15,892", order_count: 28 },
      { customer_id: "C98765", total_spent: "$14,123", order_count: 25 },
      { customer_id: "C11223", total_spent: "$12,456", order_count: 22 },
    ],
  }

  const handleRun = async () => {
    if (!query.trim()) return

    setIsRunning(true)
    // Simulate query execution
    await new Promise(resolve => setTimeout(resolve, 1200))

    setResults(mockResults)
    setIsRunning(false)
  }

  const handleSaveQuery = async () => {
    if (!queryName.trim()) return

    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))

    const newQuery: SavedQuery = {
      id: Date.now().toString(),
      name: queryName,
      query: query,
      executedAt: "Just now",
      executionTime: results?.executionTime || "-",
    }

    setSavedQueries([newQuery, ...savedQueries])
    setIsLoading(false)
    setIsSaveDialogOpen(false)
    setQueryName("")
  }

  const handleLoadQuery = (savedQuery: SavedQuery) => {
    setQuery(savedQuery.query)
    setIsHistoryDialogOpen(false)
    setResults(null)
  }

  const handleDeleteQuery = async () => {
    if (!queryToDelete) return

    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600))

    setSavedQueries(queries => queries.filter(q => q.id !== queryToDelete))
    setIsLoading(false)
    setQueryToDelete(null)
  }

  const handleExportResults = () => {
    if (!results) return

    // Create CSV content
    const csv = [
      results.columns.join(","),
      ...results.data.map((row: any) =>
        results.columns.map((col: string) => row[col]).join(",")
      ),
    ].join("\n")

    // Create download link
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "query-results.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SQL Editor</h1>
          <p className="text-sm text-muted-foreground">
            Write and execute SQL queries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsSaveDialogOpen(true)} disabled={!query.trim()}>
            <IconDeviceFloppy className="mr-2 h-4 w-4" />
            Save Query
          </Button>
          <Button variant="outline" onClick={() => setIsHistoryDialogOpen(true)}>
            <IconClock className="mr-2 h-4 w-4" />
            History
            {savedQueries.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {savedQueries.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Query Editor */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconCode className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Query Editor</span>
            </div>
            <Button onClick={handleRun} disabled={!query.trim() || isRunning}>
              {isRunning ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <IconPlayerPlay className="mr-2 h-4 w-4" />
                  Run Query
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="font-mono text-sm min-h-[200px]"
            placeholder="SELECT * FROM..."
            disabled={isRunning}
          />
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconTable className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Query Results</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{results.rows} rows</span>
                  <Badge variant="secondary" className="text-xs">
                    {results.executionTime}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportResults}>
                  <IconDownload className="mr-2 h-3.5 w-3.5" />
                  Export CSV
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setResults(null)}>
                  <IconX className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
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
                  {results.data.map((row: any, idx: number) => (
                    <tr key={idx} className="border-t">
                      {results.columns.map((col: string) => (
                        <td key={col} className="px-4 py-2">
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Query Dialog */}
      <Dialog
        open={isSaveDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsSaveDialogOpen(false)
            setQueryName("")
          }
        }}
        modal
      >
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Save Query</DialogTitle>
            <DialogDescription>
              Give your query a name to save it for later use
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="query-name">Query Name</Label>
              <Input
                id="query-name"
                placeholder="e.g., Top Customers Report"
                value={queryName}
                onChange={(e) => setQueryName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Query Preview</Label>
              <Textarea
                value={query}
                readOnly
                className="font-mono text-xs min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSaveDialogOpen(false)
                setQueryName("")
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveQuery} disabled={!queryName.trim() || isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <IconDeviceFloppy className="mr-2 h-4 w-4" />
                  Save Query
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Query History Dialog */}
      <Dialog
        open={isHistoryDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsHistoryDialogOpen(false)
          }
        }}
        modal
      >
        <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Query History</DialogTitle>
            <DialogDescription>
              Load saved queries or delete them
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {savedQueries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <IconFileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No saved queries yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedQueries.map((savedQuery) => (
                  <Card key={savedQuery.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <IconFileText className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold text-sm">{savedQuery.name}</h3>
                          </div>
                          <pre className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded overflow-x-auto mb-2">
                            {savedQuery.query.substring(0, 150)}
                            {savedQuery.query.length > 150 ? "..." : ""}
                          </pre>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Executed: {savedQuery.executedAt}</span>
                            <Badge variant="secondary" className="text-xs">
                              {savedQuery.executionTime}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleLoadQuery(savedQuery)}
                          >
                            <IconCode className="h-3.5 w-3.5 mr-1" />
                            Load
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setQueryToDelete(savedQuery.id)}
                            disabled={isLoading}
                          >
                            <IconTrash className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsHistoryDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Query Confirmation Dialog */}
      <AlertDialog open={!!queryToDelete} onOpenChange={(open) => !open && setQueryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Query?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this saved query. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuery} disabled={isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Query"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
