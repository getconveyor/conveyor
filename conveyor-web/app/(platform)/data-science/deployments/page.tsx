"use client"

import { useState } from "react"
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconRefresh,
  IconCloud,
  IconTrash,
  IconPlayerStop,
  IconEye,
  IconLink,
  IconActivity,
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

type DeploymentStatus = "active" | "inactive" | "deploying" | "failed"

interface Deployment {
  id: string
  modelName: string
  version: string
  status: DeploymentStatus
  endpoint: string
  requests: string
  latency: string
  uptime: string
  deployedAt: string
  deployedBy: string
  replicas: number
  cpu: string
  memory: string
}

const initialDeployments: Deployment[] = [
  {
    id: "1",
    modelName: "Churn Prediction v2",
    version: "v2.1",
    status: "active",
    endpoint: "https://api.example.com/v1/churn-predict",
    requests: "12.4K",
    latency: "45ms",
    uptime: "99.9%",
    deployedAt: "2 hours ago",
    deployedBy: "Jane Smith",
    replicas: 3,
    cpu: "2 cores",
    memory: "4 GB",
  },
  {
    id: "2",
    modelName: "Sales Forecaster",
    version: "v1.5",
    status: "active",
    endpoint: "https://api.example.com/v1/sales-forecast",
    requests: "8.2K",
    latency: "62ms",
    uptime: "99.7%",
    deployedAt: "1 day ago",
    deployedBy: "John Doe",
    replicas: 2,
    cpu: "4 cores",
    memory: "8 GB",
  },
  {
    id: "3",
    modelName: "Image Classifier",
    version: "v3.0",
    status: "deploying",
    endpoint: "https://api.example.com/v1/image-classify",
    requests: "0",
    latency: "-",
    uptime: "-",
    deployedAt: "5 minutes ago",
    deployedBy: "Sarah Wilson",
    replicas: 2,
    cpu: "8 cores",
    memory: "16 GB",
  },
  {
    id: "4",
    modelName: "Sentiment Analyzer",
    version: "v1.2",
    status: "inactive",
    endpoint: "https://api.example.com/v1/sentiment",
    requests: "45.1K",
    latency: "38ms",
    uptime: "-",
    deployedAt: "1 week ago",
    deployedBy: "Mike Johnson",
    replicas: 0,
    cpu: "2 cores",
    memory: "4 GB",
  },
]

