"use client"

import { useState, useEffect } from "react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { integrationApi, Connection, CreateConnectionData } from "@/lib/api/integration"
import { toast } from "sonner"
import {
  IconPlus,
  IconSearch,
  IconApi,
  IconDatabase,
  IconCloud,
  IconFile,
  IconBrandGithub,
  IconBrandGoogle,
  IconBrandStripe,
  IconBrandSlack,
  IconDotsVertical,
  IconRefresh,
  IconSettings,
  IconTrash,
  IconExternalLink,
  IconLoader2,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
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

type SourceStatus = "active" | "inactive" | "error" | "testing"
type SourceCategory = "api" | "database" | "cloud" | "file"

interface SourceType {
  id: string
  name: string
  description: string
  category: SourceCategory
  icon: React.ElementType
  popular: boolean
  authTypes: string[]
  documentation: string
}

// Source Types Catalog (templates)
const sourceTypesCatalog: SourceType[] = [
  {
    id: "rest-api",
    name: "REST API",
    description: "Connect to any REST API endpoint with custom authentication",
    category: "api",
    icon: IconApi,
    popular: true,
    authTypes: ["API Key", "Bearer Token", "OAuth 2.0", "Basic Auth"],
    documentation: "https://docs.example.com/rest-api",
  },
  {
    id: "graphql",
    name: "GraphQL API",
    description: "Query GraphQL endpoints with custom queries and mutations",
    category: "api",
    icon: IconApi,
    popular: false,
    authTypes: ["API Key", "Bearer Token", "OAuth 2.0"],
    documentation: "https://docs.example.com/graphql",
  },
  {
    id: "github",
    name: "GitHub API",
    description: "Access repositories, issues, pull requests, and more",
    category: "api",
    icon: IconBrandGithub,
    popular: true,
    authTypes: ["Personal Access Token", "OAuth App", "GitHub App"],
    documentation: "https://docs.github.com/rest",
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Website and app analytics data from Google Analytics 4",
    category: "api",
    icon: IconBrandGoogle,
    popular: true,
    authTypes: ["OAuth 2.0", "Service Account"],
    documentation: "https://developers.google.com/analytics",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Payment processing and subscription management data",
    category: "api",
    icon: IconBrandStripe,
    popular: true,
    authTypes: ["Secret Key", "Restricted Key"],
    documentation: "https://stripe.com/docs/api",
  },
  {
    id: "slack",
    name: "Slack API",
    description: "Messages, channels, users, and workspace data",
    category: "api",
    icon: IconBrandSlack,
    popular: false,
    authTypes: ["OAuth 2.0", "Bot Token"],
    documentation: "https://api.slack.com",
  },
  {
    id: "mysql",
    name: "MySQL",
    description: "MySQL relational database connection",
    category: "database",
    icon: IconDatabase,
    popular: true,
    authTypes: ["Password", "SSL Certificate"],
    documentation: "https://dev.mysql.com/doc/",
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    description: "PostgreSQL database with advanced SQL features",
    category: "database",
    icon: IconDatabase,
    popular: true,
    authTypes: ["Password", "SSL Certificate", "SCRAM-SHA-256"],
    documentation: "https://www.postgresql.org/docs/",
  },
  {
    id: "aws-s3",
    name: "AWS S3",
    description: "Amazon S3 object storage buckets",
    category: "cloud",
    icon: IconCloud,
    popular: true,
    authTypes: ["Access Key", "IAM Role", "Temporary Credentials"],
    documentation: "https://docs.aws.amazon.com/s3/",
  },
  {
    id: "sftp",
    name: "SFTP",
    description: "Secure file transfer protocol for file storage",
    category: "file",
    icon: IconFile,
    popular: false,
    authTypes: ["Password", "SSH Key"],
    documentation: "https://www.ssh.com/academy/ssh/sftp",
  },
]

const statusConfig: Record<SourceStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  active: { label: "Active", variant: "default", color: "text-green-500" },
  error: { label: "Error", variant: "destructive", color: "text-red-500" },
  inactive: { label: "Inactive", variant: "secondary", color: "text-gray-500" },
  testing: { label: "Testing", variant: "outline", color: "text-blue-500" },
}

