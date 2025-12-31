"use client"

import { useState } from "react"
import {
  IconPlus,
  IconSearch,
  IconPlayerPlay,
  IconDotsVertical,
  IconClock,
  IconRefresh,
  IconTerminal,
  IconTrash,
  IconEye,
  IconAlertCircle,
  IconLoader2,
  IconPlayerPause,
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

type JobStatus = "running" | "completed" | "failed" | "queued"

interface Job {
  id: string
  name: string
  workflow: string
  status: JobStatus
  startTime: string
  duration: string
  recordsProcessed: string
  progress: number
}

const initialJobs: Job[] = [
  {
    id: "1",
    name: "Customer ETL Run #1247",
    workflow: "Customer Data ETL",
    status: "running",
    startTime: "2 minutes ago",
    duration: "2m 15s",
    recordsProcessed: "45,231",
    progress: 67,
  },
  {
    id: "2",
    name: "Sales Analytics #892",
    workflow: "Sales Analytics Pipeline",
    status: "completed",
    startTime: "15 minutes ago",
    duration: "8m 42s",
    recordsProcessed: "128,456",
    progress: 100,
  },
  {
    id: "3",
    name: "Data Quality Check #156",
    workflow: "Daily Data Quality Check",
    status: "failed",
    startTime: "2 hours ago",
    duration: "1m 23s",
    recordsProcessed: "2,145",
    progress: 15,
  },
  {
    id: "4",
    name: "Event Processing #5623",
    workflow: "Real-time Event Processing",
    status: "running",
    startTime: "Just now",
    duration: "Continuous",
    recordsProcessed: "1.2M",
    progress: 100,
  },
  {
    id: "5",
    name: "Weekly Report #45",
    workflow: "Weekly Report Generation",
    status: "queued",
    startTime: "Scheduled",
    duration: "-",
    recordsProcessed: "-",
    progress: 0,
  },
]

const statusConfig: Record<JobStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  running: { label: "Running", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
  failed: { label: "Failed", variant: "destructive" },
  queued: { label: "Queued", variant: "secondary" },
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isRunJobDialogOpen, setIsRunJobDialogOpen] = useState(false)
  const [jobToCancel, setJobToCancel] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState("")

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.workflow.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: jobs.length,
    running: jobs.filter(j => j.status === "running").length,
    completed: jobs.filter(j => j.status === "completed").length,
    failed: jobs.filter(j => j.status === "failed").length,
  }

  const handleRunJob = async () => {
    if (!selectedWorkflow) return

    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    const jobNumber = jobs.length + 1
    const newJob: Job = {
      id: Date.now().toString(),
      name: `${selectedWorkflow} Run #${jobNumber}`,
      workflow: selectedWorkflow,
      status: "running",
      startTime: "Just now",
      duration: "0s",
      recordsProcessed: "0",
      progress: 0,
    }

    setJobs([newJob, ...jobs])
    setIsLoading(false)
    setIsRunJobDialogOpen(false)
    setSelectedWorkflow("")
  }

  const handleCancelJob = async () => {
    if (!jobToCancel) return

    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))

    setJobs(jobs =>
      jobs.map(j =>
        j.id === jobToCancel
          ? {
              ...j,
              status: "failed" as JobStatus,
              duration: j.duration === "-" ? "0s" : j.duration,
            }
          : j
      )
    )
    setIsLoading(false)
    setJobToCancel(null)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and manage transformation job executions
          </p>
        </div>
        <Button onClick={() => setIsRunJobDialogOpen(true)}>
          <IconPlayerPlay className="mr-2 h-4 w-4" />
          Run Job
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
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Completed</div>
            <div className="text-xl font-bold text-green-500">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Failed</div>
            <div className="text-xl font-bold text-red-500">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Jobs */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
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
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
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
            {filteredJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <IconTerminal className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">{job.name}</h3>
                        <Badge variant={statusConfig[job.status].variant} className="text-xs">
                          {statusConfig[job.status].label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Workflow: {job.workflow}
                      </p>
                      {job.status === "running" && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{job.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Started</p>
                          <p className="font-medium">{job.startTime}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">{job.duration}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Records</p>
                          <p className="font-medium">{job.recordsProcessed}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <p className="font-medium">{statusConfig[job.status].label}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(job.status === "running" || job.status === "queued") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => setJobToCancel(job.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <IconPlayerPause className="h-3.5 w-3.5 mr-1" />
                              Cancel
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
                          <DropdownMenuItem>
                            <IconEye className="mr-2 h-4 w-4" />
                            View Logs
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <IconClock className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {job.status === "failed" && (
                            <DropdownMenuItem>
                              <IconAlertCircle className="mr-2 h-4 w-4" />
                              View Error
                            </DropdownMenuItem>
                          )}
                          {(job.status === "completed" || job.status === "failed") && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <IconPlayerPlay className="mr-2 h-4 w-4" />
                                Re-run Job
                              </DropdownMenuItem>
                            </>
                          )}
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

      {/* Run Job Dialog */}
      <Dialog
        open={isRunJobDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsRunJobDialogOpen(false)
            setSelectedWorkflow("")
          }
        }}
        modal
      >
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Run Job</DialogTitle>
            <DialogDescription>
              Select a workflow to run as a new job
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="workflow">Workflow</Label>
              <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                <SelectTrigger id="workflow">
                  <SelectValue placeholder="Select workflow" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Customer Data ETL">Customer Data ETL</SelectItem>
                  <SelectItem value="Sales Analytics Pipeline">Sales Analytics Pipeline</SelectItem>
                  <SelectItem value="Real-time Event Processing">Real-time Event Processing</SelectItem>
                  <SelectItem value="Daily Data Quality Check">Daily Data Quality Check</SelectItem>
                  <SelectItem value="Weekly Report Generation">Weekly Report Generation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRunJobDialogOpen(false)
                setSelectedWorkflow("")
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleRunJob} disabled={!selectedWorkflow || isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <IconPlayerPlay className="mr-2 h-4 w-4" />
                  Run Job
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Job Confirmation Dialog */}
      <AlertDialog open={!!jobToCancel} onOpenChange={(open) => !open && setJobToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop the job execution. The job will be marked as failed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Keep Running</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelJob} disabled={isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Job"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
