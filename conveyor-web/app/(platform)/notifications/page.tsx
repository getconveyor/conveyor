"use client"

import { useState } from "react"
import {
  IconBell,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconCircleCheck,
  IconClock,
  IconTrash,
  IconDots,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Notification {
  id: string
  type: "success" | "warning" | "error" | "info"
  title: string
  message: string
  timestamp: string
  read: boolean
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "error",
    title: "Workflow Failed",
    message: "ETL Pipeline - Daily Sales failed due to connection timeout",
    timestamp: "2 minutes ago",
    read: false,
  },
  {
    id: "2",
    type: "success",
    title: "Workflow Completed",
    message: "Data Quality Check completed successfully",
    timestamp: "15 minutes ago",
    read: false,
  },
  {
    id: "3",
    type: "warning",
    title: "Alert Triggered",
    message: "High Error Rate alert triggered - Error rate above 5%",
    timestamp: "1 hour ago",
    read: false,
  },
  {
    id: "4",
    type: "success",
    title: "Dashboard Updated",
    message: "Sales Analytics dashboard refreshed with latest data",
    timestamp: "2 hours ago",
    read: true,
  },
  {
    id: "5",
    type: "info",
    title: "Scheduled Maintenance",
    message: "System maintenance scheduled for tomorrow at 2:00 AM UTC",
    timestamp: "3 hours ago",
    read: true,
  },
  {
    id: "6",
    type: "success",
    title: "Workflow Completed",
    message: "Customer Data Sync completed successfully",
    timestamp: "5 hours ago",
    read: true,
  },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [workflowNotifs, setWorkflowNotifs] = useState(true)
  const [alertNotifs, setAlertNotifs] = useState(true)
  const [emailNotifs, setEmailNotifs] = useState(true)

  const unreadCount = notifications.filter((n) => !n.read).length

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return <IconCircleCheck className="h-5 w-5 text-green-500" />
      case "warning":
        return <IconAlertTriangle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <IconX className="h-5 w-5 text-red-500" />
      case "info":
        return <IconBell className="h-5 w-5 text-blue-500" />
      default:
        return <IconBell className="h-5 w-5 text-gray-500" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "success":
        return <Badge variant="outline" className="text-green-600 text-xs">Success</Badge>
      case "warning":
        return <Badge variant="outline" className="text-yellow-600 text-xs">Warning</Badge>
      case "error":
        return <Badge variant="destructive" className="text-xs">Error</Badge>
      case "info":
        return <Badge variant="outline" className="text-blue-600 text-xs">Info</Badge>
      default:
        return null
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const unreadNotifications = notifications.filter((n) => !n.read)
  const readNotifications = notifications.filter((n) => n.read)

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Manage your notifications and preferences
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <IconCheck className="h-4 w-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

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
              <CardDescription>
                View all your notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {notifications.length === 0 ? (
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
                              <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                <IconCheck className="h-4 w-4 mr-2" />
                                Mark as Read
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteNotification(notification.id)}
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
                  : `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
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
                            <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                              <IconCheck className="h-4 w-4 mr-2" />
                              Mark as Read
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteNotification(notification.id)}
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
                <Switch checked={workflowNotifs} onCheckedChange={setWorkflowNotifs} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alert Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications when alerts are triggered
                  </p>
                </div>
                <Switch checked={alertNotifs} onCheckedChange={setAlertNotifs} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send notification summaries to your email
                  </p>
                </div>
                <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
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
  )
}
