"use client"

import { useState } from "react"
import {
  IconSearch,
  IconDotsVertical,
  IconRefresh,
  IconClock,
  IconTrash,
  IconCopy,
  IconPlayerPlay,
  IconCode,
  IconLoader2,
  IconCheck,
} from "@tabler/icons-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

interface QueryHistory {
  id: string
  query: string
  executedAt: string
  executedBy: string
  executionTime: string
  rows: string
  status: "success" | "failed"
}

const initialHistory: QueryHistory[] = [
  {
    id: "1",
    query: "SELECT customer_id, SUM(order_total) FROM fact_sales GROUP BY customer_id LIMIT 100",
    executedAt: "2 minutes ago",
    executedBy: "Jane Smith",
    executionTime: "245ms",
    rows: "100",
    status: "success",
  },
  {
    id: "2",
    query: "SELECT * FROM dim_products WHERE category = 'Electronics'",
    executedAt: "15 minutes ago",
    executedBy: "John Doe",
    executionTime: "128ms",
    rows: "1,245",
    status: "success",
  },
  {
    id: "3",
    query: "UPDATE fact_orders SET status = 'shipped' WHERE order_id = 12345",
    executedAt: "1 hour ago",
    executedBy: "Sarah Wilson",
    executionTime: "892ms",
    rows: "1",
    status: "success",
  },
  {
    id: "4",
    query: "SELECT * FROM non_existent_table",
    executedAt: "2 hours ago",
    executedBy: "Mike Johnson",
    executionTime: "45ms",
    rows: "-",
    status: "failed",
  },
  {
    id: "5",
    query: "SELECT date, SUM(revenue) FROM agg_daily_revenue GROUP BY date ORDER BY date DESC",
    executedAt: "3 hours ago",
    executedBy: "Tom Brown",
    executionTime: "156ms",
    rows: "365",
    status: "success",
  },
]

export default function HistoryPage() {
  const [history, setHistory] = useState<QueryHistory[]>(initialHistory)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [queryToDelete, setQueryToDelete] = useState<string | null>(null)
  const [detailsQuery, setDetailsQuery] = useState<QueryHistory | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.executedBy.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: history.length,
    success: history.filter(h => h.status === "success").length,
    failed: history.filter(h => h.status === "failed").length,
    avgTime: "293ms",
  }

  const handleRerunQuery = async (item: QueryHistory) => {
    setIsLoading(true)
    // Simulate query re-execution
    await new Promise(resolve => setTimeout(resolve, 1200))

    const rerunQuery: QueryHistory = {
      id: Date.now().toString(),
      query: item.query,
      executedAt: "Just now",
      executedBy: item.executedBy,
      executionTime: Math.floor(Math.random() * 500 + 100) + "ms",
      rows: item.status === "success" ? item.rows : "0",
      status: "success",
    }

    setHistory([rerunQuery, ...history])
    setIsLoading(false)
  }

  const handleCopyQuery = async (item: QueryHistory) => {
    try {
      await navigator.clipboard.writeText(item.query)
      setCopiedId(item.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleDeleteQuery = async () => {
    if (!queryToDelete) return

    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600))

    setHistory(history => history.filter(q => q.id !== queryToDelete))
    setIsLoading(false)
    setQueryToDelete(null)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Query History</h1>
          <p className="text-sm text-muted-foreground">
            View and manage past query executions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Total Queries</div>
            <div className="text-xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Successful</div>
            <div className="text-xl font-bold text-green-500">{stats.success}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Failed</div>
            <div className="text-xl font-bold text-red-500">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Avg Time</div>
            <div className="text-xl font-bold">{stats.avgTime}</div>
          </CardContent>
        </Card>
      </div>

      {/* Query History List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search queries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <IconRefresh className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-2">
            {filteredHistory.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <IconCode className="h-4 w-4 text-muted-foreground" />
                        <Badge variant={item.status === "success" ? "outline" : "destructive"} className="text-xs">
                          {item.status}
                        </Badge>
                      </div>
                      <div className="font-mono text-xs bg-muted/50 p-2 rounded mb-2 overflow-x-auto">
                        {item.query}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Executed</p>
                          <p className="font-medium">{item.executedAt}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">By</p>
                          <p className="font-medium">{item.executedBy}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Time</p>
                          <p className="font-medium">{item.executionTime}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Rows</p>
                          <p className="font-medium">{item.rows}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <p className="font-medium">{item.status}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isLoading}>
                            {isLoading ? (
                              <IconLoader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <IconDotsVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRerunQuery(item)}>
                            <IconPlayerPlay className="mr-2 h-4 w-4" />
                            Re-run Query
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyQuery(item)}>
                            {copiedId === item.id ? (
                              <>
                                <IconCheck className="mr-2 h-4 w-4 text-green-500" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <IconCopy className="mr-2 h-4 w-4" />
                                Copy Query
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDetailsQuery(item)}>
                            <IconClock className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setQueryToDelete(item.id)}
                          >
                            <IconTrash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Query Details Dialog */}
      <Dialog
        open={!!detailsQuery}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsQuery(null)
          }
        }}
        modal
      >
        <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Query Details</DialogTitle>
            <DialogDescription>
              Full details and execution information
            </DialogDescription>
          </DialogHeader>
          {detailsQuery && (
            <div className="py-4 space-y-4">
              <div className="grid gap-2">
                <Label>Query</Label>
                <div className="font-mono text-sm bg-muted/50 p-3 rounded overflow-x-auto">
                  {detailsQuery.query}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Executed At</Label>
                  <div className="text-sm">{detailsQuery.executedAt}</div>
                </div>
                <div className="grid gap-2">
                  <Label>Executed By</Label>
                  <div className="text-sm">{detailsQuery.executedBy}</div>
                </div>
                <div className="grid gap-2">
                  <Label>Execution Time</Label>
                  <div className="text-sm">{detailsQuery.executionTime}</div>
                </div>
                <div className="grid gap-2">
                  <Label>Rows Returned</Label>
                  <div className="text-sm">{detailsQuery.rows}</div>
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Badge variant={detailsQuery.status === "success" ? "outline" : "destructive"} className="text-xs w-fit">
                    {detailsQuery.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailsQuery(null)}
            >
              Close
            </Button>
            {detailsQuery && (
              <Button onClick={() => handleRerunQuery(detailsQuery)}>
                <IconPlayerPlay className="mr-2 h-4 w-4" />
                Re-run Query
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Query Confirmation Dialog */}
      <AlertDialog open={!!queryToDelete} onOpenChange={(open) => !open && setQueryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Query History?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this query from the history. This action cannot be undone.
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
