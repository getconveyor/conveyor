"use client"

import { useState } from "react"
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconRefresh,
  IconShield,
  IconTrash,
  IconEdit,
  IconEye,
  IconToggleLeft,
  IconToggleRight,
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

interface Policy {
  id: string
  name: string
  description: string
  type: string
  status: "active" | "inactive"
  scope: string
  rules: number
  createdBy: string
  createdAt: string
  lastModified: string
}

const initialPolicies: Policy[] = [
  {
    id: "1",
    name: "PII Data Access Control",
    description: "Restrict access to personally identifiable information",
    type: "Access Control",
    status: "active",
    scope: "customer_data.*",
    rules: 5,
    createdBy: "Jane Smith",
    createdAt: "2 weeks ago",
    lastModified: "2 hours ago",
  },
  {
    id: "2",
    name: "Data Retention Policy",
    description: "Automatically archive data after 90 days",
    type: "Retention",
    status: "active",
    scope: "analytics.*",
    rules: 3,
    createdBy: "John Doe",
    createdAt: "1 month ago",
    lastModified: "1 week ago",
  },
  {
    id: "3",
    name: "Data Masking for Non-Prod",
    description: "Mask sensitive fields in non-production environments",
    type: "Masking",
    status: "active",
    scope: "*.staging",
    rules: 8,
    createdBy: "Sarah Wilson",
    createdAt: "3 weeks ago",
    lastModified: "3 days ago",
  },
  {
    id: "4",
    name: "Audit Logging",
    description: "Log all access to financial data",
    type: "Audit",
    status: "inactive",
    scope: "finance.*",
    rules: 2,
    createdBy: "Mike Johnson",
    createdAt: "2 months ago",
    lastModified: "1 month ago",
  },
]

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>(initialPolicies)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [policyToDelete, setPolicyToDelete] = useState<string | null>(null)
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "Access Control",
    scope: "",
  })

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch = policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || policy.type === typeFilter
    return matchesSearch && matchesType
  })

  const stats = {
    total: policies.length,
    active: policies.filter(p => p.status === "active").length,
    inactive: policies.filter(p => p.status === "inactive").length,
    totalRules: policies.reduce((acc, p) => acc + p.rules, 0),
  }

  const handleCreatePolicy = async () => {
    if (!formData.name.trim()) return

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))

    const newPolicy: Policy = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      type: formData.type,
      status: "active",
      scope: formData.scope,
      rules: 1,
      createdBy: "Current User",
      createdAt: "Just now",
      lastModified: "Just now",
    }

    setPolicies([newPolicy, ...policies])
    setIsLoading(false)
    setIsCreateDialogOpen(false)
    resetForm()
  }

  const handleEditPolicy = async () => {
    if (!selectedPolicy || !formData.name.trim()) return

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 800))

    setPolicies(policies =>
      policies.map(p =>
        p.id === selectedPolicy.id
          ? { ...p, name: formData.name, description: formData.description, type: formData.type, scope: formData.scope, lastModified: "Just now" }
          : p
      )
    )
    setIsLoading(false)
    setIsEditDialogOpen(false)
    setSelectedPolicy(null)
    resetForm()
  }

  const handleTogglePolicy = async (policy: Policy) => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 600))

    setPolicies(policies =>
      policies.map(p =>
        p.id === policy.id
          ? { ...p, status: p.status === "active" ? "inactive" : "active", lastModified: "Just now" }
          : p
      )
    )
    setIsLoading(false)
  }

  const handleDeletePolicy = async () => {
    if (!policyToDelete) return

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 600))

    setPolicies(policies => policies.filter(p => p.id !== policyToDelete))
    setIsLoading(false)
    setPolicyToDelete(null)
  }

  const openEditDialog = (policy: Policy) => {
    setSelectedPolicy(policy)
    setFormData({
      name: policy.name,
      description: policy.description,
      type: policy.type,
      scope: policy.scope,
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "Access Control",
      scope: "",
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Policies</h1>
          <p className="text-sm text-muted-foreground">
            Define and manage data governance policies
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Create Policy
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Total Policies</div>
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
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Total Rules</div>
            <div className="text-xl font-bold">{stats.totalRules}</div>
          </CardContent>
        </Card>
      </div>

      {/* Policies List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search policies..."
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
                  <SelectItem value="Access Control">Access Control</SelectItem>
                  <SelectItem value="Retention">Retention</SelectItem>
                  <SelectItem value="Masking">Masking</SelectItem>
                  <SelectItem value="Audit">Audit</SelectItem>
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
            {filteredPolicies.map((policy) => (
              <Card key={policy.id}>
                <CardContent className="p-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <IconShield className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">{policy.name}</h3>
                        <Badge variant={policy.status === "active" ? "default" : "secondary"} className="text-xs">
                          {policy.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {policy.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {policy.description}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Scope</p>
                          <p className="font-medium font-mono">{policy.scope}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Rules</p>
                          <p className="font-medium">{policy.rules}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Created By</p>
                          <p className="font-medium">{policy.createdBy}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Created</p>
                          <p className="font-medium">{policy.createdAt}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Modified</p>
                          <p className="font-medium">{policy.lastModified}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleTogglePolicy(policy)}
                        disabled={isLoading}
                      >
                        {policy.status === "active" ? (
                          <><IconToggleRight className="h-3.5 w-3.5 mr-1" />Disable</>
                        ) : (
                          <><IconToggleLeft className="h-3.5 w-3.5 mr-1" />Enable</>
                        )}
                      </Button>
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
                          <DropdownMenuItem onClick={() => openEditDialog(policy)}>
                            <IconEdit className="mr-2 h-4 w-4" />
                            Edit Policy
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setPolicyToDelete(policy.id)}
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

      {/* Create Policy Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { if (!open) { setIsCreateDialogOpen(false); resetForm() }}} modal>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Create Policy</DialogTitle>
            <DialogDescription>Define a new data governance policy</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="policy-name">Policy Name</Label>
              <Input id="policy-name" placeholder="e.g., PII Access Control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Policy Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Access Control">Access Control</SelectItem>
                  <SelectItem value="Retention">Data Retention</SelectItem>
                  <SelectItem value="Masking">Data Masking</SelectItem>
                  <SelectItem value="Audit">Audit Logging</SelectItem>
                  <SelectItem value="Quality">Data Quality</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="scope">Scope Pattern</Label>
              <Input id="scope" placeholder="e.g., customer_data.*" value={formData.scope} onChange={(e) => setFormData({ ...formData, scope: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe the policy..." rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm() }} disabled={isLoading}>Cancel</Button>
            <Button onClick={handleCreatePolicy} disabled={!formData.name.trim() || isLoading}>
              {isLoading ? <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Policy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Policy Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { if (!open) { setIsEditDialogOpen(false); setSelectedPolicy(null); resetForm() }}} modal>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit Policy</DialogTitle>
            <DialogDescription>Update policy information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-policy-name">Policy Name</Label>
              <Input id="edit-policy-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-type">Policy Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger id="edit-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Access Control">Access Control</SelectItem>
                  <SelectItem value="Retention">Data Retention</SelectItem>
                  <SelectItem value="Masking">Data Masking</SelectItem>
                  <SelectItem value="Audit">Audit Logging</SelectItem>
                  <SelectItem value="Quality">Data Quality</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-scope">Scope Pattern</Label>
              <Input id="edit-scope" value={formData.scope} onChange={(e) => setFormData({ ...formData, scope: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedPolicy(null); resetForm() }} disabled={isLoading}>Cancel</Button>
            <Button onClick={handleEditPolicy} disabled={!formData.name.trim() || isLoading}>
              {isLoading ? <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!policyToDelete} onOpenChange={(open) => !open && setPolicyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Policy?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this policy and all its rules. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePolicy} disabled={isLoading}>
              {isLoading ? <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : "Delete Policy"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
