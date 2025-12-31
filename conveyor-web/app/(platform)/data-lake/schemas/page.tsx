"use client"

import { useState, useEffect } from "react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { dataLakeApi, Schema } from "@/lib/api/datalake"
import { toast } from "sonner"
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconRefresh,
  IconSchema,
  IconTrash,
  IconEye,
  IconCopy,
  IconTable,
  IconLoader2,
} from "@tabler/icons-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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

export default function SchemasPage() {
  const { currentWorkspace } = useWorkspace()
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [schemaToDelete, setSchemaToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "", version: "v1.0" })

  // Load schemas from API
  useEffect(() => {
    loadSchemas()
  }, [currentWorkspace])

  async function loadSchemas() {
    if (!currentWorkspace) return

    try {
      setIsFetching(true)
      const data = await dataLakeApi.getSchemas()
      setSchemas(data)
    } catch (error: any) {
      console.error('Failed to load schemas:', error)
      toast.error(error.message || 'Failed to load schemas')
    } finally {
      setIsFetching(false)
    }
  }

  const filteredSchemas = schemas.filter((schema) =>
    schema.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (schema.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: schemas.length,
    tables: schemas.reduce((acc, s) => acc + s.tables, 0),
    columns: schemas.reduce((acc, s) => acc + s.columns, 0),
    avgTables: schemas.length > 0 ? Math.round(schemas.reduce((acc, s) => acc + s.tables, 0) / schemas.length) : 0,
  }

  const handleCreateSchema = async () => {
    if (!formData.name.trim()) return

    setIsLoading(true)
    try {
      await dataLakeApi.createSchema({
        name: formData.name,
        description: formData.description,
        version: formData.version,
      })
      toast.success('Schema created successfully')
      await loadSchemas()
      setIsCreateDialogOpen(false)
      setFormData({ name: "", description: "", version: "v1.0" })
    } catch (error: any) {
      console.error('Failed to create schema:', error)
      toast.error(error.message || 'Failed to create schema')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDuplicate = async (schema: Schema) => {
    setIsLoading(true)
    try {
      await dataLakeApi.duplicateSchema(schema.id, {
        name: `${schema.name}_copy`,
      })
      toast.success('Schema duplicated successfully')
      await loadSchemas()
    } catch (error: any) {
      console.error('Failed to duplicate schema:', error)
      toast.error(error.message || 'Failed to duplicate schema')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!schemaToDelete) return

    setIsLoading(true)
    try {
      await dataLakeApi.deleteSchema(schemaToDelete)
      toast.success('Schema deleted successfully')
      await loadSchemas()
      setSchemaToDelete(null)
    } catch (error: any) {
      console.error('Failed to delete schema:', error)
      toast.error(error.message || 'Failed to delete schema')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schemas</h1>
          <p className="text-sm text-muted-foreground">
            Manage data lake schemas and structures
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Create Schema
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Total Schemas</div>
            <div className="text-xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Tables</div>
            <div className="text-xl font-bold text-blue-500">{stats.tables}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Columns</div>
            <div className="text-xl font-bold text-green-500">{stats.columns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Avg Tables</div>
            <div className="text-xl font-bold">{stats.avgTables}</div>
          </CardContent>
        </Card>
      </div>

      {/* Schemas List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search schemas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={loadSchemas} disabled={isFetching}>
                <IconRefresh className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {isFetching ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSchemas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconSchema className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No schemas found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSchemas.map((schema) => (
              <Card key={schema.id}>
                <CardContent className="p-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                        <IconSchema className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{schema.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {schema.version}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {schema.description}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <p className="text-muted-foreground">Tables</p>
                            <p className="font-medium">{schema.tables}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Columns</p>
                            <p className="font-medium">{schema.columns}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Version</p>
                            <p className="font-medium">{schema.version}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Modified</p>
                            <p className="font-medium">{new Date(schema.updated_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isLoading}>
                            {isLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconDotsVertical className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><IconEye className="mr-2 h-4 w-4" />View Schema</DropdownMenuItem>
                          <DropdownMenuItem><IconTable className="mr-2 h-4 w-4" />View Tables</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(schema)}><IconCopy className="mr-2 h-4 w-4" />Duplicate</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setSchemaToDelete(schema.id)}><IconTrash className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Create Schema Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { if (!open) { setIsCreateDialogOpen(false); setFormData({ name: "", description: "", version: "v1.0" }) }}} modal>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Create Schema</DialogTitle>
            <DialogDescription>Create a new schema in the data lake</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="schema-name">Schema Name</Label>
              <Input id="schema-name" placeholder="e.g., customer_data" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="version">Version</Label>
              <Input id="version" placeholder="e.g., v1.0" value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe the schema..." rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); setFormData({ name: "", description: "", version: "v1.0" }) }} disabled={isLoading}>Cancel</Button>
            <Button onClick={handleCreateSchema} disabled={!formData.name.trim() || isLoading}>
              {isLoading ? <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Schema"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!schemaToDelete} onOpenChange={(open) => !open && setSchemaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schema?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this schema and all its tables. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
              {isLoading ? <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : "Delete Schema"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
