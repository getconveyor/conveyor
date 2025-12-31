"use client"

import { useState } from "react"
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

type PipelineStatus = "running" | "paused" | "failed" | "success" | "idle"

interface Pipeline {
  id: string
  name: string
  description: string
  status: PipelineStatus
  source: string
  destination: string
  lastRun: string
  nextRun: string
  runCount: number
  successRate: number
  recordsProcessed: string
  schedule: string
}

const initialPipelines: Pipeline[] = [
  {
    id: "1",
    name: "Customer Data Sync",
    description: "Sync customer data to Warehouse",
    status: "running",
    source: "Production MySQL",
    destination: "Warehouse",
    lastRun: "2 minutes ago",
    nextRun: "in 58 minutes",
    runCount: 1247,
    successRate: 99.8,
    recordsProcessed: "2.4M",
    schedule: "Hourly",
  },
  {
    id: "2",
    name: "Order Processing Pipeline",
    description: "Process order data from eCommerce",
    status: "success",
    source: "Stripe Payments",
    destination: "Lakehouse",
    lastRun: "15 minutes ago",
    nextRun: "in 45 minutes",
    runCount: 892,
    successRate: 98.5,
    recordsProcessed: "1.8M",
    schedule: "Hourly",
  },
  {
    id: "3",
    name: "Analytics Events Stream",
    description: "Stream user analytics events to lakehouse",
    status: "running",
    source: "Google Analytics Web",
    destination: "Lakehouse",
    lastRun: "1 minute ago",
    nextRun: "Continuous",
    runCount: 5623,
    successRate: 99.9,
    recordsProcessed: "12.5M",
    schedule: "Real-time",
  },
  {
    id: "4",
    name: "Inventory Sync",
    description: "Daily inventory synchronization",
    status: "failed",
    source: "Staging MySQL",
    destination: "Warehouse",
    lastRun: "3 hours ago",
    nextRun: "in 21 hours",
    runCount: 156,
    successRate: 94.2,
    recordsProcessed: "856K",
    schedule: "Daily",
  },
  {
    id: "5",
    name: "Cloud Storage Sync",
    description: "Import files from cloud storage",
    status: "paused",
    source: "AWS S3 Data Lake",
    destination: "Lakehouse",
    lastRun: "2 days ago",
    nextRun: "Paused",
    runCount: 423,
    successRate: 97.8,
    recordsProcessed: "645K",
    schedule: "Daily",
  },
  {
    id: "6",
    name: "PostgreSQL Analytics Sync",
    description: "Sync analytics database to warehouse",
    status: "success",
    source: "PostgreSQL Analytics",
    destination: "Warehouse",
    lastRun: "30 minutes ago",
    nextRun: "in 30 minutes",
    runCount: 734,
    successRate: 99.1,
    recordsProcessed: "425K",
    schedule: "Hourly",
  },
]