// Helper function to get icon for connection type
function getIconForType(type: string): React.ElementType {
  const lowerType = type.toLowerCase()
  if (lowerType.includes('mysql')) return IconDatabase
  if (lowerType.includes('postgres')) return IconDatabase
  if (lowerType.includes('s3') || lowerType.includes('aws')) return IconCloud
  if (lowerType.includes('sftp') || lowerType.includes('ftp')) return IconFile
  if (lowerType.includes('github')) return IconBrandGithub
  if (lowerType.includes('google')) return IconBrandGoogle
  if (lowerType.includes('stripe')) return IconBrandStripe
  if (lowerType.includes('slack')) return IconBrandSlack
  if (lowerType.includes('api') || lowerType.includes('rest') || lowerType.includes('graphql')) return IconApi
  return IconDatabase
}

// Helper function to get category for connection type
function getCategoryForType(type: string): SourceCategory {
  const lowerType = type.toLowerCase()
  if (lowerType.includes('mysql') || lowerType.includes('postgres') || lowerType.includes('database')) return 'database'
  if (lowerType.includes('s3') || lowerType.includes('aws') || lowerType.includes('gcs') || lowerType.includes('cloud')) return 'cloud'
  if (lowerType.includes('sftp') || lowerType.includes('ftp') || lowerType.includes('file')) return 'file'
  return 'api'
}

