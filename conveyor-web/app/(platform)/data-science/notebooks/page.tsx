"use client"

import { useState } from "react"
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconRefresh,
  IconBook,
  IconTrash,
  IconCopy,
  IconDownload,
  IconPlayerPlay,
  IconCode,
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

interface Notebook {
  id: string
  name: string
  description: string
  kernel: string
  lastModified: string
  createdBy: string
  cellCount: number
  language: string
  framework: string
}

const initialNotebooks: Notebook[] = [
  {
    id: "1",
    name: "Customer Churn Prediction",
    description: "ML model to predict customer churn using Random Forest",
    kernel: "Python 3.11",
    lastModified: "2 hours ago",
    createdBy: "Jane Smith",
    cellCount: 32,
    language: "python",
    framework: "scikit-learn",
  },
  {
    id: "2",
    name: "Sales Forecasting LSTM",
    description: "Time series forecasting using LSTM neural networks",
    kernel: "Python 3.11",
    lastModified: "1 day ago",
    createdBy: "John Doe",
    cellCount: 28,
    language: "python",
    framework: "tensorflow",
  },
  {
    id: "3",
    name: "Image Classification CNN",
    description: "Product image classification with convolutional neural networks",
    kernel: "Python 3.11",
    lastModified: "3 days ago",
    createdBy: "Sarah Wilson",
    cellCount: 45,
    language: "python",
    framework: "pytorch",
  },
  {
    id: "4",
    name: "NLP Sentiment Analysis",
    description: "Customer review sentiment analysis using transformers",
    kernel: "Python 3.11",
    lastModified: "1 week ago",
    createdBy: "Mike Johnson",
    cellCount: 38,
    language: "python",
    framework: "huggingface",
  },
]

export default function NotebooksPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>(initialNotebooks)
  const [searchQuery, setSearchQuery] = useState("")
  const [frameworkFilter, setFrameworkFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [notebookToDelete, setNotebookToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    framework: "scikit-learn",
  })

  const filteredNotebooks = notebooks.filter((notebook) => {
    const matchesSearch = notebook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notebook.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFramework = frameworkFilter === "all" || notebook.framework === frameworkFilter
    return matchesSearch && matchesFramework
  })

  const stats = {
    total: notebooks.length,
    sklearn: notebooks.filter(n => n.framework === "scikit-learn").length,
    tensorflow: notebooks.filter(n => n.framework === "tensorflow").length,
    pytorch: notebooks.filter(n => n.framework === "pytorch").length,
  }

  const handleCreateNotebook = async () => {
    if (!formData.name.trim()) return

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))

    const newNotebook: Notebook = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      kernel: "Python 3.11",
      lastModified: "Just now",
      createdBy: "Current User",
      cellCount: 1,
      language: "python",
      framework: formData.framework,
    }

    setNotebooks([newNotebook, ...notebooks])
    setIsLoading(false)
    setIsCreateDialogOpen(false)
    resetForm()
  }

  const handleRunNotebook = async (notebook: Notebook) => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))

    setNotebooks(notebooks =>
      notebooks.map(n =>
        n.id === notebook.id ? { ...n, lastModified: "Just now" } : n
      )
    )
    setIsLoading(false)
  }

  const handleDuplicateNotebook = async (notebook: Notebook) => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 800))

    const duplicatedNotebook: Notebook = {
      ...notebook,
      id: Date.now().toString(),
      name: `${notebook.name} (Copy)`,
      lastModified: "Just now",
    }
    setNotebooks([duplicatedNotebook, ...notebooks])
    setIsLoading(false)
  }

  const handleExportNotebook = (notebook: Notebook) => {
    const notebookData = {
      metadata: {
        kernelspec: {
          name: notebook.language,
          display_name: notebook.kernel,
        },
      },
      cells: Array.from({ length: notebook.cellCount }, (_, i) => ({
        cell_type: "code",
        execution_count: null,
        metadata: {},
        source: [`# Cell ${i + 1}\n`],
        outputs: [],
      })),
    }

    const blob = new Blob([JSON.stringify(notebookData, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${notebook.name.replace(/\s+/g, "_")}.ipynb`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleDeleteNotebook = async () => {
    if (!notebookToDelete) return

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 600))

    setNotebooks(notebooks => notebooks.filter(n => n.id !== notebookToDelete))
    setIsLoading(false)
    setNotebookToDelete(null)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      framework: "scikit-learn",
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ML Notebooks</h1>
          <p className="text-sm text-muted-foreground">
            Interactive notebooks for machine learning experiments
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Create Notebook
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
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Scikit-Learn</div>
            <div className="text-xl font-bold text-blue-500">{stats.sklearn}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">TensorFlow</div>
            <div className="text-xl font-bold text-orange-500">{stats.tensorflow}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">PyTorch</div>
            <div className="text-xl font-bold text-red-500">{stats.pytorch}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Notebooks */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search notebooks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Frameworks</SelectItem>
                  <SelectItem value="scikit-learn">Scikit-Learn</SelectItem>
                  <SelectItem value="tensorflow">TensorFlow</SelectItem>
                  <SelectItem value="pytorch">PyTorch</SelectItem>
                  <SelectItem value="huggingface">HuggingFace</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <IconRefresh className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotebooks.map((notebook) => (
              <Card key={notebook.id}>
                <CardContent className="p-2">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <IconBook className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-1">{notebook.name}</h3>
                        <Badge variant="secondary" className="text-xs mt-0.5">
                          {notebook.framework}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={isLoading}>
                          {isLoading ? (
                            <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <IconDotsVertical className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <IconCode className="mr-2 h-4 w-4" />
                          Open Notebook
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRunNotebook(notebook)}>
                          <IconPlayerPlay className="mr-2 h-4 w-4" />
                          Run All Cells
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateNotebook(notebook)}>
                          <IconCopy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportNotebook(notebook)}>
                          <IconDownload className="mr-2 h-4 w-4" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setNotebookToDelete(notebook.id)}
                        >
                          <IconTrash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {notebook.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Cells</p>
                      <p className="font-medium">{notebook.cellCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Modified</p>
                      <p className="font-medium">{notebook.lastModified}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Created by</p>
                      <p className="font-medium">{notebook.createdBy}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Notebook Dialog */}
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
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Create ML Notebook</DialogTitle>
            <DialogDescription>
              Create a new machine learning notebook
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="notebook-name">Notebook Name</Label>
              <Input
                id="notebook-name"
                placeholder="e.g., Customer Segmentation"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="framework">ML Framework</Label>
              <Select value={formData.framework} onValueChange={(value) => setFormData({ ...formData, framework: value })}>
                <SelectTrigger id="framework">
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scikit-learn">Scikit-Learn</SelectItem>
                  <SelectItem value="tensorflow">TensorFlow</SelectItem>
                  <SelectItem value="pytorch">PyTorch</SelectItem>
                  <SelectItem value="huggingface">HuggingFace</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what this notebook does..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            <Button onClick={handleCreateNotebook} disabled={!formData.name.trim() || isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Notebook"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!notebookToDelete} onOpenChange={(open) => !open && setNotebookToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notebook?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this notebook and all its cells. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNotebook} disabled={isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Notebook"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
