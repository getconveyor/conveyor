"use client";

import { useState, useEffect, useCallback } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { streamingApi, StreamEvent } from "@/lib/api/streaming";
import { formatDistanceToNow, format } from "date-fns";

interface Event {
  id: string;
  timestamp: string;
  type: string;
  user: string;
  action: string;
  details: string;
  metadata: Record<string, any>;
  severity: "info" | "warning" | "error" | "success";
}

// Convert StreamEvent to local Event type
function streamEventToEvent(event: StreamEvent): Event {
  const eventData = event.event_data || {};

  // Determine severity based on event type
  let severity: "info" | "warning" | "error" | "success" = "info";
  if (event.event_type.includes("error") || event.event_type.includes("fail")) {
    severity = "error";
  } else if (event.event_type.includes("warn")) {
    severity = "warning";
  } else if (
    event.event_type.includes("success") ||
    event.event_type.includes("complete")
  ) {
    severity = "success";
  }

  return {
    id: event.id,
    timestamp: format(new Date(event.event_time), "yyyy-MM-dd HH:mm:ss"),
    type: eventData.type || "system",
    user: eventData.user || event.pipeline_name || "system",
    action: event.event_type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase()),
    details:
      eventData.message ||
      eventData.details ||
      JSON.stringify(eventData).slice(0, 100),
    metadata: event.event_data,
    severity,
  };
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("1h");

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const hoursMap: Record<string, number> = {
        "15m": 0.25,
        "1h": 1,
        "24h": 24,
        "7d": 168,
      };
      const streamEvents = await streamingApi.getEvents({
        hours: hoursMap[timeRange] || 1,
      });
      setEvents(streamEvents.map(streamEventToEvent));
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = events.filter((event) => {
    const matchesType = filterType === "all" || event.type === filterType;
    const matchesSearch =
      event.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "success":
        return "bg-green-500";
      case "info":
        return "bg-blue-500";
      case "warning":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "success":
        return "outline";
      case "info":
        return "secondary";
      case "warning":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const eventTypeCounts = {
    user_action: events.filter((e) => e.type === "user_action").length,
    system: events.filter((e) => e.type === "system").length,
    api_call: events.filter((e) => e.type === "api_call").length,
    data_pipeline: events.filter((e) => e.type === "data_pipeline").length,
  };

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
          <Button
            variant="outline"
            size="icon"
            onClick={fetchEvents}
            disabled={loading}
          >
            <IconRefresh
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button variant="outline" size="icon">
            <IconDownload className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchEvents} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{events.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last {timeRange}
                  </p>
                </div>
                <IconTag className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">User Actions</p>
                  <p className="text-2xl font-bold">
                    {eventTypeCounts.user_action}
                  </p>
                </div>
                <IconUser className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">API Calls</p>
                  <p className="text-2xl font-bold">
                    {eventTypeCounts.api_call}
                  </p>
                </div>
                <IconTag className="h-8 w-8 text-purple-500 opacity-20" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Errors</p>
                  <p className="text-2xl font-bold text-red-500">
                    {events.filter((e) => e.severity === "error").length}
                  </p>
                </div>
                <IconTag className="h-8 w-8 text-red-500 opacity-20" />
              </div>
            )}
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
        <Select value={timeRange} onValueChange={setTimeRange}>
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
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <IconTag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No events found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-2 w-2 rounded-full ${getSeverityColor(
                                event.severity
                              )}`}
                            />
                            <h4 className="font-semibold">{event.action}</h4>
                            <Badge
                              variant={getSeverityBadge(event.severity)}
                              className="text-xs"
                            >
                              {event.severity}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {event.type.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground ml-5">
                            {event.details}
                          </p>
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
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
