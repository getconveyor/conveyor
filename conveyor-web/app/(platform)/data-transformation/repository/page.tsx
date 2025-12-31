"use client"

import { useState } from "react"
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconRefresh,
  IconFolder,
  IconTrash,
  IconCopy,
  IconDownload,
  IconGitBranch,
  IconGitCommit,
  IconFile,
  IconLoader2,
} from "@tabler/icons-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface RepositoryItem {
  id: string
  name: string
  type: "folder" | "file"
  language?: string
  lastCommit: string
  author: string
  branch: string
  size?: string
}

const initialRepositoryItems: RepositoryItem[] = [
  {
    id: "1",
    name: "etl_pipelines",
    type: "folder",
    lastCommit: "Updated customer ETL logic",
    author: "Jane Smith",
    branch: "main",
  },
  {
    id: "2",
    name: "data_quality",
    type: "folder",
    lastCommit: "Added new validation rules",
    author: "John Doe",
    branch: "main",
  },
  {
    id: "3",
    name: "transform_customer_data.py",
    type: "file",
    language: "python",
    lastCommit: "Fixed date parsing bug",
    author: "Sarah Wilson",
    branch: "main",
    size: "12.5 KB",
  },
  {
    id: "4",
    name: "aggregate_sales.sql",
    type: "file",
    language: "sql",
    lastCommit: "Optimized query performance",
    author: "Mike Johnson",
    branch: "main",
    size: "3.2 KB",
  },
  {
    id: "5",
    name: "utils",
    type: "folder",
    lastCommit: "Added helper functions",
    author: "Tom Brown",
    branch: "main",
  },
  {
    id: "6",
    name: "validate_schema.py",
    type: "file",
    language: "python",
    lastCommit: "Enhanced schema validation",
    author: "Jane Smith",
    branch: "develop",
    size: "8.7 KB",
  },
]

export default function RepositoryPage() {
  const [repositoryItems, setRepositoryItems] = useState<RepositoryItem[]>(initialRepositoryItems)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [branchFilter, setBranchFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    type: "file" as "file" | "folder",
    language: "",
    branch: "main",
    commitMessage: "",
  })

  const filteredItems = repositoryItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || item.type === typeFilter
    const matchesBranch = branchFilter === "all" || item.branch === branchFilter
    return matchesSearch && matchesType && matchesBranch
  })

  const stats = {
    total: repositoryItems.length,
    folders: repositoryItems.filter(i => i.type === "folder").length,
    files: repositoryItems.filter(i => i.type === "file").length,
    branches: new Set(repositoryItems.map(i => i.branch)).size,
  }

  const handleCreateItem = async () => {
    if (!formData.name.trim()) return

    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    const newItem: RepositoryItem = {
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type,
      language: formData.type === "file" ? formData.language : undefined,
      lastCommit: formData.commitMessage || "Initial commit",
      author: "You",
      branch: formData.branch,
      size: formData.type === "file" ? "0 KB" : undefined,
    }

    setRepositoryItems([...repositoryItems, newItem])
    setIsLoading(false)
    setIsCreateDialogOpen(false)
    resetForm()
  }

  const handleDeleteItem = async () => {
    if (!itemToDelete) return

    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))

    setRepositoryItems(items => items.filter(i => i.id !== itemToDelete))
    setIsLoading(false)
    setItemToDelete(null)
  }

  const handleDuplicateItem = async (item: RepositoryItem) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))

    const duplicatedItem: RepositoryItem = {
      ...item,
      id: Date.now().toString(),
      name: item.type === "file"
        ? item.name.replace(/(\.[^.]+)$/, "_copy$1")
        : `${item.name}_copy`,
      lastCommit: "Duplicated from " + item.name,
    }
    setRepositoryItems([...repositoryItems, duplicatedItem])
    setIsLoading(false)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      type: "file",
      language: "",
      branch: "main",
      commitMessage: "",
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Repository</h1>
          <p className="text-sm text-muted-foreground">
            Version-controlled transformation code and scripts
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          New File
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Total</div>
            <div className="text-xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Folders</div>
            <div className="text-xl font-bold text-blue-500">{stats.folders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Files</div>
            <div className="text-xl font-bold text-green-500">{stats.files}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Branches</div>
            <div className="text-xl font-bold text-purple-500">{stats.branches}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Repository */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search repository..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="folder">Folders</SelectItem>
                  <SelectItem value="file">Files</SelectItem>
                </SelectContent>
              </Select>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  <SelectItem value="main">main</SelectItem>
                  <SelectItem value="develop">develop</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <IconRefresh className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                        {item.type === "folder" ? (
                          <IconFolder className="h-4 w-4 text-primary" />
                        ) : (
                          <IconFile className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{item.name}</h3>
                          {item.language && (
                            <Badge variant="secondary" className="text-xs">
                              {item.language}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            <IconGitBranch className="mr-1 h-3 w-3" />
                            {item.branch}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <IconGitCommit className="h-3 w-3" />
                          <span>{item.lastCommit}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                          <div>
                            <p className="text-muted-foreground">Author</p>
                            <p className="font-medium">{item.author}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Branch</p>
                            <p className="font-medium">{item.branch}</p>
                          </div>
                          {item.size && (
                            <div>
                              <p className="text-muted-foreground">Size</p>
                              <p className="font-medium">{item.size}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isLoading}>
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <IconFile className="mr-2 h-4 w-4" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <IconGitCommit className="mr-2 h-4 w-4" />
                            View History
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateItem(item)}>
                            <IconCopy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <IconDownload className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setItemToDelete(item.id)}
                          >
                            <IconTrash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create File/Folder Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false)
            resetForm()
          }
        }}
        modal
      >
        <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Create New {formData.type === "file" ? "File" : "Folder"}</DialogTitle>
            <DialogDescription>
              Add a new {formData.type} to the repository
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="item-type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as "file" | "folder" })}>
                <SelectTrigger id="item-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="file">File</SelectItem>
                  <SelectItem value="folder">Folder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                placeholder={formData.type === "file" ? "e.g., transform_data.py" : "e.g., transformations"}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            {formData.type === "file" && (
              <div className="grid gap-2">
                <Label htmlFor="language">Language</Label>
                <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="sql">SQL</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="scala">Scala</SelectItem>
                    <SelectItem value="r">R</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="branch">Branch</Label>
              <Select value={formData.branch} onValueChange={(value) => setFormData({ ...formData, branch: value })}>
                <SelectTrigger id="branch">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">main</SelectItem>
                  <SelectItem value="develop">develop</SelectItem>
                  <SelectItem value="feature">feature</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="commit-message">Commit Message</Label>
              <Textarea
                id="commit-message"
                placeholder="Initial commit"
                rows={2}
                value={formData.commitMessage}
                onChange={(e) => setFormData({ ...formData, commitMessage: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                resetForm()
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateItem}
              disabled={!formData.name.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                `Create ${formData.type === "file" ? "File" : "Folder"}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this item from the repository. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} disabled={isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
