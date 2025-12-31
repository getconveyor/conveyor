"use client"

import { useState } from "react"
import {
  IconPlus,
  IconSearch,
  IconDatabase,
  IconCloud,
  IconApi,
  IconFile,
  IconDotsVertical,
  IconCheck,
  IconX,
  IconSettings,
  IconTrash,
  IconRefresh,
  IconPlugConnected,
  IconLoader2,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

type ConnectionType = "database" | "cloud" | "api" | "file"
type ConnectionStatus = "connected" | "disconnected" | "error"

interface Connection {
  id: string
  name: string
  type: ConnectionType
  provider: string
  description: string
  status: ConnectionStatus
  lastTested: string
  usedByPipelines: number
  createdAt: string
}

const initialConnections: Connection[] = [
  {
    id: "1",
    name: "Production MySQL",
    type: "database",
    provider: "MySQL",
    description: "Primary production database",
    status: "connected",
    lastTested: "5 minutes ago",
    usedByPipelines: 8,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Staging MySQL",
    type: "database",
    provider: "MySQL",
    description: "Staging environment database",
    status: "connected",
    lastTested: "10 minutes ago",
    usedByPipelines: 3,
    createdAt: "2024-01-16",
  },
  {
    id: "3",
    name: "Salesforce CRM",
    type: "cloud",
    provider: "Salesforce",
    description: "Customer relationship management system",
    status: "connected",
    lastTested: "1 hour ago",
    usedByPipelines: 3,
    createdAt: "2024-01-20",
  },
  {
    id: "4",
    name: "Google Analytics API",
    type: "api",
    provider: "Google Analytics",
    description: "Website analytics data",
    status: "connected",
    lastTested: "30 minutes ago",
    usedByPipelines: 2,
    createdAt: "2024-02-01",
  },
  {
    id: "5",
    name: "Shopify Store",
    type: "cloud",
    provider: "Shopify",
    description: "eCommerce platform integration",
    status: "connected",
    lastTested: "15 minutes ago",
    usedByPipelines: 4,
    createdAt: "2024-01-25",
  },
  {
    id: "6",
    name: "AWS S3 Data Lake",
    type: "cloud",
    provider: "AWS S3",
    description: "Object storage for data lake",
    status: "connected",
    lastTested: "2 hours ago",
    usedByPipelines: 12,
    createdAt: "2024-01-10",
  },
  {
    id: "7",
    name: "AWS S3 Archive",
    type: "cloud",
    provider: "AWS S3",
    description: "Long-term data archive bucket",
    status: "connected",
    lastTested: "4 hours ago",
    usedByPipelines: 2,
    createdAt: "2024-01-11",
  },
  {
    id: "8",
    name: "PostgreSQL Analytics",
    type: "database",
    provider: "PostgreSQL",
    description: "Analytics warehouse database",
    status: "error",
    lastTested: "1 day ago",
    usedByPipelines: 5,
    createdAt: "2024-01-18",
  },
  {
    id: "9",
    name: "PostgreSQL Reporting",
    type: "database",
    provider: "PostgreSQL",
    description: "Read replica for reporting queries",
    status: "connected",
    lastTested: "20 minutes ago",
    usedByPipelines: 6,
    createdAt: "2024-01-19",
  },
  {
    id: "10",
    name: "Zendesk Support",
    type: "api",
    provider: "Zendesk",
    description: "Customer support tickets",
    status: "connected",
    lastTested: "45 minutes ago",
    usedByPipelines: 2,
    createdAt: "2024-02-05",
  },
  {
    id: "11",
    name: "CSV File Server",
    type: "file",
    provider: "SFTP",
    description: "File transfer protocol for CSV imports",
    status: "disconnected",
    lastTested: "3 days ago",
    usedByPipelines: 1,
    createdAt: "2024-01-12",
  },
]

const typeIcons: Record<ConnectionType, React.ElementType> = {
  database: IconDatabase,
  cloud: IconCloud,
  api: IconApi,
  file: IconFile,
}

const statusConfig: Record<ConnectionStatus, { label: string; variant: "default" | "secondary" | "destructive"; color: string }> = {
  connected: { label: "Connected", variant: "default", color: "text-green-500" },
  disconnected: { label: "Disconnected", variant: "secondary", color: "text-gray-500" },
  error: { label: "Error", variant: "destructive", color: "text-red-500" },
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>(initialConnections)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isNewConnectionDialogOpen, setIsNewConnectionDialogOpen] = useState(false)
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null)
  const [connectionToDelete, setConnectionToDelete] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [testingConnectionId, setTestingConnectionId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    type: "" as ConnectionType | "",
    provider: "",
    description: "",
    host: "",
    port: "",
    username: "",
    password: "",
  })

  const filteredConnections = connections.filter((connection) => {
    const matchesSearch = connection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      connection.provider.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || connection.type === typeFilter
    const matchesStatus = statusFilter === "all" || connection.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const stats = {
    total: connections.length,
    connected: connections.filter(c => c.status === "connected").length,
    error: connections.filter(c => c.status === "error").length,
    disconnected: connections.filter(c => c.status === "disconnected").length,
  }

  const handleCreateOrUpdateConnection = async () => {
    if (!formData.name.trim() || !formData.type || !formData.provider) return

    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (editingConnection) {
      // Update existing connection
      setConnections(connections =>
        connections.map(c =>
          c.id === editingConnection.id
            ? {
                ...c,
                name: formData.name,
                type: formData.type as ConnectionType,
                provider: formData.provider,
                description: formData.description,
                lastTested: "Just now",
                status: "connected",
              }
            : c
        )
      )
    } else {
      // Create new connection
      const newConnection: Connection = {
        id: Date.now().toString(),
        name: formData.name,
        type: formData.type as ConnectionType,
        provider: formData.provider,
        description: formData.description,
        status: "connected",
        lastTested: "Just now",
        usedByPipelines: 0,
        createdAt: new Date().toISOString().split('T')[0],
      }
      setConnections([...connections, newConnection])
    }

    setIsLoading(false)
    setIsNewConnectionDialogOpen(false)
    resetForm()
  }

  const handleEditConnection = (connection: Connection) => {
    setEditingConnection(connection)
    setFormData({
      name: connection.name,
      type: connection.type,
      provider: connection.provider,
      description: connection.description,
      host: "",
      port: "",
      username: "",
      password: "",
    })
    setIsNewConnectionDialogOpen(true)
  }

  const handleDeleteConnection = async () => {
    if (!connectionToDelete) return

    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))

    setConnections(connections => connections.filter(c => c.id !== connectionToDelete))
    setIsLoading(false)
    setConnectionToDelete(null)
  }

  const handleTestConnection = async (id: string) => {
    setTestingConnectionId(id)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Randomly succeed or fail
    const success = Math.random() > 0.2

    setConnections(connections =>
      connections.map(c =>
        c.id === id
          ? {
              ...c,
              status: success ? "connected" : "error",
              lastTested: "Just now",
            }
          : c
      )
    )
    setTestingConnectionId(null)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      provider: "",
      description: "",
      host: "",
      port: "",
      username: "",
      password: "",
    })
    setEditingConnection(null)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Connections</h1>
          <p className="text-sm text-muted-foreground">
            Manage data source and destination connections
          </p>
        </div>
        <Button onClick={() => setIsNewConnectionDialogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          New Connection
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
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Connected</div>
            <div className="text-xl font-bold text-green-500">{stats.connected}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Error</div>
            <div className="text-xl font-bold text-red-500">{stats.error}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Disconnected</div>
            <div className="text-xl font-bold text-gray-500">{stats.disconnected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search connections..."
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
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="cloud">Cloud</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="connected">Connected</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="disconnected">Disconnected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {filteredConnections.map((connection) => {
              const Icon = typeIcons[connection.type]
              return (
                <Card key={connection.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{connection.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{connection.provider}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isLoading || testingConnectionId === connection.id}>
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleTestConnection(connection.id)}>
                            <IconPlugConnected className="mr-2 h-4 w-4" />
                            Test Connection
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditConnection(connection)}>
                            <IconSettings className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setConnectionToDelete(connection.id)}
                          >
                            <IconTrash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription className="mt-1">
                      {connection.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge variant={statusConfig[connection.status].variant}>
                          {statusConfig[connection.status].label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Tested</span>
                        <span>{connection.lastTested}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Used by</span>
                        <span>{connection.usedByPipelines} pipelines</span>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full h-8"
                        size="sm"
                        onClick={() => handleTestConnection(connection.id)}
                        disabled={testingConnectionId === connection.id || isLoading}
                      >
                        {testingConnectionId === connection.id ? (
                          <>
                            <IconLoader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <IconRefresh className="mr-2 h-3.5 w-3.5" />
                            Test Connection
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Connection Dialog */}
      <Dialog
        open={isNewConnectionDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsNewConnectionDialogOpen(false)
            resetForm()
          }
        }}
        modal
      >
        <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingConnection ? "Edit Connection" : "New Connection"}</DialogTitle>
            <DialogDescription>
              {editingConnection
                ? "Update the connection configuration."
                : "Create a new connection to a data source or destination."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="connection-name">Connection Name</Label>
              <Input
                id="connection-name"
                placeholder="e.g., Production Database"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="connection-type">Connection Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as ConnectionType })}>
                <SelectTrigger id="connection-type">
                  <SelectValue placeholder="Select connection type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="cloud">Cloud Storage</SelectItem>
                  <SelectItem value="file">File System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="provider">Provider</Label>
              <Select value={formData.provider} onValueChange={(value) => setFormData({ ...formData, provider: value })}>
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MySQL">MySQL</SelectItem>
                  <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                  <SelectItem value="MongoDB">MongoDB</SelectItem>
                  <SelectItem value="Oracle">Oracle</SelectItem>
                  <SelectItem value="SQL Server">SQL Server</SelectItem>
                  <SelectItem value="REST API">REST API</SelectItem>
                  <SelectItem value="GraphQL">GraphQL</SelectItem>
                  <SelectItem value="AWS S3">AWS S3</SelectItem>
                  <SelectItem value="Azure Blob">Azure Blob Storage</SelectItem>
                  <SelectItem value="GCS">Google Cloud Storage</SelectItem>
                  <SelectItem value="SFTP">SFTP</SelectItem>
                  <SelectItem value="FTP">FTP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of this connection"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="host">Host/URL</Label>
                <Input
                  id="host"
                  placeholder="localhost or https://api.example.com"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  placeholder="3306"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsNewConnectionDialogOpen(false)
                resetForm()
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrUpdateConnection}
              disabled={!formData.name.trim() || !formData.type || !formData.provider || isLoading}
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingConnection ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{editingConnection ? "Update Connection" : "Test & Create"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!connectionToDelete} onOpenChange={(open) => !open && setConnectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this connection. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConnection} disabled={isLoading}>
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
