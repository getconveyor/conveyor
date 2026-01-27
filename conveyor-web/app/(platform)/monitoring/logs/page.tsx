"use client";

import { useState, useEffect, useCallback } from "react";
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
  IconUser,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  monitoringApi,
  AuditLog as ApiAuditLog,
  Alert as ApiAlert,
  AuditLogSummary,
  AlertSummary,
} from "@/lib/api/monitoring";
import { formatDistanceToNow, format } from "date-fns";

type LogLevel = "error" | "warning" | "info" | "debug";
type AlertSeverity = "critical" | "error" | "warning" | "info";
type AlertStatus = "active" | "acknowledged" | "resolved" | "dismissed";

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  details?: string;
  user?: string;
}

interface Alert {
  id: string;
  title: string;
  severity: AlertSeverity;
  status: AlertStatus;
  triggered: string;
  service: string;
  message: string;
  count: number;
}

// Convert AuditLog to LogEntry
function auditLogToLogEntry(log: ApiAuditLog): LogEntry {
  // Determine log level based on action type
  let level: LogLevel = "info";
  if (log.action.includes("delete") || log.action.includes("error")) {
    level = "error";
  } else if (log.action.includes("update") || log.action.includes("warning")) {
    level = "warning";
  } else if (log.action.includes("create") || log.action.includes("read")) {
    level = "info";
  }

  return {
    id: log.id,
    timestamp: format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
    level,
    service: log.resource_type,
    message: `${log.action} ${log.resource_name || log.resource_type}`,
    details: log.changes ? JSON.stringify(log.changes, null, 2) : undefined,
    user: log.user_email || undefined,
  };
}

// Convert ApiAlert to local Alert
function apiAlertToAlert(alert: ApiAlert): Alert {
  return {
    id: alert.id,
    title: alert.title,
    severity: alert.severity,
    status: alert.status,
    triggered: formatDistanceToNow(new Date(alert.created_at), {
      addSuffix: true,
    }),
    service: alert.source || alert.resource_type || "System",
    message: alert.description,
    count: 1, // Would need backend counter
  };
}

const logLevelConfig: Record<
  LogLevel,
  { color: string; icon: React.ReactNode; bg: string }
> = {
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
};

