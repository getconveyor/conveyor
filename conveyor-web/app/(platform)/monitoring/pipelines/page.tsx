"use client"

import { useState } from "react"
import {
  IconSearch,
  IconRefresh,
  IconPlayerPlay,
  IconPlayerPause,
  IconX,
  IconCircleCheck,
  IconClock,
  IconDotsVertical,
  IconEye,
  IconTerminal,
  IconChevronRight,
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

type RunStatus = "running" | "completed" | "failed" | "queued" | "cancelled"
type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped"

interface PipelineStep {
  id: string
  name: string
  status: StepStatus
  duration: string
  startTime: string
  logs: string[]
}

interface PipelineRun {
  id: string
  runNumber: number
  workflow: string
  status: RunStatus
  startTime: string
  duration: string
  progress: number
  recordsProcessed: string
  triggeredBy: string
  steps: PipelineStep[]
}

const mockPipelineRuns: PipelineRun[] = [
  {
    id: "1",
    runNumber: 1247,
    workflow: "Customer Data ETL",
    status: "running",
    startTime: "2 minutes ago",
    duration: "2m 15s",
    progress: 67,
    recordsProcessed: "45,231",
    triggeredBy: "Schedule",
    steps: [
      {
        id: "1",
        name: "Extract Data",
        status: "completed",
        duration: "45s",
        startTime: "2m 15s ago",
        logs: ["Connected to source database", "Extracted 45,231 records"],
      },
      {
        id: "2",
        name: "Transform Data",
        status: "running",
        duration: "1m 10s",
        startTime: "1m 30s ago",
        logs: ["Processing records...", "Applied 15 transformations"],
      },
      {
        id: "3",
        name: "Validate Quality",
        status: "pending",
        duration: "-",
        startTime: "-",
        logs: [],
      },
      {
        id: "4",
        name: "Load to Warehouse",
        status: "pending",
        duration: "-",
        startTime: "-",
        logs: [],
      },
      {
        id: "5",
        name: "Send Notification",
        status: "pending",
        duration: "-",
        startTime: "-",
        logs: [],
      },
    ],
  },
  {
    id: "2",
    runNumber: 892,
    workflow: "Sales Analytics Pipeline",
    status: "completed",
    startTime: "15 minutes ago",
    duration: "8m 42s",
    progress: 100,
    recordsProcessed: "128,456",
    triggeredBy: "John Doe",
    steps: [
      {
        id: "1",
        name: "Extract Sales Data",
        status: "completed",
        duration: "2m 15s",
        startTime: "15m ago",
        logs: ["Extracted 128,456 sales records"],
      },
      {
        id: "2",
        name: "Calculate Metrics",
        status: "completed",
        duration: "4m 30s",
        startTime: "12m ago",
        logs: ["Calculated revenue, margin, growth metrics"],
      },
      {
        id: "3",
        name: "Load to Analytics DB",
        status: "completed",
        duration: "1m 57s",
        startTime: "8m ago",
        logs: ["Loaded 128,456 records successfully"],
      },
    ],
  },
  {
    id: "3",
    runNumber: 156,
    workflow: "Data Quality Check",
    status: "failed",
    startTime: "2 hours ago",
    duration: "1m 23s",
    progress: 40,
    recordsProcessed: "2,145",
    triggeredBy: "Schedule",
    steps: [
      {
        id: "1",
        name: "Load Dataset",
        status: "completed",
        duration: "30s",
        startTime: "2h ago",
        logs: ["Loaded 2,145 records"],
      },
      {
        id: "2",
        name: "Check Nulls",
        status: "completed",
        duration: "15s",
        startTime: "2h ago",
        logs: ["Found 45 null values in critical columns"],
      },
      {
        id: "3",
        name: "Check Duplicates",
        status: "failed",
        duration: "38s",
        startTime: "2h ago",
        logs: ["ERROR: Found 123 duplicate records", "Threshold exceeded (max: 50)"],
      },
      {
        id: "4",
        name: "Validate Ranges",
        status: "skipped",
        duration: "-",
        startTime: "-",
        logs: [],
      },
    ],
  },
  {
    id: "4",
    runNumber: 45,
    workflow: "Weekly Report Generation",
    status: "queued",
    startTime: "Scheduled for 8:00 PM",
    duration: "-",
    progress: 0,
    recordsProcessed: "-",
    triggeredBy: "Schedule",
    steps: [],
  },
]

const statusConfig: Record<RunStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  running: { label: "Running", variant: "default", icon: <IconClock className="h-3 w-3 animate-pulse" /> },
  completed: { label: "Completed", variant: "outline", icon: <IconCircleCheck className="h-3 w-3" /> },
  failed: { label: "Failed", variant: "destructive", icon: <IconX className="h-3 w-3" /> },
  queued: { label: "Queued", variant: "secondary", icon: <IconClock className="h-3 w-3" /> },
  cancelled: { label: "Cancelled", variant: "secondary", icon: <IconX className="h-3 w-3" /> },
}