export default function SourcesPage() {
  const { currentWorkspace } = useWorkspace()
  const [sources, setSources] = useState<Connection[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [isConfigureDialogOpen, setIsConfigureDialogOpen] = useState(false)
  const [selectedSourceType, setSelectedSourceType] = useState<SourceType | null>(null)
  const [catalogSearchQuery, setCatalogSearchQuery] = useState("")
  const [catalogCategory, setCatalogCategory] = useState<string>("all")
  const [editingSource, setEditingSource] = useState<Connection | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    host: "",
    port: "",
    database: "",
    username: "",
    password: "",
    ssl: false,
    config: {} as Record<string, any>,
  })

  useEffect(() => {
    loadSources()
  }, [currentWorkspace])

  async function loadSources() {
    if (!currentWorkspace) return

    try {
      setIsFetching(true)
      const data = await integrationApi.getConnections()
      setSources(data)
    } catch (error: any) {
      console.error('Failed to load sources:', error)
      toast.error(error.message || 'Failed to load sources')
    } finally {
      setIsFetching(false)
    }
  }

  const filteredSources = sources.filter((source) => {
    const matchesSearch = source.name.toLowerCase().includes(searchQuery.toLowerCase())
    const category = getCategoryForType(source.type)
    const matchesCategory = selectedCategory === "all" || category === selectedCategory
    const matchesStatus = statusFilter === "all" || source.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const filteredCatalog = sourceTypesCatalog.filter((source) => {
    const matchesSearch = source.name.toLowerCase().includes(catalogSearchQuery.toLowerCase()) ||
      source.description.toLowerCase().includes(catalogSearchQuery.toLowerCase())
    const matchesCategory = catalogCategory === "all" || source.category === catalogCategory
    return matchesSearch && matchesCategory
  })

  const stats = {
    total: sources.length,
    active: sources.filter(s => s.status === "active").length,
    error: sources.filter(s => s.status === "error").length,
    api: sources.filter(s => getCategoryForType(s.type) === "api").length,
  }

  const handleSelectSourceType = (sourceType: SourceType) => {
    setSelectedSourceType(sourceType)
    setEditingSource(null)
    setFormData({
      name: "",
      description: "",
      type: sourceType.id,
      host: "",
      port: "",
      database: "",
      username: "",
      password: "",
      ssl: false,
      config: {},
    })
    setIsCatalogOpen(false)
    setIsConfigureDialogOpen(true)
  }

  const handleEditSource = (source: Connection) => {
    const sourceType = sourceTypesCatalog.find(st => st.id === source.type || st.name.toLowerCase() === source.type.toLowerCase())
    setSelectedSourceType(sourceType || null)
    setEditingSource(source)
    setFormData({
      name: source.name,
      description: "",
      type: source.type,
      host: source.host || "",
      port: source.port?.toString() || "",
      database: source.database || "",
      username: source.username || "",
      password: "",
      ssl: source.ssl || false,
      config: source.config || {},
    })
    setIsConfigureDialogOpen(true)
  }

  const handleCreateOrUpdateSource = async () => {
    if (!selectedSourceType || !formData.name.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      if (editingSource) {
        // Update existing source
        const updateData: Partial<Connection> = {
          name: formData.name,
          type: formData.type,
        }

        if (selectedSourceType.category === 'database' || selectedSourceType.category === 'file') {
          updateData.host = formData.host
          updateData.port = formData.port
          updateData.database = formData.database
          updateData.username = formData.username
          if (formData.password) {
            (updateData as any).password = formData.password
          }
          updateData.ssl = formData.ssl
        }

        updateData.config = formData.config

        await integrationApi.updateConnection(editingSource.id, updateData)
        toast.success('Source updated successfully')
      } else {
        // Create new source
        const createData: CreateConnectionData = {
          name: formData.name,
          type: formData.type,
          host: formData.host,
          port: formData.port,
          database: formData.database,
          username: formData.username,
          password: formData.password,
          ssl: formData.ssl,
          config: formData.config,
        }

        await integrationApi.createConnection(createData)
        toast.success('Source created successfully')
      }

      await loadSources()
      setIsConfigureDialogOpen(false)
      setFormData({
        name: "",
        description: "",
        type: "",
        host: "",
        port: "",
        database: "",
        username: "",
        password: "",
        ssl: false,
        config: {},
      })
      setEditingSource(null)
    } catch (error: any) {
      console.error('Failed to create/update source:', error)
      toast.error(error.message || 'Failed to save source')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSource = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      await integrationApi.deleteConnection(id)
      toast.success('Source deleted successfully')
      await loadSources()
    } catch (error: any) {
      console.error('Failed to delete source:', error)
      toast.error(error.message || 'Failed to delete source')
    }
  }

  const handleTestConnection = async (id: string, name: string) => {
    try {
      // Update status to testing
      setSources(sources => sources.map(s => s.id === id ? { ...s, status: 'testing' as const } : s))

      const result = await integrationApi.testConnection(id)

      if (result.success) {
        toast.success(`Connection to "${name}" successful`)
      } else {
        toast.error(`Connection failed: ${result.message}`)
      }

      await loadSources()
    } catch (error: any) {
      console.error('Failed to test connection:', error)
      toast.error(error.message || 'Failed to test connection')
      await loadSources()
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Sources</h1>
          <p className="text-sm text-muted-foreground">
            Connect and manage your data source instances
          </p>
        </div>
        <Button onClick={() => setIsCatalogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Add Source
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Total Sources</div>
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
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Error</div>
            <div className="text-xl font-bold text-red-500">{stats.error}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">API Sources</div>
            <div className="text-xl font-bold">{stats.api}</div>
          </CardContent>
        </Card>
      </div>

      {/* Configured Sources */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search sources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="api">APIs</SelectItem>
                  <SelectItem value="database">Databases</SelectItem>
                  <SelectItem value="cloud">Cloud Storage</SelectItem>
                  <SelectItem value="file">File Systems</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={loadSources} disabled={isFetching}>
                <IconRefresh className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {isFetching ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconDatabase className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No sources found</p>
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {filteredSources.map((source) => {
                const SourceIcon = getIconForType(source.type)
                const category = getCategoryForType(source.type)
                return (
                  <Card key={source.id}>
                    <CardContent className="p-2">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-start gap-2">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <SourceIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm line-clamp-1">{source.name}</h3>
                            <p className="text-xs text-muted-foreground">{source.type}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <IconDotsVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditSource(source)}>
                              <IconSettings className="mr-2 h-4 w-4" />
                              Edit Source
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTestConnection(source.id, source.name)}>
                              <IconRefresh className="mr-2 h-4 w-4" />
                              Test Connection
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteSource(source.id, source.name)}>
                              <IconTrash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {source.host && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                          {source.host}{source.port ? `:${source.port}` : ''}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant={statusConfig[source.status as SourceStatus].variant} className="text-xs">
                          {statusConfig[source.status as SourceStatus].label}
                        </Badge>
                        <span className="text-muted-foreground">
                          {source.last_tested ? new Date(source.last_tested).toLocaleDateString() : 'Never tested'}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                        Category: {category}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Catalog Dialog */}
      <Dialog open={isCatalogOpen} onOpenChange={(open) => !open && setIsCatalogOpen(false)} modal>
        <DialogContent className="!w-[96vw] !h-[96vh] !max-w-none overflow-hidden flex flex-col p-0" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle className="text-2xl">Browse Data Sources</DialogTitle>
            <DialogDescription>
              Select a source type to configure a new instance
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 min-h-0 overflow-hidden flex-1 flex flex-col">
            <Tabs value={catalogCategory} onValueChange={setCatalogCategory} className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between gap-4 mb-4 flex-shrink-0">
                <TabsList>
                  <TabsTrigger value="all">All Sources</TabsTrigger>
                  <TabsTrigger value="api">APIs</TabsTrigger>
                  <TabsTrigger value="database">Databases</TabsTrigger>
                  <TabsTrigger value="cloud">Cloud Storage</TabsTrigger>
                  <TabsTrigger value="file">File Systems</TabsTrigger>
                </TabsList>
                <div className="relative w-80">
                  <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search source types..."
                    value={catalogSearchQuery}
                    onChange={(e) => setCatalogSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
                  {filteredCatalog.map((sourceType) => {
                    const TypeIcon = sourceType.icon
                    return (
                      <Card key={sourceType.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <TypeIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg leading-tight">{sourceType.name}</h3>
                                {sourceType.popular && (
                                  <Badge variant="secondary" className="text-xs">Popular</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                {sourceType.category}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {sourceType.description}
                          </p>
                          <div className="mb-3">
                            <p className="text-xs text-muted-foreground mb-1">Authentication</p>
                            <div className="flex flex-wrap gap-1">
                              {sourceType.authTypes.slice(0, 3).map((auth, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {auth}
                                </Badge>
                              ))}
                              {sourceType.authTypes.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{sourceType.authTypes.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" asChild>
                              <a href={sourceType.documentation} target="_blank" rel="noopener noreferrer">
                                <IconExternalLink className="mr-1 h-3 w-3" />
                                Docs
                              </a>
                            </Button>
                            <Button size="sm" className="flex-1" onClick={() => handleSelectSourceType(sourceType)}>
                              <IconPlus className="mr-1 h-3 w-3" />
                              Add
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Configure Source Dialog */}
      <Dialog open={isConfigureDialogOpen} onOpenChange={(open) => !open && setIsConfigureDialogOpen(false)} modal>
        <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingSource ? 'Edit' : 'Configure'} {selectedSourceType?.name} Source</DialogTitle>
            <DialogDescription>
              {editingSource ? 'Update the source configuration' : `Set up a new ${selectedSourceType?.name} source. Give it a unique name to identify this instance.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="source-name">Source Name *</Label>
              <Input
                id="source-name"
                placeholder={`e.g., Production ${selectedSourceType?.name}`}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {selectedSourceType?.category === "database" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="db-host">Host *</Label>
                    <Input
                      id="db-host"
                      placeholder="localhost"
                      value={formData.host}
                      onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="db-port">Port</Label>
                    <Input
                      id="db-port"
                      placeholder="3306"
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="db-name">Database Name</Label>
                  <Input
                    id="db-name"
                    placeholder="my_database"
                    value={formData.database}
                    onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="db-user">Username</Label>
                    <Input
                      id="db-user"
                      placeholder="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="db-password">Password</Label>
                    <Input
                      id="db-password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {selectedSourceType?.category === "api" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="api-url">API Base URL *</Label>
                  <Input
                    id="api-url"
                    placeholder="https://api.example.com/v1"
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="api-key">API Key / Token</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Enter your API key or token"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </>
            )}

            {selectedSourceType?.category === "cloud" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="cloud-region">Region</Label>
                  <Input
                    id="cloud-region"
                    placeholder="us-east-1"
                    value={formData.config.region || ''}
                    onChange={(e) => setFormData({ ...formData, config: { ...formData.config, region: e.target.value } })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bucket-name">Bucket / Container Name *</Label>
                  <Input
                    id="bucket-name"
                    placeholder="my-bucket"
                    value={formData.database}
                    onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="access-key">Access Key *</Label>
                    <Input
                      id="access-key"
                      placeholder="Access key"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="secret-key">Secret Key *</Label>
                    <Input
                      id="secret-key"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {selectedSourceType?.category === "file" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="file-host">Host *</Label>
                  <Input
                    id="file-host"
                    placeholder="sftp.example.com"
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="file-port">Port</Label>
                    <Input
                      id="file-port"
                      placeholder="22"
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="file-path">Base Path</Label>
                    <Input
                      id="file-path"
                      placeholder="/data"
                      value={formData.database}
                      onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="file-user">Username</Label>
                    <Input
                      id="file-user"
                      placeholder="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="file-password">Password</Label>
                    <Input
                      id="file-password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigureDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrUpdateSource} disabled={!formData.name.trim() || isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingSource ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingSource ? 'Update Source' : 'Create Source'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
