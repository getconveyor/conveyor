"use client"

import { useState } from "react"
import {
  IconSearch,
  IconRefresh,
  IconFilter,
  IconAlertCircle,
  IconInfoCircle,
  IconAlertTriangle,
  IconBug,
  IconCircleCheck,
  IconX,
  IconBell,
  IconBellOff,
  IconDownload,
  IconClock,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

type LogLevel = "error" | "warning" | "info" | "debug"
type AlertSeverity = "critical" | "high" | "medium" | "low"
type AlertStatus = "active" | "acknowledged" | "resolved"

interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  service: string
  message: string
  details?: string
}

interface Alert {
  id: string
  title: string
  severity: AlertSeverity
  status: AlertStatus
  triggered: string
  service: string
  message: string
  count: number
}

const mockLogs: LogEntry[] = [
  {
    id: "1",
    timestamp: "2024-01-15 14:23:45",
    level: "error",
    service: "Data Quality Check",
    message: "Validation failed: Found 123 duplicate records",
    details: "Threshold exceeded (max: 50). Check duplicates in customer_data table.",
  },
  {
    id: "2",
    timestamp: "2024-01-15 14:22:10",
    level: "warning",
    service: "Cache Layer",
    message: "High response time detected: 850ms",
    details: "Cache hit rate dropped to 72%. Consider increasing cache size.",
  },
  {
    id: "3",
    timestamp: "2024-01-15 14:20:33",
    level: "info",
    service: "Customer Data ETL",
    message: "Job completed successfully",
    details: "Processed 45,231 records in 2m 15s",
  },
  {
    id: "4",
    timestamp: "2024-01-15 14:18:52",
    level: "debug",
    service: "API Gateway",
    message: "Request processed: GET /api/workflows",
    details: "Response time: 45ms, Status: 200",
  },
  {
    id: "5",
    timestamp: "2024-01-15 14:15:20",
    level: "error",
    service: "Database Connection",
    message: "Connection pool exhausted",
    details: "All 500 connections in use. New connections being queued.",
  },
  {
    id: "6",
    timestamp: "2024-01-15 14:12:08",
    level: "warning",
    service: "Memory Monitor",
    message: "Memory usage at 85%",
    details: "Current: 6.8GB / 8GB. Consider scaling up resources.",
  },
  {
    id: "7",
    timestamp: "2024-01-15 14:10:45",
    level: "info",
    service: "Sales Analytics Pipeline",
    message: "Starting job execution",
    details: "Run #892, triggered by John Doe",
  },
  {
    id: "8",
    timestamp: "2024-01-15 14:08:12",
    level: "debug",
    service: "Query Optimizer",
    message: "Query plan generated",
    details: "Estimated cost: 1250, using index scan",
  },
]

const mockAlerts: Alert[] = [
  {
    id: "1",
    title: "Data Quality Check Failed",
    severity: "high",
    status: "active",
    triggered: "12 minutes ago",
    service: "Data Quality Check",
    message: "Found 123 duplicate records exceeding threshold",
    count: 3,
  },
  {
    id: "2",
    title: "High Memory Usage",
    severity: "medium",
    status: "acknowledged",
    triggered: "1 hour ago",
    service: "Data Warehouse",
    message: "Memory usage at 85% for 30+ minutes",
    count: 1,
  },
  {
    id: "3",
    title: "Slow Query Performance",
    severity: "low",
    status: "active",
    triggered: "2 hours ago",
    service: "Query Engine",
    message: "Multiple queries exceeding 10s threshold",
    count: 15,
  },
  {
    id: "4",
    title: "Connection Pool Warning",
    severity: "critical",
    status: "resolved",
    triggered: "3 hours ago",
    service: "Database",
    message: "Connection pool exhausted",
    count: 2,
  },
]

const logLevelConfig: Record<LogLevel, { color: string; icon: React.ReactNode; bg: string }> = {
  error: {
    color: "text-red-500",
    icon: <IconAlertCircle className="h-4 w-4" />,
    bg: "bg-red-500/10",
  },
  warning: {
    color: "text-orange-500",
    icon: <IconAlertTriangle className="h-4 w-4" />,
    bg: "bg-orange-500/10",
  },
  info: {
    color: "text-blue-500",
    icon: <IconInfoCircle className="h-4 w-4" />,
    bg: "bg-blue-500/10",
  },
  debug: {
    color: "text-gray-500",
    icon: <IconBug className="h-4 w-4" />,
    bg: "bg-gray-500/10",
  },
}

const alertSeverityConfig: Record<AlertSeverity, { variant: "default" | "secondary" | "destructive" | "outline" }> = {
  critical: { variant: "destructive" },
  high: { variant: "destructive" },
  medium: { variant: "secondary" },
  low: { variant: "outline" },
}

