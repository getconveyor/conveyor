"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconBell,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconCircleCheck,
  IconClock,
  IconTrash,
  IconDots,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { monitoringApi, Alert } from "@/lib/api/monitoring";
import {
  useAlerts,
  useAcknowledgeAlert,
  useDismissAlert,
} from "@/hooks/use-monitoring";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  originalAlert?: Alert;
}

// Convert Alert severity to notification type
function alertToNotificationType(
  severity: Alert["severity"]
): Notification["type"] {
  switch (severity) {
    case "critical":
    case "error":
      return "error";
    case "warning":
      return "warning";
    case "info":
      return "info";
    default:
      return "info";
  }
}

// Convert Alert status to read state (acknowledged/resolved = read)
function alertToReadState(status: Alert["status"]): boolean {
  return (
    status === "acknowledged" || status === "resolved" || status === "dismissed"
  );
}

// Convert Alert to Notification
function alertToNotification(alert: Alert): Notification {
  return {
    id: alert.id,
    type: alertToNotificationType(alert.severity),
    title: alert.title,
    message: alert.description,
    timestamp: formatDistanceToNow(new Date(alert.created_at), {
      addSuffix: true,
    }),
    read: alertToReadState(alert.status),
    originalAlert: alert,
  };
}

export default function NotificationsPage() {
  const [workflowNotifs, setWorkflowNotifs] = useState(true);
  const [alertNotifs, setAlertNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);

  // Use hooks instead of manual loading
  const { data: alerts = [], isLoading: loading, error } = useAlerts();
  const acknowledgeMutation = useAcknowledgeAlert();
  const dismissMutation = useDismissAlert();

  // Convert alerts to notifications
  const notifications = alerts.map(alertToNotification);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return <IconCircleCheck className="h-5 w-5 text-green-500" />;
      case "warning":
        return <IconAlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <IconX className="h-5 w-5 text-red-500" />;
      case "info":
        return <IconBell className="h-5 w-5 text-blue-500" />;
      default:
        return <IconBell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "success":
        return (
          <Badge
            variant="outline"
            className="text-green-600 border-green-600 text-xs"
          >
            Success
          </Badge>
        );
      case "warning":
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-600 text-xs"
          >
            Warning
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="text-xs">
            Error
          </Badge>
        );
      case "info":
        return (
          <Badge variant="outline" className="text-blue-600 text-xs">
            Info
          </Badge>
        );
      default:
        return null;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await acknowledgeMutation.mutateAsync(id);
    } catch (err) {
      console.error("Failed to acknowledge alert:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Acknowledge all unread alerts
      const unreadAlerts = notifications.filter((n) => !n.read);
      await Promise.all(
        unreadAlerts.map((n) => acknowledgeMutation.mutateAsync(n.id))
      );
    } catch (err) {
      console.error("Failed to acknowledge all alerts:", err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await dismissMutation.mutateAsync(id);
    } catch (err) {
      console.error("Failed to dismiss alert:", err);
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Manage your notifications and preferences
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <IconCheck className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error.message}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All {notifications.length > 0 && `(${notifications.length})`}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* All Notifications */}
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>View all your notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {loading ? (
                    <>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="flex items-start gap-4 p-4 rounded-lg border"
                        >
                          <Skeleton className="h-5 w-5 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <IconBell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        No notifications
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex items-start gap-4 p-4 rounded-lg border ${
                          !notification.read ? "bg-muted/50" : ""
                        }`}
                      >
                        <div className="mt-0.5">
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{notification.title}</p>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                            )}
                            {getTypeBadge(notification.type)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <IconClock className="h-3 w-3" />
                            <span>{notification.timestamp}</span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <IconDots className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!notification.read && (
                              <DropdownMenuItem
                                onClick={() => markAsRead(notification.id)}
                              >
                                <IconCheck className="h-4 w-4 mr-2" />
                                Mark as Read
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                deleteNotification(notification.id)
                              }
                            >
                              <IconTrash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unread Notifications */}
        <TabsContent value="unread" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unread Notifications</CardTitle>
              <CardDescription>
                {unreadCount === 0
                  ? "No unread notifications"
                  : `You have ${unreadCount} unread notification${
                      unreadCount === 1 ? "" : "s"
                    }`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {unreadNotifications.length === 0 ? (
                    <div className="text-center py-12">
                      <IconCircleCheck className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        All caught up! No unread notifications.
                      </p>
                    </div>
                  ) : (
                    unreadNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-start gap-4 p-4 rounded-lg border bg-muted/50"
                      >
                        <div className="mt-0.5">
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{notification.title}</p>
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            {getTypeBadge(notification.type)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <IconClock className="h-3 w-3" />
                            <span>{notification.timestamp}</span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <IconDots className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => markAsRead(notification.id)}
                            >
                              <IconCheck className="h-4 w-4 mr-2" />
                              Mark as Read
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                deleteNotification(notification.id)
                              }
                            >
                              <IconTrash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Workflow Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when workflows complete or fail
                  </p>
                </div>
                <Switch
                  checked={workflowNotifs}
                  onCheckedChange={setWorkflowNotifs}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alert Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications when alerts are triggered
                  </p>
                </div>
                <Switch
                  checked={alertNotifs}
                  onCheckedChange={setAlertNotifs}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send notification summaries to your email
                  </p>
                </div>
                <Switch
                  checked={emailNotifs}
                  onCheckedChange={setEmailNotifs}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dashboard Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications when dashboards are refreshed
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>System Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Important system updates and maintenance notices
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>
                Choose how you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>In-App Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show notifications in the application
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Daily summary of notifications via email
                  </p>
                </div>
                <Switch />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Slack Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send notifications to Slack channel
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
