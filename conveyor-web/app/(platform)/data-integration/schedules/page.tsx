"use client"

import { useState, useEffect } from "react"
import {
  IconPlus,
  IconSearch,
  IconClock,
  IconPlayerPlay,
  IconPlayerPause,
  IconDotsVertical,
  IconSettings,
  IconTrash,
  IconCalendar,
  IconRefresh,
  IconLoader2,
} from "@tabler/icons-react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { integrationApi, Schedule, Pipeline } from "@/lib/api/integration"
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

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  enabled: { label: "Enabled", variant: "default" },
  disabled: { label: "Disabled", variant: "outline" },
}

export default function SchedulesPage() {
  const { currentWorkspace } = useWorkspace()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null)
  const [isFetching, setIsFetching] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    cron_expression: "",
    pipeline: "",
    timezone: "UTC",
  })

  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch = schedule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (schedule.pipeline_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesStatus = statusFilter === "all" || (statusFilter === "enabled" ? schedule.enabled : !schedule.enabled)
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: schedules.length,
    enabled: schedules.filter(s => s.enabled).length,
    disabled: schedules.filter(s => !s.enabled).length,
  }

  // Load schedules and pipelines from API
  useEffect(() => {
    if (currentWorkspace) {
      loadSchedules()
      loadPipelines()
    }
  }, [currentWorkspace])

  async function loadSchedules() {
    if (!currentWorkspace) return

    try {
      setIsFetching(true)
      const data = await integrationApi.getSchedules()
      setSchedules(data)
    } catch (error: any) {
      console.error('Failed to load schedules:', error)
      toast.error(error.message || 'Failed to load schedules')
    } finally {
      setIsFetching(false)
    }
  }

  async function loadPipelines() {
    if (!currentWorkspace) return

    try {
      const data = await integrationApi.getPipelines()
      setPipelines(data)
    } catch (error: any) {
      console.error('Failed to load pipelines:', error)
      toast.error(error.message || 'Failed to load pipelines')
    }
  }

  const handleCreateOrUpdateSchedule = async () => {
    if (!formData.name.trim() || !formData.cron_expression || !formData.pipeline) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      if (editingSchedule) {
        // Note: Backend doesn't support updating schedules yet
        toast.error('Schedule updates not yet supported - delete and recreate instead')
      } else {
        // Create new schedule
        await integrationApi.createSchedule({
          pipeline: formData.pipeline,
          cron_expression: formData.cron_expression,
          name: formData.name,
        })
        toast.success('Schedule created successfully')

        // Reload schedules after successful operation
        await loadSchedules()

        // Close dialog and reset form
        setIsCreateDialogOpen(false)
        resetForm()
      }
    } catch (error: any) {
      console.error('Failed to save schedule:', error)
      toast.error(error.message || 'Failed to save schedule')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setFormData({
      name: schedule.name,
      cron_expression: schedule.cron_expression,
      pipeline: schedule.pipeline || "",
      timezone: schedule.timezone || "UTC",
    })
    setIsCreateDialogOpen(true)
  }

  const handleDeleteSchedule = async () => {
    if (!scheduleToDelete) return

    setIsLoading(true)
    try {
      await integrationApi.deleteSchedule(scheduleToDelete)
      toast.success('Schedule deleted successfully')

      // Reload schedules after deletion
      await loadSchedules()

      setScheduleToDelete(null)
    } catch (error: any) {
      console.error('Failed to delete schedule:', error)
      toast.error(error.message || 'Failed to delete schedule')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleEnable = async (schedule: Schedule) => {
    setIsLoading(true)
    try {
      if (schedule.enabled) {
        // Disable schedule
        await integrationApi.disableSchedule(schedule.id)
        toast.success('Schedule disabled')
      } else {
        // Enable schedule
        await integrationApi.enableSchedule(schedule.id)
        toast.success('Schedule enabled')
      }

      // Reload schedules after toggle
      await loadSchedules()
    } catch (error: any) {
      console.error('Failed to toggle schedule:', error)
      toast.error(error.message || 'Failed to toggle schedule')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      cron_expression: "",
      pipeline: "",
      timezone: "UTC",
    })
    setEditingSchedule(null)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schedules</h1>
          <p className="text-sm text-muted-foreground">
            Manage pipeline execution schedules
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Create Schedule
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-2 md:grid-cols-3">
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Total</div>
            <div className="text-xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Enabled</div>
            <div className="text-xl font-bold text-green-500">{stats.enabled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Disabled</div>
            <div className="text-xl font-bold text-gray-500">{stats.disabled}</div>
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
                  placeholder="Search schedules..."
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
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={loadSchedules} disabled={isFetching}>
                <IconRefresh className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {isFetching && schedules.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <IconLoader2 className="h-6 w-6 animate-spin mr-2" />
              Loading schedules...
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">No schedules found</p>
              <p className="text-xs mt-1">Create your first schedule to automate pipeline execution</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSchedules.map((schedule) => (
                <Card key={schedule.id}>
                  <CardContent className="p-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <IconCalendar className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold text-sm">{schedule.name}</h3>
                          <Badge variant={statusConfig[schedule.enabled ? "enabled" : "disabled"].variant} className="text-xs">
                            {statusConfig[schedule.enabled ? "enabled" : "disabled"].label}
                          </Badge>
                          <Badge variant="outline" className="text-blue-500 text-xs">
                            Cron
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs ml-6">
                          <div>
                            <p className="text-muted-foreground">Pipeline</p>
                            <p className="font-medium">{schedule.pipeline_name || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Expression</p>
                            <p className="font-medium font-mono text-xs">{schedule.cron_expression}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Next Run</p>
                            <p className="font-medium">{schedule.next_run || 'Not scheduled'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Last Run</p>
                            <p className="font-medium">{schedule.last_run || 'Never'}</p>
                          </div>
                        </div>
                      </div>
                    <div className="flex items-center gap-1.5">
                      {schedule.enabled ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleToggleEnable(schedule)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <IconPlayerPause className="h-3.5 w-3.5 mr-1" />
                              Disable
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleToggleEnable(schedule)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <IconPlayerPlay className="h-3.5 w-3.5 mr-1" />
                              Enable
                            </>
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
                          <DropdownMenuItem onClick={() => handleEditSchedule(schedule)}>
                            <IconSettings className="mr-2 h-4 w-4" />
                            Edit Schedule
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setScheduleToDelete(schedule.id)}
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

      {/* Create/Edit Schedule Dialog */}
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
            <DialogTitle>{editingSchedule ? "Edit Schedule" : "Create Schedule"}</DialogTitle>
            <DialogDescription>
              {editingSchedule
                ? "Update the schedule configuration."
                : "Create a new schedule to automate pipeline execution."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="schedule-name">Schedule Name</Label>
              <Input
                id="schedule-name"
                placeholder="e.g., Hourly Customer Sync"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="schedule-pipeline">Pipeline</Label>
                <Select value={formData.pipeline} onValueChange={(value) => setFormData({ ...formData, pipeline: value })}>
                  <SelectTrigger id="schedule-pipeline">
                    <SelectValue placeholder="Select pipeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelines.length === 0 ? (
                      <SelectItem value="none" disabled>No pipelines available</SelectItem>
                    ) : (
                      pipelines.map((pipeline) => (
                        <SelectItem key={pipeline.id} value={pipeline.id}>
                          {pipeline.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select the pipeline to schedule
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">America/New York</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los Angeles</SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cron_expression">Cron Expression</Label>
              <Input
                id="cron_expression"
                placeholder="0 * * * * (every hour)"
                value={formData.cron_expression}
                onChange={(e) => setFormData({ ...formData, cron_expression: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Cron format: minute hour day month weekday. Example: "0 * * * *" runs every hour
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
              onClick={handleCreateOrUpdateSchedule}
              disabled={!formData.name.trim() || !formData.cron_expression || !formData.pipeline || isLoading}
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingSchedule ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{editingSchedule ? "Update Schedule" : "Create Schedule"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!scheduleToDelete} onOpenChange={(open) => !open && setScheduleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this schedule. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSchedule} disabled={isLoading}>
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
