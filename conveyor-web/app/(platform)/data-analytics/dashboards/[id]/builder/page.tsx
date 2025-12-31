"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  IconChartLine,
  IconChartBar,
  IconChartArea,
  IconChartPie,
  IconTable,
  IconGauge,
  IconNumber,
  IconPlus,
  IconTrash,
  IconSettings,
  IconDeviceFloppy,
  IconEye,
  IconShare,
  IconX,
  IconGripVertical,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

type WidgetType = "line" | "bar" | "area" | "pie" | "table" | "metric" | "gauge"

interface Widget {
  id: string
  type: WidgetType
  title: string
  dataSource: string
  config: {
    xAxis?: string
    yAxis?: string
    metric?: string
    aggregation?: string
    color?: string
  }
  position: {
    x: number
    y: number
    w: number
    h: number
  }
}

const widgetTypes = [
  {
    type: "line" as WidgetType,
    name: "Line Chart",
    icon: IconChartLine,
    description: "Track trends over time",
  },
  {
    type: "bar" as WidgetType,
    name: "Bar Chart",
    icon: IconChartBar,
    description: "Compare values across categories",
  },
  {
    type: "area" as WidgetType,
    name: "Area Chart",
    icon: IconChartArea,
    description: "Show cumulative trends",
  },
  {
    type: "pie" as WidgetType,
    name: "Pie Chart",
    icon: IconChartPie,
    description: "Display proportions",
  },
  {
    type: "table" as WidgetType,
    name: "Data Table",
    icon: IconTable,
    description: "Detailed data view",
  },
  {
    type: "metric" as WidgetType,
    name: "Single Metric",
    icon: IconNumber,
    description: "Display a key metric",
  },
  {
    type: "gauge" as WidgetType,
    name: "Gauge",
    icon: IconGauge,
    description: "Show progress or capacity",
  },
]

const mockDataSources = [
  { id: "1", name: "Sales Data", table: "sales_fact" },
  { id: "2", name: "Customer Data", table: "customers" },
  { id: "3", name: "Product Inventory", table: "inventory" },
  { id: "4", name: "Web Analytics", table: "web_events" },
  { id: "5", name: "Marketing Campaigns", table: "campaigns" },
]

