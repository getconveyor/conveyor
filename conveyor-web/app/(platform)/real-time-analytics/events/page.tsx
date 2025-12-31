"use client"

import { useState } from "react"
import {
  IconFilter,
  IconRefresh,
  IconDownload,
  IconSearch,
  IconCalendar,
  IconUser,
  IconTag,
  IconClock,
  IconChevronDown,
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Event {
  id: string
  timestamp: string
  type: string
  user: string
  action: string
  details: string
  metadata: Record<string, any>
  severity: "info" | "warning" | "error" | "success"
}

const mockEvents: Event[] = [
  {
    id: "1",
    timestamp: "2024-01-15 14:32:15",
    type: "user_action",
    user: "sarah.j@company.com",
    action: "Purchase Completed",
    details: "Order #12345 - $249.99",
    metadata: { orderId: "12345", amount: 249.99, items: 3 },
    severity: "success",
  },
  {
    id: "2",
    timestamp: "2024-01-15 14:31:42",
    type: "system",
    user: "system",
    action: "Cache Cleared",
    details: "Redis cache flushed - 1.2GB freed",
    metadata: { service: "redis", size: "1.2GB" },
    severity: "info",
  },
  {
    id: "3",
    timestamp: "2024-01-15 14:30:18",
    type: "api_call",
    user: "mobile_app_v2.1",
    action: "API Request",
    details: "GET /api/v1/products?category=electronics",
    metadata: { endpoint: "/api/v1/products", method: "GET", status: 200 },
    severity: "info",
  },
  {
    id: "4",
    timestamp: "2024-01-15 14:29:55",
    type: "user_action",
    user: "john.d@company.com",
    action: "Login Failed",
    details: "Invalid credentials - 3rd attempt",
    metadata: { attempts: 3, ip: "192.168.1.100" },
    severity: "warning",
  },
  {
    id: "5",
    timestamp: "2024-01-15 14:28:33",
    type: "system",
    user: "monitoring",
    action: "Health Check",
    details: "All services healthy",
    metadata: { services: 12, status: "healthy" },
    severity: "success",
  },
  {
    id: "6",
    timestamp: "2024-01-15 14:27:11",
    type: "data_pipeline",
    user: "etl_worker_03",
    action: "Pipeline Failed",
    details: "ETL job timeout after 30 minutes",
    metadata: { pipeline: "daily_sales_agg", duration: "30m" },
    severity: "error",
  },
]

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>(mockEvents)
  const [filterType, setFilterType] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredEvents = events.filter((event) => {
    const matchesType = filterType === "all" || event.type === filterType
    const matchesSearch =
      event.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.details.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "success":
        return "bg-green-500"
      case "info":
        return "bg-blue-500"
      case "warning":
        return "bg-yellow-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "success":
        return "outline"
      case "info":
        return "secondary"
      case "warning":
        return "secondary"
      case "error":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const eventTypeCounts = {
    user_action: events.filter((e) => e.type === "user_action").length,
    system: events.filter((e) => e.type === "system").length,
    api_call: events.filter((e) => e.type === "api_call").length,
    data_pipeline: events.filter((e) => e.type === "data_pipeline").length,
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Event Stream</h1>
          <p className="text-sm text-muted-foreground">
            Real-time event monitoring and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <IconRefresh className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <IconDownload className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{events.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Last hour</p>
              </div>
              <IconTag className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">User Actions</p>
                <p className="text-2xl font-bold">{eventTypeCounts.user_action}</p>
                <p className="text-xs text-muted-foreground mt-1">+15% vs avg</p>
              </div>
              <IconUser className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">API Calls</p>
                <p className="text-2xl font-bold">{eventTypeCounts.api_call}</p>
                <p className="text-xs text-muted-foreground mt-1">Normal load</p>
              </div>
              <IconTag className="h-8 w-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-red-500">
                  {events.filter((e) => e.severity === "error").length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
              </div>
              <IconTag className="h-8 w-8 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={filterType} onValueChange={setFilterType}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="user_action">User Actions</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="api_call">API</TabsTrigger>
            <TabsTrigger value="data_pipeline">Pipelines</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select defaultValue="1h">
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15m">Last 15 min</SelectItem>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Live Events</CardTitle>
          <CardDescription>
            Showing {filteredEvents.length} of {events.length} events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${getSeverityColor(event.severity)}`} />
                          <h4 className="font-semibold">{event.action}</h4>
                          <Badge variant={getSeverityBadge(event.severity)} className="text-xs">
                            {event.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {event.type.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground ml-5">{event.details}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground ml-5">
                          <div className="flex items-center gap-1">
                            <IconClock className="h-3 w-3" />
                            <span>{event.timestamp}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <IconUser className="h-3 w-3" />
                            <span>{event.user}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <IconChevronDown className="h-4 w-4" />
                      </Button>
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
