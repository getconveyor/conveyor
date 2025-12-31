"use client"

import { useState } from "react"
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconRefresh,
  IconKey,
  IconTrash,
  IconUser,
  IconUsers,
  IconDatabase,
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

interface AccessGrant {
  id: string
  principal: string
  principalType: "user" | "group"
  resource: string
  resourceType: string
  permission: string
  grantedBy: string
  grantedAt: string
  expiresAt: string
}

const initialGrants: AccessGrant[] = [
  {
    id: "1",
    principal: "jane.smith@company.com",
    principalType: "user",
    resource: "customer_profiles",
    resourceType: "Table",
    permission: "Read/Write",
    grantedBy: "Admin",
    grantedAt: "2 hours ago",
    expiresAt: "Never",
  },
  {
    id: "2",
    principal: "Data Analytics Team",
    principalType: "group",
    resource: "sales_transactions",
    resourceType: "Table",
    permission: "Read",
    grantedBy: "Jane Smith",
    grantedAt: "1 day ago",
    expiresAt: "90 days",
  },
  {
    id: "3",
    principal: "john.doe@company.com",
    principalType: "user",
    resource: "production",
    resourceType: "Database",
    permission: "Admin",
    grantedBy: "Admin",
    grantedAt: "1 week ago",
    expiresAt: "Never",
  },
  {
    id: "4",
    principal: "Marketing Team",
    principalType: "group",
    resource: "customer_data",
    resourceType: "Schema",
    permission: "Read",
    grantedBy: "John Doe",
    grantedAt: "2 weeks ago",
    expiresAt: "30 days",
  },
  {
    id: "5",
    principal: "sarah.wilson@company.com",
    principalType: "user",
    resource: "analytics_events",
    resourceType: "Dataset",
    permission: "Read/Write",
    grantedBy: "Admin",
    grantedAt: "3 weeks ago",
    expiresAt: "Never",
  },
]