const stepStatusConfig: Record<StepStatus, { color: string; icon: React.ReactNode }> = {
  pending: { color: "text-gray-400", icon: <IconClock className="h-4 w-4" /> },
  running: { color: "text-blue-500", icon: <IconClock className="h-4 w-4 animate-pulse" /> },
  completed: { color: "text-green-500", icon: <IconCircleCheck className="h-4 w-4" /> },
  failed: { color: "text-red-500", icon: <IconX className="h-4 w-4" /> },
  skipped: { color: "text-gray-400", icon: <IconChevronRight className="h-4 w-4" /> },
}

export default function PipelineRunsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedRun, setSelectedRun] = useState<PipelineRun | null>(null)

  const filteredRuns = mockPipelineRuns.filter((run) => {
    const matchesSearch = run.workflow.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || run.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: mockPipelineRuns.length,
    running: mockPipelineRuns.filter((r) => r.status === "running").length,
    completed: mockPipelineRuns.filter((r) => r.status === "completed").length,
    failed: mockPipelineRuns.filter((r) => r.status === "failed").length,
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline Runs</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and track workflow execution history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <IconRefresh className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Total Runs</div>
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

      {/* Filters and Runs */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search pipeline runs..."
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-2">
            {filteredRuns.map((run) => (
              <Card key={run.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <IconTerminal className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">{run.workflow}</h3>
                        <span className="text-xs text-muted-foreground">#{run.runNumber}</span>
                        <Badge variant={statusConfig[run.status].variant} className="text-xs">
                          {statusConfig[run.status].icon}
                          <span className="ml-1">{statusConfig[run.status].label}</span>
                        </Badge>
                      </div>

                      {run.status === "running" && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{run.progress}%</span>
                          </div>
                          <Progress value={run.progress} className="h-1.5" />
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Started</p>
                          <p className="font-medium">{run.startTime}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">{run.duration}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Records</p>
                          <p className="font-medium">{run.recordsProcessed}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Triggered By</p>
                          <p className="font-medium">{run.triggeredBy}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Steps</p>
                          <p className="font-medium">
                            {run.steps.filter((s) => s.status === "completed").length}/
                            {run.steps.length}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => setSelectedRun(run)}
                      >
                        <IconEye className="h-3.5 w-3.5 mr-1" />
                        Details
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <IconTerminal className="mr-2 h-4 w-4" />
                            View Logs
                          </DropdownMenuItem>
                          {run.status === "running" && (
                            <DropdownMenuItem>
                              <IconPlayerPause className="mr-2 h-4 w-4" />
                              Pause Run
                            </DropdownMenuItem>
                          )}
                          {run.status === "failed" && (
                            <DropdownMenuItem>
                              <IconPlayerPlay className="mr-2 h-4 w-4" />
                              Retry Run
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <IconX className="mr-2 h-4 w-4" />
                            Cancel Run
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

      {/* Run Details Dialog */}
      <Dialog open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRun?.workflow} #{selectedRun?.runNumber}
            </DialogTitle>
            <DialogDescription>
              Detailed execution information and step-by-step logs
            </DialogDescription>
          </DialogHeader>
          {selectedRun && (
            <div className="space-y-4">
              {/* Run Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={statusConfig[selectedRun.status].variant} className="mt-1">
                    {statusConfig[selectedRun.status].icon}
                    <span className="ml-1">{statusConfig[selectedRun.status].label}</span>
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium mt-1">{selectedRun.duration}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Records Processed</p>
                  <p className="font-medium mt-1">{selectedRun.recordsProcessed}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Triggered By</p>
                  <p className="font-medium mt-1">{selectedRun.triggeredBy}</p>
                </div>
              </div>

              {/* Steps */}
              <div>
                <h3 className="font-semibold mb-3">Execution Steps</h3>
                <div className="space-y-2">
                  {selectedRun.steps.map((step, index) => (
                    <Card key={step.id}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className={stepStatusConfig[step.status].color}>
                            {stepStatusConfig[step.status].icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{step.name}</h4>
                              <span className="text-xs text-muted-foreground">{step.duration}</span>
                            </div>
                            {step.logs.length > 0 && (
                              <div className="mt-2 p-2 rounded bg-muted/30 font-mono text-xs space-y-1">
                                {step.logs.map((log, i) => (
                                  <div key={i} className={log.includes("ERROR") ? "text-red-500" : ""}>
                                    {log}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
