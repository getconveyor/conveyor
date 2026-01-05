"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconRefresh,
  IconDatabase,
  IconTrash,
  IconEdit,
  IconEye,
  IconTag,
  IconUser,
  IconLoader2,
  IconAlertCircle,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { governanceApi, DataAsset as ApiDataAsset } from "@/lib/api/governance";

interface DataAsset {
  id: string;
  name: string;
  type: string;
  description: string;
  owner: string;
  database: string;
  schema: string;
  tags: string[];
  sensitivity: string;
  lastModified: string;
  rowCount: string;
  size: string;
}

const mapApiAssetToDataAsset = (asset: ApiDataAsset): DataAsset => {
  return {
    id: asset.id,
    name: asset.name,
    type: asset.asset_type || "table",
    description: asset.description || "",
    owner: asset.owner_name || "Unknown",
    database: "default",
    schema: asset.schema_name || "public",
    tags:
      asset.tags_list ||
      (asset.tags ? asset.tags.split(",").map((t) => t.trim()) : []),
    sensitivity: "Medium",
    lastModified: asset.updated_at
      ? new Date(asset.updated_at).toLocaleString()
      : "Unknown",
    rowCount: "-",
    size: "-",
  };
};

export default function CatalogPage() {
  const [assets, setAssets] = useState<DataAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<DataAsset | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "Table",
    description: "",
    database: "",
    schema: "",
    owner: "",
  });

  const loadAssets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const apiAssets = await governanceApi.getAssets();
      setAssets(apiAssets.map(mapApiAssetToDataAsset));
    } catch (err) {
      console.error("Failed to load assets:", err);
      setError("Failed to load data catalog");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || asset.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: assets.length,
    tables: assets.filter((a) => a.type === "Table").length,
    datasets: assets.filter((a) => a.type === "Dataset").length,
    highSensitivity: assets.filter((a) => a.sensitivity === "High").length,
  };

  const handleCreateAsset = async () => {
    if (!formData.name.trim()) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newAsset: DataAsset = {
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type,
      description: formData.description,
      owner: formData.owner || "Current User",
      database: formData.database,
      schema: formData.schema,
      tags: [],
      sensitivity: "Low",
      lastModified: "Just now",
      rowCount: "0",
      size: "0 GB",
    };

    setAssets([newAsset, ...assets]);
    setIsLoading(false);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEditAsset = async () => {
    if (!selectedAsset || !formData.name.trim()) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    setAssets((assets) =>
      assets.map((a) =>
        a.id === selectedAsset.id
          ? {
              ...a,
              name: formData.name,
              description: formData.description,
              owner: formData.owner,
              database: formData.database,
              schema: formData.schema,
            }
          : a
      )
    );
    setIsLoading(false);
    setIsEditDialogOpen(false);
    setSelectedAsset(null);
    resetForm();
  };

  const handleDeleteAsset = async () => {
    if (!assetToDelete) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    setAssets((assets) => assets.filter((a) => a.id !== assetToDelete));
    setIsLoading(false);
    setAssetToDelete(null);
  };

  const openEditDialog = (asset: DataAsset) => {
    setSelectedAsset(asset);
    setFormData({
      name: asset.name,
      type: asset.type,
      description: asset.description,
      database: asset.database,
      schema: asset.schema,
      owner: asset.owner,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "Table",
      description: "",
      database: "",
      schema: "",
      owner: "",
    });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Catalog</h1>
          <p className="text-sm text-muted-foreground">
            Discover and manage data assets
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Total Assets
            </div>
            <div className="text-xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Tables
            </div>
            <div className="text-xl font-bold text-blue-500">
              {stats.tables}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Datasets
            </div>
            <div className="text-xl font-bold text-green-500">
              {stats.datasets}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              High Sensitivity
            </div>
            <div className="text-xl font-bold text-red-500">
              {stats.highSensitivity}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assets List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
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
                  <SelectItem value="Table">Tables</SelectItem>
                  <SelectItem value="Dataset">Datasets</SelectItem>
                  <SelectItem value="View">Views</SelectItem>
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
            {filteredAssets.map((asset) => (
              <Card key={asset.id}>
                <CardContent className="p-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <IconDatabase className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">{asset.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {asset.type}
                        </Badge>
                        <Badge
                          variant={
                            asset.sensitivity === "High"
                              ? "destructive"
                              : asset.sensitivity === "Medium"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {asset.sensitivity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {asset.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {asset.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            <IconTag className="h-2.5 w-2.5 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Database</p>
                          <p className="font-medium">{asset.database}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Schema</p>
                          <p className="font-medium">{asset.schema}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Owner</p>
                          <p className="font-medium flex items-center gap-1">
                            <IconUser className="h-3 w-3" />
                            {asset.owner}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Rows</p>
                          <p className="font-medium">{asset.rowCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Size</p>
                          <p className="font-medium">{asset.size}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Modified</p>
                          <p className="font-medium">{asset.lastModified}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={isLoading}
                          >
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
                          <DropdownMenuItem
                            onClick={() => openEditDialog(asset)}
                          >
                            <IconEdit className="mr-2 h-4 w-4" />
                            Edit Metadata
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <IconTag className="mr-2 h-4 w-4" />
                            Manage Tags
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setAssetToDelete(asset.id)}
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

      {/* Create Asset Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            resetForm();
          }
        }}
        modal
      >
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Add Data Asset</DialogTitle>
            <DialogDescription>
              Register a new data asset in the catalog
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="asset-name">Asset Name</Label>
              <Input
                id="asset-name"
                placeholder="e.g., customer_profiles"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Table">Table</SelectItem>
                  <SelectItem value="Dataset">Dataset</SelectItem>
                  <SelectItem value="View">View</SelectItem>
                  <SelectItem value="File">File</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="database">Database</Label>
                <Input
                  id="database"
                  placeholder="production"
                  value={formData.database}
                  onChange={(e) =>
                    setFormData({ ...formData, database: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="schema">Schema</Label>
                <Input
                  id="schema"
                  placeholder="public"
                  value={formData.schema}
                  onChange={(e) =>
                    setFormData({ ...formData, schema: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                placeholder="Current User"
                value={formData.owner}
                onChange={(e) =>
                  setFormData({ ...formData, owner: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the data asset..."
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAsset}
              disabled={!formData.name.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Asset"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsEditDialogOpen(false);
            setSelectedAsset(null);
            resetForm();
          }
        }}
        modal
      >
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Edit Asset Metadata</DialogTitle>
            <DialogDescription>Update data asset information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-asset-name">Asset Name</Label>
              <Input
                id="edit-asset-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-database">Database</Label>
                <Input
                  id="edit-database"
                  value={formData.database}
                  onChange={(e) =>
                    setFormData({ ...formData, database: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-schema">Schema</Label>
                <Input
                  id="edit-schema"
                  value={formData.schema}
                  onChange={(e) =>
                    setFormData({ ...formData, schema: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-owner">Owner</Label>
              <Input
                id="edit-owner"
                value={formData.owner}
                onChange={(e) =>
                  setFormData({ ...formData, owner: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedAsset(null);
                resetForm();
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditAsset}
              disabled={!formData.name.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!assetToDelete}
        onOpenChange={(open) => !open && setAssetToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Data Asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this asset from the catalog. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAsset} disabled={isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Asset"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