export default function AccessPage() {
  const [grants, setGrants] = useState<AccessGrant[]>(initialGrants)
  const [searchQuery, setSearchQuery] = useState("")
  const [principalTypeFilter, setPrincipalTypeFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false)
  const [grantToRevoke, setGrantToRevoke] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    principal: "",
    principalType: "user",
    resource: "",
    resourceType: "Table",
    permission: "Read",
  })

  const filteredGrants = grants.filter((grant) => {
    const matchesSearch = grant.principal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grant.resource.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = principalTypeFilter === "all" || grant.principalType === principalTypeFilter
    return matchesSearch && matchesType
  })

  const stats = {
    total: grants.length,
    users: grants.filter(g => g.principalType === "user").length,
    groups: grants.filter(g => g.principalType === "group").length,
    expiring: grants.filter(g => g.expiresAt !== "Never").length,
  }

  const handleGrantAccess = async () => {
    if (!formData.principal.trim() || !formData.resource.trim()) return

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))

    const newGrant: AccessGrant = {
      id: Date.now().toString(),
      principal: formData.principal,
      principalType: formData.principalType as "user" | "group",
      resource: formData.resource,
      resourceType: formData.resourceType,
      permission: formData.permission,
      grantedBy: "Current User",
      grantedAt: "Just now",
      expiresAt: "Never",
    }

    setGrants([newGrant, ...grants])
    setIsLoading(false)
    setIsGrantDialogOpen(false)
    resetForm()
  }

  const handleRevokeAccess = async () => {
    if (!grantToRevoke) return

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 600))

    setGrants(grants => grants.filter(g => g.id !== grantToRevoke))
    setIsLoading(false)
    setGrantToRevoke(null)
  }

  const resetForm = () => {
    setFormData({
      principal: "",
      principalType: "user",
      resource: "",
      resourceType: "Table",
      permission: "Read",
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Access Control</h1>
          <p className="text-sm text-muted-foreground">
            Manage data access permissions
          </p>
        </div>
        <Button onClick={() => setIsGrantDialogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Grant Access
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Total Grants</div>
            <div className="text-xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">User Grants</div>
            <div className="text-xl font-bold text-blue-500">{stats.users}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Group Grants</div>
            <div className="text-xl font-bold text-green-500">{stats.groups}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Expiring</div>
            <div className="text-xl font-bold text-orange-500">{stats.expiring}</div>
          </CardContent>
        </Card>
      </div>

      {/* Access Grants List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search grants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={principalTypeFilter} onValueChange={setPrincipalTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="group">Groups</SelectItem>
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
            {filteredGrants.map((grant) => (
              <Card key={grant.id}>
                <CardContent className="p-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <IconKey className="h-4 w-4 text-muted-foreground" />
                        <div className="flex items-center gap-2 flex-1">
                          {grant.principalType === "user" ? (
                            <IconUser className="h-3.5 w-3.5 text-blue-500" />
                          ) : (
                            <IconUsers className="h-3.5 w-3.5 text-green-500" />
                          )}
                          <h3 className="font-semibold text-sm">{grant.principal}</h3>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {grant.permission}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                        <IconDatabase className="h-3 w-3" />
                        <span>
                          {grant.resource} ({grant.resourceType})
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Granted By</p>
                          <p className="font-medium">{grant.grantedBy}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Granted</p>
                          <p className="font-medium">{grant.grantedAt}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Expires</p>
                          <p className="font-medium">{grant.expiresAt}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-medium capitalize">{grant.principalType}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
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
                            <IconKey className="mr-2 h-4 w-4" />
                            View Permissions
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setGrantToRevoke(grant.id)}
                          >
                            <IconTrash className="mr-2 h-4 w-4" />
                            Revoke Access
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

      {/* Grant Access Dialog */}
      <Dialog open={isGrantDialogOpen} onOpenChange={(open) => { if (!open) { setIsGrantDialogOpen(false); resetForm() }}} modal>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Grant Access</DialogTitle>
            <DialogDescription>Grant data access to a user or group</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="principal-type">Principal Type</Label>
              <Select value={formData.principalType} onValueChange={(value) => setFormData({ ...formData, principalType: value })}>
                <SelectTrigger id="principal-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="principal">
                {formData.principalType === "user" ? "User Email" : "Group Name"}
              </Label>
              <Input
                id="principal"
                placeholder={formData.principalType === "user" ? "user@company.com" : "Analytics Team"}
                value={formData.principal}
                onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resource-type">Resource Type</Label>
              <Select value={formData.resourceType} onValueChange={(value) => setFormData({ ...formData, resourceType: value })}>
                <SelectTrigger id="resource-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Database">Database</SelectItem>
                  <SelectItem value="Schema">Schema</SelectItem>
                  <SelectItem value="Table">Table</SelectItem>
                  <SelectItem value="Dataset">Dataset</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resource">Resource Name</Label>
              <Input
                id="resource"
                placeholder="e.g., customer_profiles"
                value={formData.resource}
                onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="permission">Permission Level</Label>
              <Select value={formData.permission} onValueChange={(value) => setFormData({ ...formData, permission: value })}>
                <SelectTrigger id="permission"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Read">Read</SelectItem>
                  <SelectItem value="Read/Write">Read/Write</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsGrantDialogOpen(false); resetForm() }} disabled={isLoading}>Cancel</Button>
            <Button onClick={handleGrantAccess} disabled={!formData.principal.trim() || !formData.resource.trim() || isLoading}>
              {isLoading ? <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" />Granting...</> : "Grant Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!grantToRevoke} onOpenChange={(open) => !open && setGrantToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Access?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently revoke this access grant. The user or group will no longer be able to access this resource.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeAccess} disabled={isLoading}>
              {isLoading ? <><IconLoader2 className="mr-2 h-4 w-4 animate-spin" />Revoking...</> : "Revoke Access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
