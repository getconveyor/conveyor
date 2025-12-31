"use client"

import { useState } from "react"
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconRefresh,
  IconFolder,
  IconFile,
  IconDownload,
  IconTrash,
  IconFileText,
  IconDatabase,
  IconChevronRight,
  IconLoader2,
  IconUpload,
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

type ItemType = "folder" | "parquet" | "csv" | "json" | "table"

interface ExplorerItem {
  id: string
  name: string
  type: ItemType
  size: string
  modified: string
  records?: string
  path: string
}

const initialItems: ExplorerItem[] = [
  {
    id: "1",
    name: "customers",
    type: "folder",
    size: "2.4 GB",
    modified: "2 hours ago",
    path: "/lakehouse/customers",
  },
  {
    id: "2",
    name: "sales",
    type: "folder",
    size: "5.8 GB",
    modified: "1 day ago",
    path: "/lakehouse/sales",
  },
  {
    id: "3",
    name: "customer_events.parquet",
    type: "parquet",
    size: "1.2 GB",
    modified: "3 hours ago",
    records: "12.4M",
    path: "/lakehouse/events/customer_events.parquet",
  },
  {
    id: "4",
    name: "transactions.csv",
    type: "csv",
    size: "856 MB",
    modified: "5 hours ago",
    records: "3.2M",
    path: "/lakehouse/transactions.csv",
  },
  {
    id: "5",
    name: "product_catalog.json",
    type: "json",
    size: "45 MB",
    modified: "1 week ago",
    records: "125K",
    path: "/lakehouse/products/product_catalog.json",
  },
  {
    id: "6",
    name: "user_profiles",
    type: "table",
    size: "3.1 GB",
    modified: "2 days ago",
    records: "8.5M",
    path: "/lakehouse/users/user_profiles",
  },
]

const typeConfig: Record<ItemType, { icon: any; color: string; label: string }> = {
  folder: { icon: IconFolder, color: "text-blue-500", label: "Folder" },
  parquet: { icon: IconDatabase, color: "text-green-500", label: "Parquet" },
  csv: { icon: IconFileText, color: "text-orange-500", label: "CSV" },
  json: { icon: IconFile, color: "text-purple-500", label: "JSON" },
  table: { icon: IconDatabase, color: "text-cyan-500", label: "Table" },
}

