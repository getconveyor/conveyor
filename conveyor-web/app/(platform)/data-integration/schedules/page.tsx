"use client"

import { useState } from "react"
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

type ScheduleType = "cron" | "interval" | "continuous"
type ScheduleStatus = "active" | "paused" | "disabled"

interface Schedule {
  id: string
  name: string
  description: string
  type: ScheduleType
  expression: string
  status: ScheduleStatus
  pipeline: string
  nextRun: string
  lastRun: string
  timezone: string
  runCount: number
}

const initialSchedules: Schedule[] = [
  {
    id: "1",
    name: "Hourly Customer Sync",
    description: "Sync customer data every hour",
    type: "cron",
    expression: "0 * * * *",
    status: "active",
    pipeline: "Customer Data Sync",
    nextRun: "in 23 minutes",
    lastRun: "37 minutes ago",
    timezone: "UTC",
    runCount: 1247,
  },
  {
    id: "2",
    name: "Daily Order Processing",
    description: "Process orders daily at midnight",
    type: "cron",
    expression: "0 0 * * *",
    status: "active",
    pipeline: "Order Processing Pipeline",
    nextRun: "in 8 hours",
    lastRun: "16 hours ago",
    timezone: "UTC",
    runCount: 156,
  },
  {
    id: "3",
    name: "Real-time Analytics",
    description: "Continuous streaming of analytics data",
    type: "continuous",
    expression: "Continuous",
    status: "active",
    pipeline: "Analytics Events Stream",
    nextRun: "Running",
    lastRun: "1 minute ago",
    timezone: "UTC",
    runCount: 5623,
  },
  {
    id: "4",
    name: "Every 5 Minutes Inventory Check",
    description: "Check inventory levels frequently",
    type: "interval",
    expression: "5m",
    status: "active",
    pipeline: "Inventory Sync",
    nextRun: "in 2 minutes",
    lastRun: "3 minutes ago",
    timezone: "UTC",
    runCount: 8934,
  },
  {
    id: "5",
    name: "Weekly Marketing Report",
    description: "Generate marketing reports every Monday",
    type: "cron",
    expression: "0 9 * * 1",
    status: "paused",
    pipeline: "Marketing Campaign Data",
    nextRun: "Paused",
    lastRun: "5 days ago",
    timezone: "America/New_York",
    runCount: 52,
  },
  {
    id: "6",
    name: "15-Minute Support Ticket Sync",
    description: "Sync support tickets every 15 minutes",
    type: "interval",
    expression: "15m",
    status: "active",
    pipeline: "Support Tickets ETL",
    nextRun: "in 8 minutes",
    lastRun: "7 minutes ago",
    timezone: "UTC",
    runCount: 2456,
  },
]

const typeConfig: Record<ScheduleType, { label: string; color: string }> = {
  cron: { label: "Cron", color: "text-blue-500" },
  interval: { label: "Interval", color: "text-purple-500" },
  continuous: { label: "Continuous", color: "text-green-500" },
}