const statusConfig: Record<DeploymentStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  inactive: { label: "Inactive", variant: "secondary" },
  deploying: { label: "Deploying", variant: "outline" },
  failed: { label: "Failed", variant: "destructive" },
}

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>(initialDeployments)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [deploymentToDelete, setDeploymentToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    modelName: "",
    version: "v1.0",
    replicas: 2,
  })

  const filteredDeployments = deployments.filter((deployment) => {
    const matchesSearch = deployment.modelName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || deployment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: deployments.length,
    active: deployments.filter(d => d.status === "active").length,
    inactive: deployments.filter(d => d.status === "inactive").length,
    totalRequests: "65.7K",
  }

  const handleCreateDeployment = async () => {
    if (!formData.modelName.trim()) return

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))

    const newDeployment: Deployment = {
      id: Date.now().toString(),
      modelName: formData.modelName,
      version: formData.version,
      status: "deploying",
      endpoint: `https://api.example.com/v1/${formData.modelName.toLowerCase().replace(/\s+/g, "-")}`,
      requests: "0",
      latency: "-",
      uptime: "-",
      deployedAt: "Just now",
      deployedBy: "Current User",
      replicas: formData.replicas,
      cpu: "2 cores",
      memory: "4 GB",
    }

    setDeployments([newDeployment, ...deployments])
    setIsLoading(false)
    setIsCreateDialogOpen(false)
    resetForm()
  }

  const handleStopDeployment = async (deployment: Deployment) => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 800))

    setDeployments(deployments =>
      deployments.map(d =>
        d.id === deployment.id ? { ...d, status: "inactive" as DeploymentStatus, replicas: 0, uptime: "-" } : d
      )
    )
    setIsLoading(false)
  }

  const handleStartDeployment = async (deployment: Deployment) => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1200))

    setDeployments(deployments =>
      deployments.map(d =>
        d.id === deployment.id ? { ...d, status: "active" as DeploymentStatus, replicas: 2, uptime: "99.9%" } : d
      )
    )
    setIsLoading(false)
  }

  const handleDeleteDeployment = async () => {
    if (!deploymentToDelete) return

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 600))

    setDeployments(deployments => deployments.filter(d => d.id !== deploymentToDelete))
    setIsLoading(false)
    setDeploymentToDelete(null)
  }

  const handleCopyEndpoint = (endpoint: string) => {
    navigator.clipboard.writeText(endpoint)
  }

  const resetForm = () => {
    setFormData({
      modelName: "",
      version: "v1.0",
      replicas: 2,
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Model Deployments</h1>
          <p className="text-sm text-muted-foreground">
            Manage and monitor deployed ML models
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Deploy Model
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
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Active</div>
            <div className="text-xl font-bold text-green-500">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Inactive</div>
            <div className="text-xl font-bold text-gray-500">{stats.inactive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Total Requests</div>
            <div className="text-xl font-bold">{stats.totalRequests}</div>
          </CardContent>
        </Card>
      </div>

      {/* Deployments List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search deployments..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="deploying">Deploying</SelectItem>
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
            {filteredDeployments.map((deployment) => (
              <Card key={deployment.id}>
                <CardContent className="p-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <IconCloud className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">{deployment.modelName}</h3>
                        <Badge variant="outline" className="text-xs">
                          {deployment.version}
                        </Badge>
                        <Badge variant={statusConfig[deployment.status].variant} className="text-xs">
                          {statusConfig[deployment.status].label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-xs text-muted-foreground font-mono">{deployment.endpoint}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => handleCopyEndpoint(deployment.endpoint)}
                        >
                          <IconLink className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Requests</p>
                          <p className="font-medium">{deployment.requests}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Latency</p>
                          <p className="font-medium">{deployment.latency}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Uptime</p>
                          <p className="font-medium">{deployment.uptime}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Replicas</p>
                          <p className="font-medium">{deployment.replicas}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Resources</p>
                          <p className="font-medium">{deployment.cpu}, {deployment.memory}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Deployed</p>
                          <p className="font-medium">{deployment.deployedAt}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {deployment.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleStopDeployment(deployment)}
                          disabled={isLoading}
                        >
                          <IconPlayerStop className="h-3.5 w-3.5 mr-1" />
                          Stop
                        </Button>
                      )}
                      {deployment.status === "inactive" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleStartDeployment(deployment)}
                          disabled={isLoading}
                        >
                          <IconCloud className="h-3.5 w-3.5 mr-1" />
                          Start
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
                          <DropdownMenuItem>
                            <IconEye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <IconActivity className="mr-2 h-4 w-4" />
                            View Metrics
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeploymentToDelete(deployment.id)}
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

      {/* Create Deployment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { if (!open) { setIsCreateDialogOpen(false); resetForm() }}} modal>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Deploy Model</DialogTitle>
            <DialogDescription>Deploy a model to production</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="model-name">Model Name</Label>
              <Input id="model-name" placeholder="e.g., Churn Predictor" value={formData.modelName} onChange={(e) => setFormData({ ...formData, modelName: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="version">Version</Label>
              <Input id="version" placeholder="e.g., v1.0" value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="replicas">Replicas</Label>
              <Select value={formData.replicas.toString()} onValueChange={(value) => setFormData({ ...formData, replicas: parseInt(value) })}>
                <SelectTrigger id="replicas"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Replica</SelectItem>
                  <SelectItem value="2">2 Replicas</SelectItem>
                  <SelectItem value="3">3 Replicas</SelectItem>
                  <SelectItem value="4">4 Replicas</SelectItem>
                  <SelectItem value="5">5 Replicas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm() }} disabled={isLoading}>Cancel</Button>
            <Button onClick={handleCreateDeployment} disabled={!formData.modelName.trim() || isLoading}>
              {isLoading ? <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" />Deploying...</> : "Deploy Model"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deploymentToDelete} onOpenChange={(open) => !open && setDeploymentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deployment?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this deployment and stop serving the model. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDeployment} disabled={isLoading}>
              {isLoading ? <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : "Delete Deployment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