export default function ExplorerPage() {
  const [items, setItems] = useState<ExplorerItem[]>(initialItems)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [currentPath] = useState("/lakehouse")
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [detailsItem, setDetailsItem] = useState<ExplorerItem | null>(null)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "csv" as ItemType,
  })

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || item.type === typeFilter
    return matchesSearch && matchesType
  })

  const stats = {
    total: items.length,
    folders: items.filter(i => i.type === "folder").length,
    files: items.filter(i => i.type !== "folder").length,
    totalSize: "12.3 GB",
  }

  const handleUploadFile = async () => {
    if (!formData.name.trim()) return

    setIsLoading(true)
    // Simulate file upload
    await new Promise(resolve => setTimeout(resolve, 1500))

    const newItem: ExplorerItem = {
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type,
      size: Math.floor(Math.random() * 1000) + " MB",
      modified: "Just now",
      records: formData.type !== "folder" ? Math.floor(Math.random() * 1000) + "K" : undefined,
      path: `${currentPath}/${formData.name}`,
    }

    setItems([newItem, ...items])
    setIsLoading(false)
    setIsUploadDialogOpen(false)
    resetForm()
  }

  const handleDownload = (item: ExplorerItem) => {
    // Simulate file download
    const blob = new Blob(["Sample file content"], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = item.name
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleDeleteItem = async () => {
    if (!itemToDelete) return

    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600))

    setItems(items => items.filter(i => i.id !== itemToDelete))
    setIsLoading(false)
    setItemToDelete(null)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      type: "csv",
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Explorer</h1>
          <p className="text-sm text-muted-foreground">
            Browse and manage data lake files and folders
          </p>
        </div>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <IconUpload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Total Items</div>
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
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Total Size</div>
            <div className="text-xl font-bold">{stats.totalSize}</div>
          </CardContent>
        </Card>
      </div>

      {/* Explorer */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              <IconFolder className="h-4 w-4" />
              <span className="font-medium">{currentPath}</span>
            </div>
            {/* Filters */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex-1 max-w-sm">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search files and folders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="folder">Folders</SelectItem>
                    <SelectItem value="parquet">Parquet</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="table">Tables</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <IconRefresh className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-2">
            {filteredItems.map((item) => {
              const TypeIcon = typeConfig[item.type].icon
              return (
                <Card key={item.id}>
                  <CardContent className="p-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center`}>
                          <TypeIcon className={`h-4 w-4 ${typeConfig[item.type].color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-sm">{item.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {typeConfig[item.type].label}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div>
                              <p className="text-muted-foreground">Size</p>
                              <p className="font-medium">{item.size}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Modified</p>
                              <p className="font-medium">{item.modified}</p>
                            </div>
                            {item.records && (
                              <div>
                                <p className="text-muted-foreground">Records</p>
                                <p className="font-medium">{item.records}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-muted-foreground">Path</p>
                              <p className="font-medium text-xs truncate">{item.path}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.type === "folder" && (
                          <Button variant="outline" size="sm" className="h-8 px-2">
                            <IconChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isLoading}>
                              {isLoading ? (
                                <IconLoader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <IconDotsVertical className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailsItem(item)}>
                              <IconFileText className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(item)}>
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
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upload File Dialog */}
      <Dialog
        open={isUploadDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsUploadDialogOpen(false)
            resetForm()
          }
        }}
        modal
      >
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Upload a new file to the data lake
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file-name">File Name</Label>
              <Input
                id="file-name"
                placeholder="e.g., customer_data.csv"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="file-type">File Type</Label>
              <Select value={formData.type} onValueChange={(value: ItemType) => setFormData({ ...formData, type: value })}>
                <SelectTrigger id="file-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="parquet">Parquet</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="folder">Folder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Upload Path</Label>
              <div className="text-sm text-muted-foreground">{currentPath}/{formData.name || "filename"}</div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadDialogOpen(false)
                resetForm()
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleUploadFile} disabled={!formData.name.trim() || isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <IconUpload className="mr-2 h-4 w-4" />
                  Upload File
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={!!detailsItem}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsItem(null)
          }
        }}
        modal
      >
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>File Details</DialogTitle>
            <DialogDescription>
              Full information about this item
            </DialogDescription>
          </DialogHeader>
          {detailsItem && (
            <div className="py-4 space-y-3">
              <div className="grid gap-2">
                <Label>Name</Label>
                <div className="text-sm">{detailsItem.name}</div>
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Badge variant="secondary" className="text-xs w-fit">
                  {typeConfig[detailsItem.type].label}
                </Badge>
              </div>
              <div className="grid gap-2">
                <Label>Size</Label>
                <div className="text-sm">{detailsItem.size}</div>
              </div>
              {detailsItem.records && (
                <div className="grid gap-2">
                  <Label>Records</Label>
                  <div className="text-sm">{detailsItem.records}</div>
                </div>
              )}
              <div className="grid gap-2">
                <Label>Last Modified</Label>
                <div className="text-sm">{detailsItem.modified}</div>
              </div>
              <div className="grid gap-2">
                <Label>Path</Label>
                <div className="text-sm font-mono text-xs bg-muted/50 p-2 rounded">
                  {detailsItem.path}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailsItem(null)}
            >
              Close
            </Button>
            {detailsItem && (
              <Button onClick={() => handleDownload(detailsItem)}>
                <IconDownload className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this item from the data lake. This action cannot be undone.
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
                "Delete Item"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
