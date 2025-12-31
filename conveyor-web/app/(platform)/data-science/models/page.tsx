"use client"

import { useState } from "react"
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconRefresh,
  IconRocket,
  IconTrash,
  IconCopy,
  IconDownload,
  IconCloudUpload,
  IconLoader2,
  IconPlayerStop,
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

type ModelStatus = "deployed" | "training" | "ready" | "failed"

interface Model {
  id: string
  name: string
  description: string
  framework: string
  version: string
  status: ModelStatus
  accuracy: string
  lastTrained: string
  trainedBy: string
}

const initialModels: Model[] = [
  {
    id: "1",
    name: "Churn Prediction v2",
    description: "Random Forest model for predicting customer churn",
    framework: "scikit-learn",
    version: "v2.1",
    status: "deployed",
    accuracy: "94.2%",
    lastTrained: "2 hours ago",
    trainedBy: "Jane Smith",
  },
  {
    id: "2",
    name: "Sales Forecaster",
    description: "LSTM neural network for time series forecasting",
    framework: "tensorflow",
    version: "v1.5",
    status: "ready",
    accuracy: "91.8%",
    lastTrained: "1 day ago",
    trainedBy: "John Doe",
  },
  {
    id: "3",
    name: "Image Classifier",
    description: "CNN for product image classification",
    framework: "pytorch",
    version: "v3.0",
    status: "training",
    accuracy: "88.5%",
    lastTrained: "3 days ago",
    trainedBy: "Sarah Wilson",
  },
  {
    id: "4",
    name: "Sentiment Analyzer",
    description: "Transformer-based sentiment analysis model",
    framework: "huggingface",
    version: "v1.2",
    status: "deployed",
    accuracy: "96.1%",
    lastTrained: "1 week ago",
    trainedBy: "Mike Johnson",
  },
]

const statusConfig: Record<ModelStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  deployed: { label: "Deployed", variant: "default" },
  training: { label: "Training", variant: "secondary" },
  ready: { label: "Ready", variant: "outline" },
  failed: { label: "Failed", variant: "destructive" },
}

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>(initialModels)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [modelToDelete, setModelToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    framework: "scikit-learn",
  })

  const filteredModels = models.filter((model) => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || model.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: models.length,
    deployed: models.filter(m => m.status === "deployed").length,
    training: models.filter(m => m.status === "training").length,
    ready: models.filter(m => m.status === "ready").length,
  }

  const handleCreateModel = async () => {
    if (!formData.name.trim()) return

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))

    const newModel: Model = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      framework: formData.framework,
      version: "v1.0",
      status: "ready",
      accuracy: "0%",
      lastTrained: "Just now",
      trainedBy: "Current User",
    }

    setModels([newModel, ...models])
    setIsLoading(false)
    setIsCreateDialogOpen(false)
    resetForm()
  }

  const handleDeploy = async (model: Model) => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))

    setModels(models =>
      models.map(m =>
        m.id === model.id ? { ...m, status: "deployed" as ModelStatus } : m
      )
    )
    setIsLoading(false)
  }

  const handleStopDeployment = async (model: Model) => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 800))

    setModels(models =>
      models.map(m =>
        m.id === model.id ? { ...m, status: "ready" as ModelStatus } : m
      )
    )
    setIsLoading(false)
  }

  const handleDownload = (model: Model) => {
    const blob = new Blob(["Model weights placeholder"], { type: "application/octet-stream" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${model.name.replace(/\s+/g, "_")}_${model.version}.pkl`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleDeleteModel = async () => {
    if (!modelToDelete) return

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 600))

    setModels(models => models.filter(m => m.id !== modelToDelete))
    setIsLoading(false)
    setModelToDelete(null)
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
          <h1 className="text-2xl font-bold">ML Models</h1>
          <p className="text-sm text-muted-foreground">
            Manage and deploy machine learning models
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Create Model
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
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Deployed</div>
            <div className="text-xl font-bold text-blue-500">{stats.deployed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Training</div>
            <div className="text-xl font-bold text-orange-500">{stats.training}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Ready</div>
            <div className="text-xl font-bold text-green-500">{stats.ready}</div>
          </CardContent>
        </Card>
      </div>

      {/* Models List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="deployed">Deployed</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
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
            {filteredModels.map((model) => (
              <Card key={model.id}>
                <CardContent className="p-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <IconRocket className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">{model.name}</h3>
                        <Badge variant={statusConfig[model.status].variant} className="text-xs">
                          {statusConfig[model.status].label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {model.framework}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {model.description}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Version</p>
                          <p className="font-medium">{model.version}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Accuracy</p>
                          <p className="font-medium">{model.accuracy}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Trained</p>
                          <p className="font-medium">{model.lastTrained}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">By</p>
                          <p className="font-medium">{model.trainedBy}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <p className="font-medium">{statusConfig[model.status].label}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {model.status === "ready" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleDeploy(model)}
                          disabled={isLoading}
                        >
                          <IconCloudUpload className="h-3.5 w-3.5 mr-1" />
                          Deploy
                        </Button>
                      )}
                      {model.status === "deployed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleStopDeployment(model)}
                          disabled={isLoading}
                        >
                          <IconPlayerStop className="h-3.5 w-3.5 mr-1" />
                          Stop
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
                          <DropdownMenuItem onClick={() => handleDownload(model)}>
                            <IconDownload className="mr-2 h-4 w-4" />
                            Download Model
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <IconCopy className="mr-2 h-4 w-4" />
                            Create Version
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setModelToDelete(model.id)}
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

      {/* Create Model Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { if (!open) { setIsCreateDialogOpen(false); resetForm() }}} modal>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Create ML Model</DialogTitle>
            <DialogDescription>Register a new machine learning model</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="model-name">Model Name</Label>
              <Input id="model-name" placeholder="e.g., Churn Predictor" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="framework">Framework</Label>
              <Select value={formData.framework} onValueChange={(value) => setFormData({ ...formData, framework: value })}>
                <SelectTrigger id="framework"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scikit-learn">Scikit-Learn</SelectItem>
                  <SelectItem value="tensorflow">TensorFlow</SelectItem>
                  <SelectItem value="pytorch">PyTorch</SelectItem>
                  <SelectItem value="huggingface">HuggingFace</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe the model..." rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm() }} disabled={isLoading}>Cancel</Button>
            <Button onClick={handleCreateModel} disabled={!formData.name.trim() || isLoading}>
              {isLoading ? <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Model"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!modelToDelete} onOpenChange={(open) => !open && setModelToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Model?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this model and all its versions. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteModel} disabled={isLoading}>
              {isLoading ? <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : "Delete Model"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