const statusConfig: Record<PipelineStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  running: { label: "Running", variant: "default", color: "text-blue-500" },
  success: { label: "Success", variant: "outline", color: "text-green-500" },
  failed: { label: "Failed", variant: "destructive", color: "text-red-500" },
  paused: { label: "Paused", variant: "secondary", color: "text-gray-500" },
  idle: { label: "Idle", variant: "outline", color: "text-gray-500" },
}

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>(initialPipelines)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null)
  const [pipelineToDelete, setPipelineToDelete] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    source: "",
    destination: "",
    scheduleType: "",
    scheduleValue: "",
  })

  const filteredPipelines = pipelines.filter((pipeline) => {
    const matchesSearch = pipeline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pipeline.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || pipeline.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: pipelines.length,
    running: pipelines.filter(p => p.status === "running").length,
    failed: pipelines.filter(p => p.status === "failed").length,
    paused: pipelines.filter(p => p.status === "paused").length,
  }

  const handleCreateOrUpdatePipeline = async () => {
    if (!formData.name.trim() || !formData.source || !formData.destination) return

    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (editingPipeline) {
      // Update existing pipeline
      setPipelines(pipelines =>
        pipelines.map(p =>
          p.id === editingPipeline.id
            ? {
                ...p,
                name: formData.name,
                description: formData.description,
                source: formData.source,
                destination: formData.destination,
                schedule: formData.scheduleValue || formData.scheduleType,
                lastRun: "Just now",
              }
            : p
        )
      )
    } else {
      // Create new pipeline
      const newPipeline: Pipeline = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        status: "idle",
        source: formData.source,
        destination: formData.destination,
        lastRun: "Never",
        nextRun: "Not scheduled",
        runCount: 0,
        successRate: 0,
        recordsProcessed: "0",
        schedule: formData.scheduleValue || formData.scheduleType,
      }
      setPipelines([...pipelines, newPipeline])
    }

    setIsLoading(false)
    setIsCreateDialogOpen(false)
    setFormData({ name: "", description: "", source: "", destination: "", scheduleType: "", scheduleValue: "" })
    setEditingPipeline(null)
  }

  const handleEditPipeline = (pipeline: Pipeline) => {
    setEditingPipeline(pipeline)
    setFormData({
      name: pipeline.name,
      description: pipeline.description,
      source: pipeline.source,
      destination: pipeline.destination,
      scheduleType: pipeline.schedule,
      scheduleValue: pipeline.schedule,
    })
    setIsCreateDialogOpen(true)
  }

  const handleDeletePipeline = async () => {
    if (!pipelineToDelete) return

    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))

    setPipelines(pipelines => pipelines.filter(p => p.id !== pipelineToDelete))
    setIsLoading(false)
    setPipelineToDelete(null)
  }

  const handleTogglePlayPause = async (id: string) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600))

    setPipelines(pipelines =>
      pipelines.map(p =>
        p.id === id
          ? {
              ...p,
              status: p.status === "paused" ? "running" : p.status === "running" ? "paused" : "running",
              lastRun: p.status === "paused" ? "Just now" : p.lastRun,
              nextRun: p.status === "paused" ? "Continuous" : "Paused",
            }
          : p
      )
    )
    setIsLoading(false)
  }

  const handleDuplicatePipeline = async (pipeline: Pipeline) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))

    const duplicatedPipeline: Pipeline = {
      ...pipeline,
      id: Date.now().toString(),
      name: `${pipeline.name} (Copy)`,
      status: "idle",
      lastRun: "Never",
      nextRun: "Not scheduled",
      runCount: 0,
    }
    setPipelines([...pipelines, duplicatedPipeline])
    setIsLoading(false)
  }

  const resetForm = () => {
    setFormData({ name: "", description: "", source: "", destination: "", scheduleType: "", scheduleValue: "" })
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
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
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
                          <p className="font-medium">{pipeline.source}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Destination</p>
                          <p className="font-medium">{pipeline.destination}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Schedule</p>
                          <p className="font-medium">{pipeline.schedule}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Success Rate</p>
                          <p className="font-medium">{pipeline.successRate}%</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <IconClock className="h-3 w-3" />
                          Last: {pipeline.lastRun}
                        </span>
                        <span className="flex items-center gap-1">
                          <IconRefresh className="h-3 w-3" />
                          Next: {pipeline.nextRun}
                        </span>
                        <span>
                          {pipeline.recordsProcessed} records
                        </span>
                        <span>
                          {pipeline.runCount} runs
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
                    <SelectItem value="Production MySQL">Production MySQL</SelectItem>
                    <SelectItem value="Staging MySQL">Staging MySQL</SelectItem>
                    <SelectItem value="PostgreSQL Analytics">PostgreSQL Analytics</SelectItem>
                    <SelectItem value="AWS S3 Data Lake">AWS S3 Data Lake</SelectItem>
                    <SelectItem value="Google Analytics Web">Google Analytics Web</SelectItem>
                    <SelectItem value="Stripe Payments">Stripe Payments</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Configure sources in the Data Sources page
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="destination">Destination</Label>
                <Select value={formData.destination} onValueChange={(value) => setFormData({ ...formData, destination: value })}>
                  <SelectTrigger id="destination">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lakehouse">Lakehouse</SelectItem>
                    <SelectItem value="Warehouse">Warehouse</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Data syncs to your platform storage
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="schedule">Schedule Type</Label>
                <Select value={formData.scheduleType} onValueChange={(value) => setFormData({ ...formData, scheduleType: value })}>
                  <SelectTrigger id="schedule">
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hourly">Hourly</SelectItem>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Real-time">Real-time</SelectItem>
                    <SelectItem value="Manual">Manual Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="schedule-value">Schedule Value (Optional)</Label>
                <Input
                  id="schedule-value"
                  placeholder="e.g., 0 * * * * or 1h"
                  value={formData.scheduleValue}
                  onChange={(e) => setFormData({ ...formData, scheduleValue: e.target.value })}
                />
              </div>
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
