"use client"

import { useState } from "react"
import {
  IconPlus,
  IconAlertTriangle,
  IconBell,
  IconBellOff,
  IconSettings,
  IconDots,
  IconEdit,
  IconTrash,
  IconCircleCheck,
  IconClock,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Alert {
  id: string
  name: string
  condition: string
  severity: "critical" | "warning" | "info"
  status: "active" | "triggered" | "paused"
  lastTriggered?: string
  triggerCount: number
  enabled: boolean
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    name: "High Error Rate",
    condition: "Error rate > 5% for 5 minutes",
    severity: "critical",
    status: "triggered",
    lastTriggered: "2 minutes ago",
    triggerCount: 3,
    enabled: true,
  },
  {
    id: "2",
    name: "Low Conversion Rate",
    condition: "Conversion rate < 2% for 15 minutes",
    severity: "warning",
    status: "active",
    lastTriggered: "1 hour ago",
    triggerCount: 12,
    enabled: true,
  },
  {
    id: "3",
    name: "API Response Time",
    condition: "Avg response time > 500ms",
    severity: "warning",
    status: "active",
    lastTriggered: "3 hours ago",
    triggerCount: 5,
    enabled: true,
  },
  {
    id: "4",
    name: "System Memory Usage",
    condition: "Memory usage > 85%",
    severity: "critical",
    status: "paused",
    lastTriggered: "1 day ago",
    triggerCount: 1,
    enabled: false,
  },
  {
    id: "5",
    name: "Traffic Spike",
    condition: "Traffic > 10,000 users/min",
    severity: "info",
    status: "active",
    lastTriggered: "Never",
    triggerCount: 0,
    enabled: true,
  },
]

export default function RealTimeAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const filteredAlerts = alerts.filter((alert) => {
    if (filterStatus === "all") return true
    return alert.status === filterStatus
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-500"
      case "warning":
        return "text-yellow-500"
      case "info":
        return "text-blue-500"
      default:
        return "text-gray-500"
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "warning":
        return "secondary"
      case "info":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "triggered":
        return "destructive"
      case "active":
        return "outline"
      case "paused":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const toggleAlert = (id: string) => {
    setAlerts(
      alerts.map((a) => (a.id === id ? { ...a, enabled: !a.enabled, status: a.enabled ? "paused" : "active" as any } : a))
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Real-time Alerts</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and configure automated alert rules
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="h-4 w-4 mr-2" />
              New Alert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Alert Rule</DialogTitle>
              <DialogDescription>
                Set up a new alert condition for real-time monitoring
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="alert-name">Alert Name</Label>
                <Input id="alert-name" placeholder="e.g., High Error Rate" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metric">Metric</Label>
                <Select>
                  <SelectTrigger id="metric">
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="error_rate">Error Rate</SelectItem>
                    <SelectItem value="response_time">Response Time</SelectItem>
                    <SelectItem value="traffic">Traffic</SelectItem>
                    <SelectItem value="conversion">Conversion Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select>
                    <SelectTrigger id="condition">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gt">Greater than</SelectItem>
                      <SelectItem value="lt">Less than</SelectItem>
                      <SelectItem value="eq">Equals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="threshold">Threshold</Label>
                  <Input id="threshold" type="number" placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select>
                  <SelectTrigger id="severity">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setCreateDialogOpen(false)}>Create Alert</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Alerts</p>
                <p className="text-2xl font-bold">{alerts.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {alerts.filter((a) => a.enabled).length} active
                </p>
              </div>
              <IconBell className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Triggered</p>
                <p className="text-2xl font-bold text-red-500">
                  {alerts.filter((a) => a.status === "triggered").length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
              </div>
              <IconAlertTriangle className="h-8 w-8 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Hour</p>
                <p className="text-2xl font-bold">8</p>
                <p className="text-xs text-muted-foreground mt-1">Trigger events</p>
              </div>
              <IconClock className="h-8 w-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolution Rate</p>
                <p className="text-2xl font-bold">94%</p>
                <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
              </div>
              <IconCircleCheck className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="triggered">Triggered</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="paused">Paused</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Rules</CardTitle>
          <CardDescription>
            Showing {filteredAlerts.length} of {alerts.length} alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <Card key={alert.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <IconAlertTriangle className={`h-5 w-5 ${getSeverityColor(alert.severity)}`} />
                          <div>
                            <h4 className="font-semibold">{alert.name}</h4>
                            <p className="text-sm text-muted-foreground">{alert.condition}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 ml-8">
                          <Badge variant={getSeverityBadge(alert.severity)} className="text-xs">
                            {alert.severity}
                          </Badge>
                          <Badge variant={getStatusBadge(alert.status)} className="text-xs">
                            {alert.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            Triggered {alert.triggerCount} times
                          </div>
                          {alert.lastTriggered && (
                            <div className="text-xs text-muted-foreground">
                              Last: {alert.lastTriggered}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAlert(alert.id)}
                        >
                          {alert.enabled ? (
                            <>
                              <IconBellOff className="h-3 w-3 mr-2" />
                              Disable
                            </>
                          ) : (
                            <>
                              <IconBell className="h-3 w-3 mr-2" />
                              Enable
                            </>
                          )}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <IconDots className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <IconEdit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <IconSettings className="h-4 w-4 mr-2" />
                              Configure
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <IconTrash className="h-4 w-4 mr-2" />
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
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  )
}
