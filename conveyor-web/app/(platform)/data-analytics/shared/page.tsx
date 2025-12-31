"use client"

import { useState } from "react"
import {
  IconShare,
  IconLayoutDashboard,
  IconFileText,
  IconBook,
  IconUsers,
  IconClock,
  IconDots,
  IconEye,
  IconTrash,
  IconSettings,
  IconLink,
  IconMail,
  IconLock,
  IconLockOpen,
  IconSearch,
  IconFilter,
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
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type ContentType = "dashboard" | "report" | "workbook" | "all"
type AccessLevel = "view" | "edit" | "admin"

interface SharedContent {
  id: string
  name: string
  type: "dashboard" | "report" | "workbook"
  owner: string
  sharedWith: {
    type: "user" | "team" | "public"
    name: string
    email?: string
    access: AccessLevel
  }[]
  sharedAt: string
  lastAccessed: string
  views: number
  accessType: "link" | "direct"
}

const mockSharedContent: SharedContent[] = [
  {
    id: "1",
    name: "Sales Performance Dashboard",
    type: "dashboard",
    owner: "Sarah Johnson",
    sharedWith: [
      { type: "team", name: "Sales Team", access: "view" },
      { type: "user", name: "John Doe", email: "john@company.com", access: "edit" },
      { type: "user", name: "Jane Smith", email: "jane@company.com", access: "view" },
    ],
    sharedAt: "2024-01-10",
    lastAccessed: "2 hours ago",
    views: 247,
    accessType: "direct",
  },
  {
    id: "2",
    name: "Monthly Revenue Report",
    type: "report",
    owner: "Michael Chen",
    sharedWith: [
      { type: "team", name: "Finance Team", access: "view" },
      { type: "team", name: "Executive Team", access: "view" },
    ],
    sharedAt: "2024-01-08",
    lastAccessed: "1 day ago",
    views: 156,
    accessType: "link",
  },
  {
    id: "3",
    name: "Customer Analysis Workbook",
    type: "workbook",
    owner: "Emily Rodriguez",
    sharedWith: [
      { type: "public", name: "Anyone with link", access: "view" },
    ],
    sharedAt: "2024-01-05",
    lastAccessed: "3 days ago",
    views: 482,
    accessType: "link",
  },
  {
    id: "4",
    name: "Product Metrics Dashboard",
    type: "dashboard",
    owner: "David Kim",
    sharedWith: [
      { type: "user", name: "Alex Brown", email: "alex@company.com", access: "admin" },
      { type: "team", name: "Product Team", access: "edit" },
    ],
    sharedAt: "2024-01-03",
    lastAccessed: "5 days ago",
    views: 328,
    accessType: "direct",
  },
  {
    id: "5",
    name: "Marketing Campaign Analysis",
    type: "workbook",
    owner: "Lisa Wang",
    sharedWith: [
      { type: "team", name: "Marketing Team", access: "edit" },
      { type: "user", name: "Chris Lee", email: "chris@company.com", access: "view" },
    ],
    sharedAt: "2024-01-01",
    lastAccessed: "1 week ago",
    views: 193,
    accessType: "direct",
  },
]

export default function SharedContentPage() {
  const [content, setContent] = useState<SharedContent[]>(mockSharedContent)
  const [filterType, setFilterType] = useState<ContentType>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedContent, setSelectedContent] = useState<SharedContent | null>(null)
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false)

  const filteredContent = content.filter((item) => {
    const matchesType = filterType === "all" || item.type === filterType
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.owner.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "dashboard":
        return IconLayoutDashboard
      case "report":
        return IconFileText
      case "workbook":
        return IconBook
      default:
        return IconShare
    }
  }

  const getAccessBadge = (access: AccessLevel) => {
    switch (access) {
      case "admin":
        return { variant: "default" as const, label: "Admin" }
      case "edit":
        return { variant: "secondary" as const, label: "Can Edit" }
      case "view":
        return { variant: "outline" as const, label: "View Only" }
    }
  }

  const revokeAccess = (contentId: string) => {
    setContent(content.filter((c) => c.id !== contentId))
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shared Content</h1>
          <p className="text-sm text-muted-foreground">
            Manage shared dashboards, reports, and workbooks
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search shared content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={filterType} onValueChange={(v) => setFilterType(v as ContentType)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboards</TabsTrigger>
            <TabsTrigger value="report">Reports</TabsTrigger>
            <TabsTrigger value="workbook">Workbooks</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Shared Content List */}
      <div className="space-y-4">
        {filteredContent.map((item) => {
          const TypeIcon = getTypeIcon(item.type)
          return (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <TypeIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <Badge variant="outline" className="text-xs capitalize">
                          {item.type}
                        </Badge>
                        {item.accessType === "link" && (
                          <Badge variant="secondary" className="text-xs">
                            <IconLink className="h-3 w-3 mr-1" />
                            Link sharing
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        Shared by {item.owner} • {item.sharedAt}
                      </CardDescription>
                    </div>
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
                        View Content
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedContent(item)
                          setPermissionsDialogOpen(true)
                        }}
                      >
                        <IconSettings className="h-4 w-4 mr-2" />
                        Manage Permissions
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <IconLink className="h-4 w-4 mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => revokeAccess(item.id)}
                      >
                        <IconTrash className="h-4 w-4 mr-2" />
                        Revoke All Access
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Shared With */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Shared with</h4>
                    <div className="space-y-2">
                      {item.sharedWith.map((share, index) => {
                        const accessInfo = getAccessBadge(share.access)
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              {share.type === "public" ? (
                                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                  <IconLockOpen className="h-4 w-4 text-blue-500" />
                                </div>
                              ) : share.type === "team" ? (
                                <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                                  <IconUsers className="h-4 w-4 text-purple-500" />
                                </div>
                              ) : (
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {share.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div>
                                <p className="text-sm font-medium">{share.name}</p>
                                {share.email && (
                                  <p className="text-xs text-muted-foreground">{share.email}</p>
                                )}
                              </div>
                            </div>
                            <Badge variant={accessInfo.variant} className="text-xs">
                              {accessInfo.label}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-xs text-muted-foreground pt-3 border-t">
                    <div className="flex items-center gap-1">
                      <IconEye className="h-3 w-3" />
                      <span>{item.views} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <IconClock className="h-3 w-3" />
                      <span>Last accessed {item.lastAccessed}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <IconUsers className="h-3 w-3" />
                      <span>
                        {item.sharedWith.length} recipient
                        {item.sharedWith.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredContent.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <IconShare className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">No shared content found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Share dashboards, reports, or workbooks to see them here"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              {selectedContent?.name} • Control who can access this content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Add New User/Team */}
            <div className="space-y-2">
              <Label>Add people or teams</Label>
              <div className="flex gap-2">
                <Input placeholder="Enter email or team name" className="flex-1" />
                <Select defaultValue="view">
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">Can View</SelectItem>
                    <SelectItem value="edit">Can Edit</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button>Add</Button>
              </div>
            </div>

            {/* Current Access List */}
            <div className="space-y-2">
              <Label>Who has access</Label>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {selectedContent?.sharedWith.map((share, index) => {
                  const accessInfo = getAccessBadge(share.access)
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        {share.type === "public" ? (
                          <IconLockOpen className="h-4 w-4 text-blue-500" />
                        ) : share.type === "team" ? (
                          <IconUsers className="h-4 w-4 text-purple-500" />
                        ) : (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {share.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <p className="text-sm font-medium">{share.name}</p>
                          {share.email && (
                            <p className="text-xs text-muted-foreground">{share.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select defaultValue={share.access}>
                          <SelectTrigger className="w-[130px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="view">Can View</SelectItem>
                            <SelectItem value="edit">Can Edit</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <IconTrash className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Link Sharing */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Link sharing</Label>
                  <p className="text-xs text-muted-foreground">
                    Anyone with the link can access
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  {selectedContent?.accessType === "link" ? (
                    <>
                      <IconLockOpen className="h-3 w-3 mr-2" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <IconLock className="h-3 w-3 mr-2" />
                      Disabled
                    </>
                  )}
                </Button>
              </div>
              {selectedContent?.accessType === "link" && (
                <div className="flex gap-2">
                  <Input
                    value={`https://app.example.com/shared/${selectedContent.id}`}
                    readOnly
                    className="text-xs"
                  />
                  <Button variant="outline" size="sm">
                    Copy
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)}>
              Close
            </Button>
            <Button>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
