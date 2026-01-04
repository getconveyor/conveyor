"use client"

import { useState } from "react"
import Link from "next/link"
import {
  IconPlus,
  IconBook,
  IconUsers,
  IconClock,
  IconDots,
  IconEdit,
  IconTrash,
  IconCopy,
  IconShare,
  IconEye,
  IconStar,
  IconStarFilled,
  IconCode,
  IconChartBar,
  IconSearch,
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

interface Workbook {
  id: string
  name: string
  description: string
  sections: number
  queries: number
  visualizations: number
  createdBy: string
  createdAt: string
  lastModified: string
  collaborators: number
  isShared: boolean
  favorite: boolean
  tags: string[]
}

const mockWorkbooks: Workbook[] = [
  {
    id: "1",
    name: "Q4 Sales Analysis",
    description: "Comprehensive analysis of Q4 sales performance across all regions",
    sections: 8,
    queries: 12,
    visualizations: 6,
    createdBy: "Sarah Johnson",
    createdAt: "2024-01-10",
    lastModified: "2 hours ago",
    collaborators: 3,
    isShared: true,
    favorite: true,
    tags: ["sales", "quarterly"],
  },
  {
    id: "2",
    name: "Customer Cohort Analysis",
    description: "Retention and lifetime value analysis by customer cohort",
    sections: 6,
    queries: 15,
    visualizations: 9,
    createdBy: "Michael Chen",
    createdAt: "2024-01-08",
    lastModified: "1 day ago",
    collaborators: 2,
    isShared: true,
    favorite: false,
    tags: ["customers", "retention"],
  },
  {
    id: "3",
    name: "Product Performance Dashboard",
    description: "Real-time product metrics and KPIs",
    sections: 10,
    queries: 18,
    visualizations: 12,
    createdBy: "Emily Rodriguez",
    createdAt: "2024-01-05",
    lastModified: "3 days ago",
    collaborators: 5,
    isShared: true,
    favorite: true,
    tags: ["products", "metrics"],
  },
  {
    id: "4",
    name: "Marketing Attribution Model",
    description: "Multi-touch attribution analysis for marketing campaigns",
    sections: 5,
    queries: 8,
    visualizations: 4,
    createdBy: "David Kim",
    createdAt: "2024-01-03",
    lastModified: "5 days ago",
    collaborators: 1,
    isShared: false,
    favorite: false,
    tags: ["marketing", "attribution"],
  },
  {
    id: "5",
    name: "Inventory Optimization",
    description: "Analysis of inventory levels, turnover, and reorder points",
    sections: 7,
    queries: 10,
    visualizations: 5,
    createdBy: "Lisa Wang",
    createdAt: "2024-01-01",
    lastModified: "1 week ago",
    collaborators: 2,
    isShared: true,
    favorite: false,
    tags: ["operations", "inventory"],
  },
  {
    id: "6",
    name: "User Behavior Patterns",
    description: "Deep dive into user engagement and feature usage patterns",
    sections: 9,
    queries: 14,
    visualizations: 8,
    createdBy: "James Mitchell",
    createdAt: "2023-12-28",
    lastModified: "2 weeks ago",
    collaborators: 4,
    isShared: true,
    favorite: true,
    tags: ["analytics", "behavior"],
  },
]

export default function WorkbooksPage() {
  const [workbooks, setWorkbooks] = useState<Workbook[]>(mockWorkbooks)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const filteredWorkbooks = workbooks.filter(
    (workbook) =>
      workbook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workbook.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateWorkbook = () => {
    setCreateDialogOpen(false)
    setFormData({ name: "", description: "" })
  }

  const toggleFavorite = (id: string) => {
    setWorkbooks(workbooks.map((w) => (w.id === id ? { ...w, favorite: !w.favorite } : w)))
  }

  const deleteWorkbook = (id: string) => {
    setWorkbooks(workbooks.filter((w) => w.id !== id))
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workbooks</h1>
          <p className="text-sm text-muted-foreground">
            Interactive data analysis and visualization notebooks
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
                New Workbook
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Workbook</DialogTitle>
                <DialogDescription>
                  Create an interactive notebook for data analysis
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="workbook-name">Workbook Name</Label>
                  <Input
                    id="workbook-name"
                    placeholder="e.g., Sales Analysis"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workbook-description">Description</Label>
                  <Textarea
                    id="workbook-description"
                    placeholder="Describe the purpose of this workbook"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWorkbook}>Create Workbook</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workbooks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWorkbooks.map((workbook) => (
            <Card key={workbook.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <IconBook className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <CardTitle className="text-lg truncate">{workbook.name}</CardTitle>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {workbook.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(workbook.id)}
                    >
                      {workbook.favorite ? (
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
                        <DropdownMenuItem>
                          <IconEye className="h-4 w-4 mr-2" />
                          Open Workbook
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <IconEdit className="h-4 w-4 mr-2" />
                          Edit
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
                          onClick={() => deleteWorkbook(workbook.id)}
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
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-muted/50 rounded">
                      <p className="text-xs text-muted-foreground">Sections</p>
                      <p className="text-lg font-semibold">{workbook.sections}</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <div className="flex items-center justify-center gap-1">
                        <IconCode className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">Queries</p>
                      <p className="text-lg font-semibold">{workbook.queries}</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <div className="flex items-center justify-center gap-1">
                        <IconChartBar className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">Charts</p>
                      <p className="text-lg font-semibold">{workbook.visualizations}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {workbook.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <span>{workbook.createdBy}</span>
                      {workbook.collaborators > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <IconUsers className="h-3 w-3" />
                            <span>{workbook.collaborators}</span>
                          </div>
                        </>
                      )}
                    </div>
                    {workbook.isShared && (
                      <Badge variant="outline" className="text-xs">
                        Shared
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <IconClock className="h-3 w-3" />
                    <span>Modified {workbook.lastModified}</span>
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
              {filteredWorkbooks.map((workbook) => (
                <div
                  key={workbook.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(workbook.id)}
                    >
                      {workbook.favorite ? (
                        <IconStarFilled className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <IconStar className="h-4 w-4" />
                      )}
                    </Button>
                    <IconBook className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{workbook.name}</p>
                        {workbook.isShared && (
                          <Badge variant="outline" className="text-xs">
                            Shared
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {workbook.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{workbook.createdBy}</span>
                        <span>•</span>
                        <span>{workbook.sections} sections</span>
                        <span>•</span>
                        <span>{workbook.queries} queries</span>
                        <span>•</span>
                        <span>{workbook.visualizations} charts</span>
                        {workbook.collaborators > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <IconUsers className="h-3 w-3" />
                              <span>{workbook.collaborators}</span>
                            </div>
                          </>
                        )}
                        <span>•</span>
                        <span>Modified {workbook.lastModified}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-1">
                      {workbook.tags.slice(0, 2).map((tag) => (
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
                        <DropdownMenuItem>
                          <IconEye className="h-4 w-4 mr-2" />
                          Open Workbook
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <IconEdit className="h-4 w-4 mr-2" />
                          Edit
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
                          onClick={() => deleteWorkbook(workbook.id)}
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

      {filteredWorkbooks.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <IconBook className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">No workbooks found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Create your first workbook to get started"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <IconPlus className="h-4 w-4 mr-2" />
                  Create Workbook
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