export default function DashboardBuilderPage() {
  const router = useRouter()
  const [dashboardName, setDashboardName] = useState("New Dashboard")
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null)
  const [isDraggingType, setIsDraggingType] = useState<WidgetType | null>(null)

  const addWidget = (type: WidgetType) => {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type,
      title: `New ${widgetTypes.find((w) => w.type === type)?.name}`,
      dataSource: "",
      config: {},
      position: {
        x: 0,
        y: widgets.length,
        w: type === "metric" || type === "gauge" ? 1 : 2,
        h: type === "metric" ? 1 : 2,
      },
    }
    setWidgets([...widgets, newWidget])
    setSelectedWidget(newWidget.id)
  }

  const updateWidget = (id: string, updates: Partial<Widget>) => {
    setWidgets(widgets.map((w) => (w.id === id ? { ...w, ...updates } : w)))
  }

  const deleteWidget = (id: string) => {
    setWidgets(widgets.filter((w) => w.id !== id))
    if (selectedWidget === id) {
      setSelectedWidget(null)
    }
  }

  const handleSave = () => {
    console.log("Saving dashboard:", { name: dashboardName, widgets })
    // In a real app, would save to backend
  }

  const handlePreview = () => {
    console.log("Preview dashboard")
    // In a real app, would open preview modal or navigate to preview page
  }

  const selectedWidgetData = widgets.find((w) => w.id === selectedWidget)

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/data-analytics/dashboards")}
          >
            <IconX className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <Input
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
              className="text-lg font-semibold border-0 focus-visible:ring-0 px-2 h-8"
            />
            <p className="text-xs text-muted-foreground px-2">
              {widgets.length} widget{widgets.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <IconEye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline">
            <IconShare className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button onClick={handleSave}>
            <IconDeviceFloppy className="h-4 w-4 mr-2" />
            Save Dashboard
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Widget Library */}
        <div className="w-64 border-r bg-muted/30">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">Widgets</h3>
                <div className="space-y-2">
                  {widgetTypes.map((widget) => {
                    const Icon = widget.icon
                    return (
                      <Card
                        key={widget.type}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => addWidget(widget.type)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{widget.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {widget.description}
                              </p>
                            </div>
                            <IconPlus className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Center Panel - Dashboard Canvas */}
        <div className="flex-1 overflow-auto bg-muted/10">
          <ScrollArea className="h-full">
            <div className="p-6">
              {widgets.length === 0 ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center">
                    <IconChartLine className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-semibold mb-2">No widgets yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Click a widget type on the left to add it to your dashboard
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {widgets.map((widget) => {
                    const widgetType = widgetTypes.find((w) => w.type === widget.type)
                    const Icon = widgetType?.icon || IconChartLine
                    return (
                      <Card
                        key={widget.id}
                        className={`col-span-${widget.position.w} row-span-${widget.position.h} cursor-pointer transition-all ${
                          selectedWidget === widget.id
                            ? "ring-2 ring-primary"
                            : "hover:shadow-md"
                        }`}
                        onClick={() => setSelectedWidget(widget.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <IconGripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 cursor-move" />
                              <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                              <CardTitle className="text-sm truncate">
                                {widget.title || "Untitled Widget"}
                              </CardTitle>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteWidget(widget.id)
                              }}
                            >
                              <IconTrash className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-center h-32 bg-muted/50 rounded-md">
                            <Icon className="h-12 w-12 text-muted-foreground opacity-20" />
                          </div>
                          {widget.dataSource && (
                            <div className="mt-3">
                              <Badge variant="secondary" className="text-xs">
                                {mockDataSources.find((ds) => ds.id === widget.dataSource)?.name ||
                                  "No data source"}
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Widget Configuration */}
        <div className="w-80 border-l bg-background">
          <ScrollArea className="h-full">
            {selectedWidgetData ? (
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <IconSettings className="h-5 w-5" />
                  <h3 className="text-sm font-semibold">Widget Settings</h3>
                </div>
                <Separator />

                <div className="space-y-4">
                  {/* Basic Settings */}
                  <div className="space-y-2">
                    <Label htmlFor="widget-title">Title</Label>
                    <Input
                      id="widget-title"
                      value={selectedWidgetData.title}
                      onChange={(e) =>
                        updateWidget(selectedWidgetData.id, { title: e.target.value })
                      }
                      placeholder="Widget title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data-source">Data Source</Label>
                    <Select
                      value={selectedWidgetData.dataSource}
                      onValueChange={(value) =>
                        updateWidget(selectedWidgetData.id, { dataSource: value })
                      }
                    >
                      <SelectTrigger id="data-source">
                        <SelectValue placeholder="Select data source" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockDataSources.map((ds) => (
                          <SelectItem key={ds.id} value={ds.id}>
                            {ds.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Chart-specific Configuration */}
                  {(selectedWidgetData.type === "line" ||
                    selectedWidgetData.type === "bar" ||
                    selectedWidgetData.type === "area") && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="x-axis">X-Axis Field</Label>
                        <Input
                          id="x-axis"
                          value={selectedWidgetData.config.xAxis || ""}
                          onChange={(e) =>
                            updateWidget(selectedWidgetData.id, {
                              config: { ...selectedWidgetData.config, xAxis: e.target.value },
                            })
                          }
                          placeholder="e.g., date, category"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="y-axis">Y-Axis Field</Label>
                        <Input
                          id="y-axis"
                          value={selectedWidgetData.config.yAxis || ""}
                          onChange={(e) =>
                            updateWidget(selectedWidgetData.id, {
                              config: { ...selectedWidgetData.config, yAxis: e.target.value },
                            })
                          }
                          placeholder="e.g., revenue, count"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="aggregation">Aggregation</Label>
                        <Select
                          value={selectedWidgetData.config.aggregation || "sum"}
                          onValueChange={(value) =>
                            updateWidget(selectedWidgetData.id, {
                              config: { ...selectedWidgetData.config, aggregation: value },
                            })
                          }
                        >
                          <SelectTrigger id="aggregation">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sum">Sum</SelectItem>
                            <SelectItem value="avg">Average</SelectItem>
                            <SelectItem value="count">Count</SelectItem>
                            <SelectItem value="min">Minimum</SelectItem>
                            <SelectItem value="max">Maximum</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {selectedWidgetData.type === "metric" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="metric-field">Metric Field</Label>
                        <Input
                          id="metric-field"
                          value={selectedWidgetData.config.metric || ""}
                          onChange={(e) =>
                            updateWidget(selectedWidgetData.id, {
                              config: { ...selectedWidgetData.config, metric: e.target.value },
                            })
                          }
                          placeholder="e.g., total_revenue"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="metric-agg">Aggregation</Label>
                        <Select
                          value={selectedWidgetData.config.aggregation || "sum"}
                          onValueChange={(value) =>
                            updateWidget(selectedWidgetData.id, {
                              config: { ...selectedWidgetData.config, aggregation: value },
                            })
                          }
                        >
                          <SelectTrigger id="metric-agg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sum">Sum</SelectItem>
                            <SelectItem value="avg">Average</SelectItem>
                            <SelectItem value="count">Count</SelectItem>
                            <SelectItem value="min">Minimum</SelectItem>
                            <SelectItem value="max">Maximum</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {selectedWidgetData.type === "gauge" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="gauge-metric">Metric Field</Label>
                        <Input
                          id="gauge-metric"
                          value={selectedWidgetData.config.metric || ""}
                          onChange={(e) =>
                            updateWidget(selectedWidgetData.id, {
                              config: { ...selectedWidgetData.config, metric: e.target.value },
                            })
                          }
                          placeholder="e.g., capacity_used"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Select
                      value={selectedWidgetData.config.color || "blue"}
                      onValueChange={(value) =>
                        updateWidget(selectedWidgetData.id, {
                          config: { ...selectedWidgetData.config, color: value },
                        })
                      }
                    >
                      <SelectTrigger id="color">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="orange">Orange</SelectItem>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Size Settings */}
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-3">Size & Position</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="width">Width</Label>
                        <Select
                          value={selectedWidgetData.position.w.toString()}
                          onValueChange={(value) =>
                            updateWidget(selectedWidgetData.id, {
                              position: {
                                ...selectedWidgetData.position,
                                w: parseInt(value),
                              },
                            })
                          }
                        >
                          <SelectTrigger id="width">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 col</SelectItem>
                            <SelectItem value="2">2 cols</SelectItem>
                            <SelectItem value="3">3 cols</SelectItem>
                            <SelectItem value="4">4 cols</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height">Height</Label>
                        <Select
                          value={selectedWidgetData.position.h.toString()}
                          onValueChange={(value) =>
                            updateWidget(selectedWidgetData.id, {
                              position: {
                                ...selectedWidgetData.position,
                                h: parseInt(value),
                              },
                            })
                          }
                        >
                          <SelectTrigger id="height">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 row</SelectItem>
                            <SelectItem value="2">2 rows</SelectItem>
                            <SelectItem value="3">3 rows</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => deleteWidget(selectedWidgetData.id)}
                  >
                    <IconTrash className="h-4 w-4 mr-2" />
                    Delete Widget
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full p-4">
                <div className="text-center text-muted-foreground">
                  <IconSettings className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Select a widget to configure</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
