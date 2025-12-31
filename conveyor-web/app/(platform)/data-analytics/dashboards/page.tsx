"use client"

import { useState } from "react"
import Link from "next/link"
import {
  IconPlus,
  IconLayoutDashboard,
  IconCalendar,
  IconUsers,
  IconDots,
  IconEdit,
  IconTrash,
  IconShare,
  IconCopy,
  IconEye,
  IconStar,
  IconStarFilled,
  IconLayoutGrid,
  IconLayoutList,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Dashboard {
  id: string
  name: string
  description: string
  createdBy: string
  createdAt: string
  lastModified: string
  widgets: number
  views: number
  shared: boolean
  favorite: boolean
  tags: string[]
}

const mockDashboards: Dashboard[] = [
  {
    id: "1",
    name: "Sales Performance",
    description: "Key metrics and trends for sales team performance",
    createdBy: "Sarah Johnson",
    createdAt: "2024-01-15",
    lastModified: "2 hours ago",
    widgets: 8,
    views: 1247,
    shared: true,
    favorite: true,
    tags: ["sales", "revenue"],
  },
  {
    id: "2",
    name: "Customer Analytics",
    description: "Customer behavior, retention, and lifetime value analysis",
    createdBy: "Michael Chen",
    createdAt: "2024-01-10",
    lastModified: "1 day ago",
    widgets: 12,
    views: 892,
    shared: true,
    favorite: false,
    tags: ["customers", "analytics"],
  },
  {
    id: "3",
    name: "Operations Overview",
    description: "Operational efficiency metrics and KPIs",
    createdBy: "Emily Rodriguez",
    createdAt: "2024-01-08",
    lastModified: "3 days ago",
    widgets: 6,
    views: 634,
    shared: false,
    favorite: true,
    tags: ["operations"],
  },
  {
    id: "4",
    name: "Marketing Campaigns",
    description: "Campaign performance tracking and ROI analysis",
    createdBy: "David Kim",
    createdAt: "2024-01-05",
    lastModified: "5 days ago",
    widgets: 10,
    views: 521,
    shared: true,
    favorite: false,
    tags: ["marketing", "campaigns"],
  },
  {
    id: "5",
    name: "Product Metrics",
    description: "Product usage, adoption, and feature analytics",
    createdBy: "Lisa Wang",
    createdAt: "2024-01-03",
    lastModified: "1 week ago",
    widgets: 9,
    views: 445,
    shared: false,
    favorite: false,
    tags: ["product", "usage"],
  },
  {
    id: "6",
    name: "Executive Summary",
    description: "High-level business metrics for leadership team",
    createdBy: "James Mitchell",
    createdAt: "2023-12-28",
    lastModified: "2 weeks ago",
    widgets: 15,
    views: 1893,
    shared: true,
    favorite: true,
    tags: ["executive", "summary"],
  },
]

export default function DashboardsPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>(mockDashboards)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const handleCreateDashboard = () => {
    // In a real app, this would create the dashboard and navigate to builder
    console.log("Creating dashboard:", formData)
    setCreateDialogOpen(false)
    setFormData({ name: "", description: "" })
  }

  const toggleFavorite = (id: string) => {
    setDashboards(
      dashboards.map((d) => (d.id === id ? { ...d, favorite: !d.favorite } : d))
    )
  }

  const deleteDashboard = (id: string) => {
    setDashboards(dashboards.filter((d) => d.id !== id))
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboards</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage custom analytics dashboards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")}>
            <TabsList>
              <TabsTrigger value="grid">
                <IconLayoutGrid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list">
                <IconLayoutList className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <IconPlus className="h-4 w-4 mr-2" />
                New Dashboard
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Dashboard</DialogTitle>
                <DialogDescription>
                  Create a custom dashboard with charts and widgets
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Dashboard Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Sales Performance"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the purpose of this dashboard"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDashboard}>Create Dashboard</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((dashboard) => (
            <Card key={dashboard.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <IconLayoutDashboard className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                    </div>
                    <CardDescription className="mt-2 line-clamp-2">
                      {dashboard.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(dashboard.id)}
                    >
                      {dashboard.favorite ? (
                        <IconStarFilled className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <IconStar className="h-4 w-4" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <IconDots className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/data-analytics/dashboards/${dashboard.id}`}>
                            <IconEye className="h-4 w-4 mr-2" />
                            View Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/data-analytics/dashboards/${dashboard.id}/builder`}>
                            <IconEdit className="h-4 w-4 mr-2" />
                            Edit Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <IconCopy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <IconShare className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteDashboard(dashboard.id)}
                        >
                          <IconTrash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {dashboard.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>{dashboard.widgets} widgets</span>
                      <span>{dashboard.views} views</span>
                    </div>
                    {dashboard.shared && (
                      <Badge variant="outline" className="text-xs">
                        <IconShare className="h-3 w-3 mr-1" />
                        Shared
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                    <IconUsers className="h-3 w-3" />
                    <span>{dashboard.createdBy}</span>
                    <span>•</span>
                    <IconCalendar className="h-3 w-3" />
                    <span>Modified {dashboard.lastModified}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {dashboards.map((dashboard) => (
                <div
                  key={dashboard.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(dashboard.id)}
                    >
                      {dashboard.favorite ? (
                        <IconStarFilled className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <IconStar className="h-4 w-4" />
                      )}
                    </Button>
                    <IconLayoutDashboard className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/data-analytics/dashboards/${dashboard.id}`}
                          className="font-medium hover:underline"
                        >
                          {dashboard.name}
                        </Link>
                        {dashboard.shared && (
                          <Badge variant="outline" className="text-xs">
                            Shared
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {dashboard.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{dashboard.createdBy}</span>
                        <span>•</span>
                        <span>{dashboard.widgets} widgets</span>
                        <span>•</span>
                        <span>{dashboard.views} views</span>
                        <span>•</span>
                        <span>Modified {dashboard.lastModified}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-1">
                      {dashboard.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <IconDots className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/data-analytics/dashboards/${dashboard.id}`}>
                            <IconEye className="h-4 w-4 mr-2" />
                            View Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/data-analytics/dashboards/${dashboard.id}/builder`}>
                            <IconEdit className="h-4 w-4 mr-2" />
                            Edit Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <IconCopy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <IconShare className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteDashboard(dashboard.id)}
                        >
                          <IconTrash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