const statusConfig: Record<ScheduleStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  paused: { label: "Paused", variant: "secondary" },
  disabled: { label: "Disabled", variant: "outline" },
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "" as ScheduleType | "",
    expression: "",
    pipeline: "",
    timezone: "UTC",
  })

  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch = schedule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.pipeline.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || schedule.type === typeFilter
    const matchesStatus = statusFilter === "all" || schedule.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const stats = {
    total: schedules.length,
    active: schedules.filter(s => s.status === "active").length,
    paused: schedules.filter(s => s.status === "paused").length,
    continuous: schedules.filter(s => s.type === "continuous").length,
  }

  const handleCreateOrUpdateSchedule = async () => {
    if (!formData.name.trim() || !formData.type || !formData.expression || !formData.pipeline) return

    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (editingSchedule) {
      // Update existing schedule
      setSchedules(schedules =>
        schedules.map(s =>
          s.id === editingSchedule.id
            ? {
                ...s,
                name: formData.name,
                description: formData.description,
                type: formData.type as ScheduleType,
                expression: formData.expression,
                pipeline: formData.pipeline,
                timezone: formData.timezone,
                nextRun: s.status === "active" ? "in a few moments" : "Paused",
                lastRun: "Just now",
              }
            : s
        )
      )
    } else {
      // Create new schedule
      const newSchedule: Schedule = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        type: formData.type as ScheduleType,
        expression: formData.expression,
        status: "active",
        pipeline: formData.pipeline,
        nextRun: "in a few moments",
        lastRun: "Never",
        timezone: formData.timezone,
        runCount: 0,
      }
      setSchedules([...schedules, newSchedule])
    }

    setIsLoading(false)
    setIsCreateDialogOpen(false)
    resetForm()
  }

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setFormData({
      name: schedule.name,
      description: schedule.description,
      type: schedule.type,
      expression: schedule.expression,
      pipeline: schedule.pipeline,
      timezone: schedule.timezone,
    })
    setIsCreateDialogOpen(true)
  }

  const handleDeleteSchedule = async () => {
    if (!scheduleToDelete) return

    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))

    setSchedules(schedules => schedules.filter(s => s.id !== scheduleToDelete))
    setIsLoading(false)
    setScheduleToDelete(null)
  }

  const handleTogglePlayPause = async (id: string) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600))

    setSchedules(schedules =>
      schedules.map(s =>
        s.id === id
          ? {
              ...s,
              status: s.status === "paused" ? "active" : "paused",
              nextRun: s.status === "paused" ? "in a few moments" : "Paused",
            }
          : s
      )
    )
    setIsLoading(false)
  }

  const handleRunNow = async (id: string) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    setSchedules(schedules =>
      schedules.map(s =>
        s.id === id
          ? {
              ...s,
              lastRun: "Just now",
              runCount: s.runCount + 1,
            }
          : s
      )
    )
    setIsLoading(false)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "",
      expression: "",
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
      <div className="grid gap-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Total</div>
            <div className="text-xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Active</div>
            <div className="text-xl font-bold text-green-500">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Paused</div>
            <div className="text-xl font-bold text-gray-500">{stats.paused}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Continuous</div>
            <div className="text-xl font-bold text-blue-500">{stats.continuous}</div>
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
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="cron">Cron</SelectItem>
                  <SelectItem value="interval">Interval</SelectItem>
                  <SelectItem value="continuous">Continuous</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-2">
            {filteredSchedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardContent className="p-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <IconCalendar className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">{schedule.name}</h3>
                        <Badge variant={statusConfig[schedule.status].variant} className="text-xs">
                          {statusConfig[schedule.status].label}
                        </Badge>
                        <Badge variant="outline" className={`${typeConfig[schedule.type].color} text-xs`}>
                          {typeConfig[schedule.type].label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 ml-6">
                        {schedule.description}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs ml-6">
                        <div>
                          <p className="text-muted-foreground">Pipeline</p>
                          <p className="font-medium">{schedule.pipeline}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Expression</p>
                          <p className="font-medium font-mono text-xs">{schedule.expression}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Next Run</p>
                          <p className="font-medium">{schedule.nextRun}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Run</p>
                          <p className="font-medium">{schedule.lastRun}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Executions</p>
                          <p className="font-medium">{schedule.runCount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {schedule.status === "paused" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleTogglePlayPause(schedule.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <IconPlayerPlay className="h-3.5 w-3.5 mr-1" />
                              Resume
                            </>
                          )}
                        </Button>
                      ) : schedule.status === "active" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleTogglePlayPause(schedule.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <IconPlayerPause className="h-3.5 w-3.5 mr-1" />
                              Pause
                            </>
                          )}
                        </Button>
                      ) : null}
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
                          <DropdownMenuItem onClick={() => handleRunNow(schedule.id)}>
                            <IconRefresh className="mr-2 h-4 w-4" />
                            Run Now
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
            <div className="grid gap-2">
              <Label htmlFor="schedule-description">Description</Label>
              <Textarea
                id="schedule-description"
                placeholder="Describe what this schedule does..."
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    <SelectItem value="Customer Data Sync">Customer Data Sync</SelectItem>
                    <SelectItem value="Order Processing Pipeline">Order Processing Pipeline</SelectItem>
                    <SelectItem value="Analytics Events Stream">Analytics Events Stream</SelectItem>
                    <SelectItem value="Inventory Sync">Inventory Sync</SelectItem>
                    <SelectItem value="Marketing Campaign Data">Marketing Campaign Data</SelectItem>
                    <SelectItem value="Support Tickets ETL">Support Tickets ETL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="schedule-type">Schedule Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as ScheduleType })}>
                  <SelectTrigger id="schedule-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cron">Cron Expression</SelectItem>
                    <SelectItem value="interval">Time Interval</SelectItem>
                    <SelectItem value="continuous">Continuous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="expression">Expression</Label>
                <Input
                  id="expression"
                  placeholder={formData.type === "cron" ? "0 * * * *" : formData.type === "interval" ? "5m" : "continuous"}
                  value={formData.expression}
                  onChange={(e) => setFormData({ ...formData, expression: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.type === "cron" && "Cron format: minute hour day month weekday"}
                  {formData.type === "interval" && "Interval format: 5m, 1h, 30s"}
                  {formData.type === "continuous" && "Type 'continuous' for real-time"}
                  {!formData.type && "Select a schedule type first"}
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
              disabled={!formData.name.trim() || !formData.type || !formData.expression || !formData.pipeline || isLoading}
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
