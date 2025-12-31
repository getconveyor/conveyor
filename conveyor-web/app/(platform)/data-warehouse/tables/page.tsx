"use client"

import { useState } from "react"
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconRefresh,
  IconTable,
  IconTrash,
  IconEye,
  IconCopy,
  IconDatabase,
  IconLoader2,
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
import { Textarea } from "@/components/ui/textarea"

interface WarehouseTable {
  id: string
  name: string
  schema: string
  rows: string
  columns: number
  size: string
  lastUpdated: string
  type: string
}

const initialTables: WarehouseTable[] = [
  {
    id: "1",
    name: "fact_sales",
    schema: "analytics",
    rows: "24.5M",
    columns: 18,
    size: "3.2 GB",
    lastUpdated: "2 hours ago",
    type: "Fact",
  },
  {
    id: "2",
    name: "dim_customers",
    schema: "analytics",
    rows: "1.2M",
    columns: 25,
    size: "856 MB",
    lastUpdated: "1 day ago",
    type: "Dimension",
  },
  {
    id: "3",
    name: "dim_products",
    schema: "analytics",
    rows: "450K",
    columns: 32,
    size: "245 MB",
    lastUpdated: "3 days ago",
    type: "Dimension",
  },
  {
    id: "4",
    name: "fact_orders",
    schema: "analytics",
    rows: "18.8M",
    columns: 22,
    size: "2.8 GB",
    lastUpdated: "5 hours ago",
    type: "Fact",
  },
  {
    id: "5",
    name: "agg_daily_revenue",
    schema: "reporting",
    rows: "12K",
    columns: 15,
    size: "8.2 MB",
    lastUpdated: "1 hour ago",
    type: "Aggregate",
  },
]

export default function TablesPage() {
  const [tables, setTables] = useState<WarehouseTable[]>(initialTables)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [schemaFilter, setSchemaFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [tableToDelete, setTableToDelete] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    schema: "analytics",
    type: "Fact",
    description: "",
  })

  const filteredTables = tables.filter((table) => {
    const matchesSearch = table.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || table.type.toLowerCase() === typeFilter.toLowerCase()
    const matchesSchema = schemaFilter === "all" || table.schema === schemaFilter
    return matchesSearch && matchesType && matchesSchema
  })

  const stats = {
    total: tables.length,
    fact: tables.filter(t => t.type === "Fact").length,
    dimension: tables.filter(t => t.type === "Dimension").length,
    totalSize: "7.1 GB",
  }

  const handleCreateTable = async () => {
    if (!formData.name.trim()) return

    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200))

    const newTable: WarehouseTable = {
      id: Date.now().toString(),
      name: formData.name,
      schema: formData.schema,
      rows: "0",
      columns: 0,
      size: "0 KB",
      lastUpdated: "Just now",
      type: formData.type,
    }

    setTables([...tables, newTable])
    setIsLoading(false)
    setIsCreateDialogOpen(false)
    resetForm()
  }

  const handleDeleteTable = async () => {
    if (!tableToDelete) return

    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    setTables(tables => tables.filter(t => t.id !== tableToDelete))
    setIsLoading(false)
    setTableToDelete(null)
  }

  const handleDuplicateTable = async (table: WarehouseTable) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    const duplicatedTable: WarehouseTable = {
      ...table,
      id: Date.now().toString(),
      name: `${table.name}_copy`,
      rows: "0",
      size: "0 KB",
      lastUpdated: "Just now",
    }
    setTables([...tables, duplicatedTable])
    setIsLoading(false)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      schema: "analytics",
      type: "Fact",
      description: "",
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tables</h1>
          <p className="text-sm text-muted-foreground">
            Manage data warehouse tables and schemas
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Create Table
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Total Tables</div>
            <div className="text-xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Fact Tables</div>
            <div className="text-xl font-bold text-blue-500">{stats.fact}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Dimensions</div>
            <div className="text-xl font-bold text-green-500">{stats.dimension}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Total Size</div>
            <div className="text-xl font-bold">{stats.totalSize}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tables List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tables..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={schemaFilter} onValueChange={setSchemaFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Schema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schemas</SelectItem>
                  <SelectItem value="analytics">analytics</SelectItem>
                  <SelectItem value="reporting">reporting</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="fact">Fact</SelectItem>
                  <SelectItem value="dimension">Dimension</SelectItem>
                  <SelectItem value="aggregate">Aggregate</SelectItem>
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
            {filteredTables.map((table) => (
              <Card key={table.id}>
                <CardContent className="p-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                        <IconTable className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{table.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {table.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {table.schema}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                          <div>
                            <p className="text-muted-foreground">Rows</p>
                            <p className="font-medium">{table.rows}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Columns</p>
                            <p className="font-medium">{table.columns}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Size</p>
                            <p className="font-medium">{table.size}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Type</p>
                            <p className="font-medium">{table.type}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Updated</p>
                            <p className="font-medium">{table.lastUpdated}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isLoading}>
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <IconEye className="mr-2 h-4 w-4" />
                            View Schema
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <IconDatabase className="mr-2 h-4 w-4" />
                            Query Table
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateTable(table)}>
                            <IconCopy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setTableToDelete(table.id)}
                          >
                            <IconTrash className="mr-2 h-4 w-4" />
                            Drop Table
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

      {/* Create Table Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false)
            resetForm()
          }
        }}
        modal
      >
        <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Create Table</DialogTitle>
            <DialogDescription>
              Create a new table in the data warehouse
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="table-name">Table Name</Label>
              <Input
                id="table-name"
                placeholder="e.g., fact_transactions"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="schema">Schema</Label>
                <Select value={formData.schema} onValueChange={(value) => setFormData({ ...formData, schema: value })}>
                  <SelectTrigger id="schema">
                    <SelectValue placeholder="Select schema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="analytics">analytics</SelectItem>
                    <SelectItem value="reporting">reporting</SelectItem>
                    <SelectItem value="staging">staging</SelectItem>
                    <SelectItem value="raw">raw</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Table Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fact">Fact</SelectItem>
                    <SelectItem value="Dimension">Dimension</SelectItem>
                    <SelectItem value="Aggregate">Aggregate</SelectItem>
                    <SelectItem value="Bridge">Bridge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose of this table..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                resetForm()
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTable} disabled={!formData.name.trim() || isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Table"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!tableToDelete} onOpenChange={(open) => !open && setTableToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Drop Table?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this table and all its data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTable} disabled={isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Dropping...
                </>
              ) : (
                "Drop Table"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
