"use client"

import { useState, useEffect } from "react"
import {
  IconPlus,
  IconSearch,
  IconPlayerPlay,
  IconPlayerPause,
  IconDotsVertical,
  IconCheck,
  IconX,
  IconClock,
  IconRefresh,
  IconSettings,
  IconTrash,
  IconCopy,
  IconEye,
  IconLoader2,
} from "@tabler/icons-react"
import Link from "next/link"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { integrationApi, Pipeline, CreatePipelineData, Source } from "@/lib/api/integration"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

type PipelineStatus = "active" | "paused" | "error" | "running" | "idle"

const statusConfig: Record<PipelineStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  active: { label: "Active", variant: "default", color: "text-green-500" },
  running: { label: "Running", variant: "default", color: "text-blue-500" },
  error: { label: "Error", variant: "destructive", color: "text-red-500" },
  paused: { label: "Paused", variant: "secondary", color: "text-gray-500" },
  idle: { label: "Idle", variant: "outline", color: "text-gray-500" },
}

export default function PipelinesPage() {
  const { currentWorkspace } = useWorkspace()
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null)
  const [pipelineToDelete, setPipelineToDelete] = useState<string | null>(null)
  const [isFetching, setIsFetching] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    source: "",
    destination: "",
    schedule: "",
  })

  const filteredPipelines = pipelines.filter((pipeline) => {
    const matchesSearch = pipeline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pipeline.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesStatus = statusFilter === "all" || pipeline.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: pipelines.length,
    running: pipelines.filter(p => p.status === "running").length,
    failed: pipelines.filter(p => p.status === "error").length,
    paused: pipelines.filter(p => p.status === "paused").length,
  }

  // Load pipelines from API
  useEffect(() => {
    if (currentWorkspace) {
      loadPipelines()
      loadSources()
    }
  }, [currentWorkspace])

  async function loadPipelines() {
    if (!currentWorkspace) return

    try {
      setIsFetching(true)
      const data = await integrationApi.getPipelines()
      setPipelines(data)
    } catch (error: any) {
      console.error('Failed to load pipelines:', error)
      toast.error(error.message || 'Failed to load pipelines')
    } finally {
      setIsFetching(false)
    }
  }

  async function loadSources() {
    if (!currentWorkspace) return

    try {
      const data = await integrationApi.getSources()
      setSources(data)
    } catch (error: any) {
      console.error('Failed to load sources:', error)
      toast.error(error.message || 'Failed to load sources')
    }
  }

  const handleCreateOrUpdatePipeline = async () => {
    if (!formData.name.trim() || !formData.source || !formData.destination) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      if (editingPipeline) {
        // Update existing pipeline
        await integrationApi.updatePipeline(editingPipeline.id, {
          name: formData.name,
          description: formData.description,
          schedule: formData.schedule || undefined,
        })
        toast.success('Pipeline updated successfully')
      } else {
        // Create new pipeline
        const createData: CreatePipelineData = {
          name: formData.name,
          description: formData.description,
          source: formData.source,
          destination: formData.destination,
          schedule: formData.schedule || undefined,
        }
        await integrationApi.createPipeline(createData)
        toast.success('Pipeline created successfully')
      }

      // Reload pipelines after successful operation
      await loadPipelines()

      // Close dialog and reset form
      setIsCreateDialogOpen(false)
      resetForm()
    } catch (error: any) {
      console.error('Failed to save pipeline:', error)
      toast.error(error.message || 'Failed to save pipeline')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditPipeline = (pipeline: Pipeline) => {
    setEditingPipeline(pipeline)
    setFormData({
      name: pipeline.name,
      description: pipeline.description || "",
      source: "", // Source IDs not directly available from pipeline
      destination: "", // Will need to be selected again
      schedule: pipeline.schedule || "",
    })
    setIsCreateDialogOpen(true)
  }

  const handleDeletePipeline = async () => {
    if (!pipelineToDelete) return

    setIsLoading(true)
    try {
      await integrationApi.deletePipeline(pipelineToDelete)
      toast.success('Pipeline deleted successfully')

      // Reload pipelines after deletion
      await loadPipelines()

      setPipelineToDelete(null)
    } catch (error: any) {
      console.error('Failed to delete pipeline:', error)
      toast.error(error.message || 'Failed to delete pipeline')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePlayPause = async (id: string) => {
    const pipeline = pipelines.find(p => p.id === id)
    if (!pipeline) return

    // Determine new status
    const newStatus: PipelineStatus =
      pipeline.status === "paused" ? "active" :
      pipeline.status === "running" || pipeline.status === "active" ? "paused" :
      "active"

    setIsLoading(true)
    try {
      await integrationApi.updatePipeline(id, { status: newStatus })
      toast.success(`Pipeline ${newStatus === "paused" ? "paused" : "resumed"} successfully`)

      // Reload pipelines after status change
      await loadPipelines()
    } catch (error: any) {
      console.error('Failed to update pipeline status:', error)
      toast.error(error.message || 'Failed to update pipeline status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDuplicatePipeline = async (pipeline: Pipeline) => {
    setIsLoading(true)
    try {
      // Note: We don't have source and destination IDs
      // from the pipeline object, so duplication may require backend support
      // or fetching the full pipeline details first
      toast.error('Pipeline duplication requires source IDs - feature coming soon')
      // TODO: Implement when pipeline object includes source IDs
      // const createData: CreatePipelineData = {
      //   name: `${pipeline.name} (Copy)`,
      //   description: pipeline.description,
      //   source: pipeline.source,
      //   destination: pipeline.destination,
      //   schedule: pipeline.schedule,
      // }
      // await integrationApi.createPipeline(createData)
      // toast.success('Pipeline duplicated successfully')
      // await loadPipelines()
    } catch (error: any) {
      console.error('Failed to duplicate pipeline:', error)
      toast.error(error.message || 'Failed to duplicate pipeline')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: "", description: "", source: "", destination: "", schedule: "" })
    setEditingPipeline(null)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipelines</h1>
          <p className="text-sm text-muted-foreground">
            Manage your data integration pipelines
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Create Pipeline
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Total</div>
            <div className="text-xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Running</div>
            <div className="text-xl font-bold text-blue-500">{stats.running}</div>
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
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Paused</div>
            <div className="text-xl font-bold text-gray-500">{stats.paused}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search pipelines..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={loadPipelines} disabled={isFetching}>
                <IconRefresh className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {isFetching && pipelines.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <IconLoader2 className="h-6 w-6 animate-spin mr-2" />
              Loading pipelines...
            </div>
          ) : filteredPipelines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">No pipelines found</p>
              <p className="text-xs mt-1">Create your first pipeline to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPipelines.map((pipeline) => (
              <Card key={pipeline.id}>
                <CardContent className="p-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-sm">{pipeline.name}</h3>
                        <Badge variant={statusConfig[pipeline.status].variant} className="text-xs">
                          {statusConfig[pipeline.status].label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {pipeline.description}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-2">
                        <div>
                          <p className="text-muted-foreground">Source</p>
                          <p className="font-medium">{pipeline.source_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Destination</p>
                          <p className="font-medium">{pipeline.destination_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Schedule</p>
                          <p className="font-medium">{pipeline.schedule || 'Manual'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Success Rate</p>
                          <p className="font-medium">{pipeline.success_rate}%</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <IconClock className="h-3 w-3" />
                          Last: {pipeline.last_run || 'Never'}
                        </span>
                        <span className="flex items-center gap-1">
                          <IconRefresh className="h-3 w-3" />
                          Next: {pipeline.next_run || 'Not scheduled'}
                        </span>
                        <span>
                          {pipeline.records_processed || 0} records
                        </span>
                        <span>
                          {pipeline.run_count} runs
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {pipeline.status === "paused" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleTogglePlayPause(pipeline.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <IconPlayerPlay className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      ) : pipeline.status === "running" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleTogglePlayPause(pipeline.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <IconPlayerPause className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleTogglePlayPause(pipeline.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <IconPlayerPlay className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isLoading}>
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <IconEye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditPipeline(pipeline)}>
                            <IconSettings className="mr-2 h-4 w-4" />
                            Edit Pipeline
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicatePipeline(pipeline)}>
                            <IconCopy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setPipelineToDelete(pipeline.id)}
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
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Pipeline Dialog */}
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
            <DialogTitle>{editingPipeline ? "Edit Pipeline" : "Create New Pipeline"}</DialogTitle>
            <DialogDescription>
              {editingPipeline
                ? "Update the pipeline configuration."
                : "Create a pipeline to sync data from a source to your Lakehouse or Warehouse."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="pipeline-name">Pipeline Name</Label>
              <Input
                id="pipeline-name"
                placeholder="e.g., Customer Data Sync"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pipeline-description">Description</Label>
              <Textarea
                id="pipeline-description"
                placeholder="Describe what this pipeline does..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="source">Source</Label>
                <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                  <SelectTrigger id="source">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.length === 0 ? (
                      <SelectItem value="none" disabled>No sources available</SelectItem>
                    ) : (
                      sources.map((source) => (
                        <SelectItem key={source.id} value={source.id}>
                          {source.name} ({source.type})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Configure sources in the Sources page
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="destination">Destination</Label>
                <Select value={formData.destination} onValueChange={(value) => setFormData({ ...formData, destination: value })}>
                  <SelectTrigger id="destination">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.length === 0 ? (
                      <SelectItem value="none" disabled>No sources available</SelectItem>
                    ) : (
                      sources.map((source) => (
                        <SelectItem key={source.id} value={source.id}>
                          {source.name} ({source.type})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select where the data will be synced to
                </p>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="schedule">Schedule (Optional)</Label>
              <Input
                id="schedule"
                placeholder="e.g., 0 * * * * (cron expression) or @hourly"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for manual-only execution
              </p>
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
            <Button
              onClick={handleCreateOrUpdatePipeline}
              disabled={!formData.name.trim() || !formData.source || !formData.destination || isLoading}
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingPipeline ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{editingPipeline ? "Update Pipeline" : "Create Pipeline"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!pipelineToDelete} onOpenChange={(open) => !open && setPipelineToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this pipeline. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePipeline} disabled={isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