export default function LogsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [logLevelFilter, setLogLevelFilter] = useState<string>("all")
  const [serviceFilter, setServiceFilter] = useState<string>("all")
  const [alertStatusFilter, setAlertStatusFilter] = useState<string>("all")
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false)

  const filteredLogs = mockLogs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.service.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLevel = logLevelFilter === "all" || log.level === logLevelFilter
    const matchesService = serviceFilter === "all" || log.service === serviceFilter
    return matchesSearch && matchesLevel && matchesService
  })

  const filteredAlerts = mockAlerts.filter((alert) => {
    const matchesStatus = alertStatusFilter === "all" || alert.status === alertStatusFilter
    return matchesStatus
  })

  const logStats = {
    total: mockLogs.length,
    errors: mockLogs.filter((l) => l.level === "error").length,
    warnings: mockLogs.filter((l) => l.level === "warning").length,
    info: mockLogs.filter((l) => l.level === "info").length,
  }

  const alertStats = {
    total: mockAlerts.length,
    active: mockAlerts.filter((a) => a.status === "active").length,
    critical: mockAlerts.filter((a) => a.severity === "critical").length,
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alerts & Logs</h1>
          <p className="text-sm text-muted-foreground">
            Monitor alerts and view system logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <IconDownload className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="icon">
            <IconRefresh className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">
            Logs
            <Badge variant="secondary" className="ml-2">
              {logStats.total}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            <Badge variant="secondary" className="ml-2">
              {alertStats.active}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          {/* Log Stats */}
          <div className="grid gap-2 md:grid-cols-4">
            <Card>
              <CardContent className="pt-2 pb-2">
                <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Total Logs</div>
                <div className="text-xl font-bold">{logStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-2 pb-2">
                <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Errors</div>
                <div className="text-xl font-bold text-red-500">{logStats.errors}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-2 pb-2">
                <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Warnings</div>
                <div className="text-xl font-bold text-orange-500">{logStats.warnings}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-2 pb-2">
                <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Info</div>
                <div className="text-xl font-bold text-blue-500">{logStats.info}</div>
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
                      placeholder="Search logs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={logLevelFilter} onValueChange={setLogLevelFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={serviceFilter} onValueChange={setServiceFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      <SelectItem value="Data Quality Check">Data Quality</SelectItem>
                      <SelectItem value="Customer Data ETL">ETL</SelectItem>
                      <SelectItem value="API Gateway">API Gateway</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-1">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer font-mono text-xs"
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className={`${logLevelConfig[log.level].bg} p-1.5 rounded`}>
                      <div className={logLevelConfig[log.level].color}>
                        {logLevelConfig[log.level].icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-muted-foreground">{log.timestamp}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.service}
                        </Badge>
                        <Badge
                          variant={log.level === "error" || log.level === "warning" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {log.level.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-foreground">{log.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {/* Alert Stats */}
          <div className="grid gap-2 md:grid-cols-3">
            <Card>
              <CardContent className="pt-2 pb-2">
                <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Total Alerts</div>
                <div className="text-xl font-bold">{alertStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-2 pb-2">
                <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Active</div>
                <div className="text-xl font-bold text-orange-500">{alertStats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-2 pb-2">
                <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Critical</div>
                <div className="text-xl font-bold text-red-500">{alertStats.critical}</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select value={alertStatusFilter} onValueChange={setAlertStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={() => setIsAlertDialogOpen(true)}>
              <IconBell className="h-4 w-4 mr-1" />
              Configure Alerts
            </Button>
          </div>

          {/* Alerts List */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {filteredAlerts.map((alert) => (
                  <Card key={alert.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <IconAlertCircle className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold text-sm">{alert.title}</h3>
                            <Badge variant={alertSeverityConfig[alert.severity].variant} className="text-xs">
                              {alert.severity}
                            </Badge>
                            {alert.status === "active" ? (
                              <Badge variant="default" className="text-xs">active</Badge>
                            ) : alert.status === "acknowledged" ? (
                              <Badge variant="secondary" className="text-xs">acknowledged</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">resolved</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <IconClock className="h-3 w-3" />
                              {alert.triggered}
                            </span>
                            <span>{alert.service}</span>
                            <span>Count: {alert.count}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {alert.status === "active" && (
                            <Button variant="outline" size="sm" className="h-8 px-2">
                              Acknowledge
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="h-8 px-2">
                            <IconCircleCheck className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Timestamp</p>
                  <p className="font-medium font-mono">{selectedLog.timestamp}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Level</p>
                  <Badge variant={selectedLog.level === "error" ? "destructive" : "secondary"}>
                    {selectedLog.level.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Service</p>
                  <p className="font-medium">{selectedLog.service}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">Message</p>
                <p className="font-mono text-sm p-3 rounded bg-muted">{selectedLog.message}</p>
              </div>
              {selectedLog.details && (
                <div>
                  <p className="text-muted-foreground mb-2">Details</p>
                  <p className="font-mono text-sm p-3 rounded bg-muted whitespace-pre-wrap">
                    {selectedLog.details}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Alert Configuration Dialog */}
      <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Alerts</DialogTitle>
            <DialogDescription>
              Set up alert rules and notification preferences
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Alert Types</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="error-alerts" defaultChecked />
                  <label htmlFor="error-alerts" className="text-sm">Error-level logs</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="warning-alerts" defaultChecked />
                  <label htmlFor="warning-alerts" className="text-sm">Warning-level logs</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="performance-alerts" defaultChecked />
                  <label htmlFor="performance-alerts" className="text-sm">Performance degradation</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="resource-alerts" />
                  <label htmlFor="resource-alerts" className="text-sm">Resource thresholds</label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Notifications</Label>
              <Input id="email" placeholder="admin@example.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAlertDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAlertDialogOpen(false)}>
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