const alertSeverityConfig: Record<
  AlertSeverity,
  { variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  critical: { variant: "destructive" },
  error: { variant: "destructive" },
  warning: { variant: "secondary" },
  info: { variant: "outline" },
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [logLevelFilter, setLogLevelFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [alertStatusFilter, setAlertStatusFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [auditSummary, setAuditSummary] = useState<AuditLogSummary | null>(
    null
  );
  const [alertSummary, setAlertSummary] = useState<AlertSummary | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [auditLogs, alertsData, auditSum, alertSum] = await Promise.all([
        monitoringApi.getAuditLogs(),
        monitoringApi.getAlerts(),
        monitoringApi.getAuditLogSummary(),
        monitoringApi.getAlertSummary(),
      ]);
      setLogs(auditLogs.map(auditLogToLogEntry));
      setAlerts(alertsData.map(apiAlertToAlert));
      setAuditSummary(auditSum);
      setAlertSummary(alertSum);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      setError("Failed to load logs and alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel =
      logLevelFilter === "all" || log.level === logLevelFilter;
    const matchesService =
      serviceFilter === "all" || log.service === serviceFilter;
    return matchesSearch && matchesLevel && matchesService;
  });

  const filteredAlerts = alerts.filter((alert) => {
    const matchesStatus =
      alertStatusFilter === "all" || alert.status === alertStatusFilter;
    return matchesStatus;
  });

  const logStats = {
    total: auditSummary?.total_actions_24h || logs.length,
    errors: logs.filter((l) => l.level === "error").length,
    warnings: logs.filter((l) => l.level === "warning").length,
    info: logs.filter((l) => l.level === "info").length,
  };

  const alertStats = {
    total: alertSummary?.total || alerts.length,
    active:
      alertSummary?.active ||
      alerts.filter((a) => a.status === "active").length,
    critical:
      alertSummary?.by_severity?.critical ||
      alerts.filter((a) => a.severity === "critical").length,
  };

  const services = [...new Set(logs.map((l) => l.service))];

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Alerts & Logs</h1>
            <p className="text-sm text-muted-foreground">
              Monitor alerts and view system logs
            </p>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
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
            <h1 className="text-xl font-semibold">Alerts & Logs</h1>
            <p className="text-sm text-muted-foreground">
              Monitor alerts and view system logs
            </p>
          </div>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchData} className="mt-4">
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
          <h1 className="text-xl font-semibold">Alerts & Logs</h1>
          <p className="text-sm text-muted-foreground">
            Monitor alerts and view system logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <IconDownload className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="icon" onClick={fetchData}>
            <IconRefresh
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
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
                <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
                  Total Logs
                </div>
                <div className="text-xl font-bold">{logStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-2 pb-2">
                <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
                  Errors
                </div>
                <div className="text-xl font-bold text-red-500">
                  {logStats.errors}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-2 pb-2">
                <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
                  Warnings
                </div>
                <div className="text-xl font-bold text-orange-500">
                  {logStats.warnings}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-2 pb-2">
                <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
                  Info
                </div>
                <div className="text-xl font-bold text-blue-500">
                  {logStats.info}
                </div>
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
                  <Select
                    value={logLevelFilter}
                    onValueChange={setLogLevelFilter}
                  >
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
                  <Select
                    value={serviceFilter}
                    onValueChange={setServiceFilter}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      <SelectItem value="Data Quality Check">
                        Data Quality
                      </SelectItem>
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
                    <div
                      className={`${
                        logLevelConfig[log.level].bg
                      } p-1.5 rounded`}
                    >
                      <div className={logLevelConfig[log.level].color}>
                        {logLevelConfig[log.level].icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-muted-foreground">
                          {log.timestamp}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.service}
                        </Badge>
                        <Badge
                          variant={
                            log.level === "error" || log.level === "warning"
                              ? "destructive"
                              : "secondary"
                          }
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
                <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
                  Total Alerts
                </div>
                <div className="text-xl font-bold">{alertStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-2 pb-2">
                <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
                  Active
                </div>
                <div className="text-xl font-bold text-orange-500">
                  {alertStats.active}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-2 pb-2">
                <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
                  Critical
                </div>
                <div className="text-xl font-bold text-red-500">
                  {alertStats.critical}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select
                value={alertStatusFilter}
                onValueChange={setAlertStatusFilter}
              >
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
                            <h3 className="font-semibold text-sm">
                              {alert.title}
                            </h3>
                            <Badge
                              variant={
                                alertSeverityConfig[alert.severity].variant
                              }
                              className="text-xs"
                            >
                              {alert.severity}
                            </Badge>
                            {alert.status === "active" ? (
                              <Badge variant="default" className="text-xs">
                                active
                              </Badge>
                            ) : alert.status === "acknowledged" ? (
                              <Badge variant="secondary" className="text-xs">
                                acknowledged
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                resolved
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {alert.message}
                          </p>
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
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2"
                            >
                              Acknowledge
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                          >
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
                  <p className="font-medium font-mono">
                    {selectedLog.timestamp}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Level</p>
                  <Badge
                    variant={
                      selectedLog.level === "error"
                        ? "destructive"
                        : "secondary"
                    }
                  >
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
                <p className="font-mono text-sm p-3 rounded bg-muted">
                  {selectedLog.message}
                </p>
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
                  <label htmlFor="error-alerts" className="text-sm">
                    Error-level logs
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="warning-alerts" defaultChecked />
                  <label htmlFor="warning-alerts" className="text-sm">
                    Warning-level logs
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="performance-alerts" defaultChecked />
                  <label htmlFor="performance-alerts" className="text-sm">
                    Performance degradation
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="resource-alerts" />
                  <label htmlFor="resource-alerts" className="text-sm">
                    Resource thresholds
                  </label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Notifications</Label>
              <Input id="email" placeholder="admin@example.com" />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAlertDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setIsAlertDialogOpen(false)}>
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
