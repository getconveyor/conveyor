"use client";

import { useState, useEffect, useCallback } from "react";
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
  IconRefresh,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  monitoringApi,
  Alert as MonitoringAlert,
  AlertSummary,
} from "@/lib/api/monitoring";
import { formatDistanceToNow } from "date-fns";

interface Alert {
  id: string;
  name: string;
  condition: string;
  severity: "critical" | "warning" | "info" | "error";
  status: "active" | "acknowledged" | "resolved" | "dismissed";
  lastTriggered?: string;
  triggerCount: number;
  enabled: boolean;
  originalAlert?: MonitoringAlert;
}

// Convert MonitoringAlert to local Alert type
function monitoringAlertToAlert(alert: MonitoringAlert): Alert {
  return {
    id: alert.id,
    name: alert.title,
    condition: alert.description,
    severity: alert.severity,
    status: alert.status,
    lastTriggered: formatDistanceToNow(new Date(alert.created_at), {
      addSuffix: true,
    }),
    triggerCount: 1, // Would need backend counter for actual count
    enabled: alert.status === "active",
    originalAlert: alert,
  };
}

export default function RealTimeAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [alertsData, summaryData] = await Promise.all([
        monitoringApi.getAlerts(),
        monitoringApi.getAlertSummary(),
      ]);
      setAlerts(alertsData.map(monitoringAlertToAlert));
      setSummary(summaryData);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
      setError("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const filteredAlerts = alerts.filter((alert) => {
    if (filterStatus === "all") return true;
    return alert.status === filterStatus;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      case "info":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "warning":
        return "secondary";
      case "info":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "destructive";
      case "acknowledged":
        return "outline";
      case "resolved":
        return "secondary";
      case "dismissed":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const toggleAlert = async (id: string, alert: Alert) => {
    try {
      if (alert.status === "active") {
        await monitoringApi.acknowledgeAlert(id);
        setAlerts(
          alerts.map((a) =>
            a.id === id ? { ...a, enabled: false, status: "acknowledged" } : a
          )
        );
      } else {
        // For acknowledged alerts, resolve them
        await monitoringApi.resolveAlert(id);
        setAlerts(
          alerts.map((a) =>
            a.id === id ? { ...a, enabled: true, status: "resolved" } : a
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle alert:", err);
    }
  };

  const dismissAlert = async (id: string) => {
    try {
      await monitoringApi.dismissAlert(id);
      setAlerts(alerts.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to dismiss alert:", err);
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Real-time Alerts</h1>
            <p className="text-sm text-muted-foreground">
              Monitor and configure automated alert rules
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Real-time Alerts</h1>
            <p className="text-sm text-muted-foreground">
              Monitor and configure automated alert rules
            </p>
          </div>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchAlerts} className="mt-4">
              <IconRefresh className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Real-time Alerts</h1>
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
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setCreateDialogOpen(false)}>
                Create Alert
              </Button>
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
                <p className="text-2xl font-semibold">
                  {summary?.total || alerts.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary?.active ||
                    alerts.filter((a) => a.status === "active").length}{" "}
                  active
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
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-500">
                  {summary?.by_severity?.critical ||
                    alerts.filter((a) => a.severity === "critical").length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Needs attention
                </p>
              </div>
              <IconAlertTriangle className="h-8 w-8 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warning</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {summary?.by_severity?.warning ||
                    alerts.filter((a) => a.severity === "warning").length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Should review
                </p>
              </div>
              <IconClock className="h-8 w-8 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Info</p>
                <p className="text-2xl font-bold text-blue-500">
                  {summary?.by_severity?.info ||
                    alerts.filter((a) => a.severity === "info").length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Informational
                </p>
              </div>
              <IconCircleCheck className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="acknowledged">Acknowledged</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
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
                          <IconAlertTriangle
                            className={`h-5 w-5 ${getSeverityColor(
                              alert.severity
                            )}`}
                          />
                          <div>
                            <h4 className="font-semibold">{alert.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {alert.condition}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 ml-8">
                          <Badge
                            variant={getSeverityBadge(alert.severity)}
                            className="text-xs"
                          >
                            {alert.severity}
                          </Badge>
                          <Badge
                            variant={getStatusBadge(alert.status)}
                            className="text-xs"
                          >
                            {alert.status}
                          </Badge>
                          {alert.lastTriggered && (
                            <div className="text-xs text-muted-foreground">
                              Created: {alert.lastTriggered}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAlert(alert.id, alert)}
                          disabled={
                            alert.status === "resolved" ||
                            alert.status === "dismissed"
                          }
                        >
                          {alert.status === "active" ? (
                            <>
                              <IconBellOff className="h-3 w-3 mr-2" />
                              Acknowledge
                            </>
                          ) : alert.status === "acknowledged" ? (
                            <>
                              <IconCircleCheck className="h-3 w-3 mr-2" />
                              Resolve
                            </>
                          ) : (
                            <>
                              <IconCircleCheck className="h-3 w-3 mr-2" />
                              Resolved
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
                            <DropdownMenuItem
                              onClick={() => toggleAlert(alert.id, alert)}
                            >
                              <IconEdit className="h-4 w-4 mr-2" />
                              {alert.status === "active"
                                ? "Acknowledge"
                                : "Resolve"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => dismissAlert(alert.id)}
                            >
                              <IconTrash className="h-4 w-4 mr-2" />
                              Dismiss
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
  );
}
