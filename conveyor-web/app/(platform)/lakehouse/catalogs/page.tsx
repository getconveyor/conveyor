"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Database,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  getCatalogs,
  createCatalog,
  deleteCatalog,
  Catalog,
} from "@/lib/api/warehouse";

export default function CatalogsPage() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [newCatalogName, setNewCatalogName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCatalogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const catalogsList = await getCatalogs();
      setCatalogs(catalogsList);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load catalogs";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  const handleCreateCatalog = async () => {
    if (!newCatalogName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a catalog name",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const response = await createCatalog({
        name: newCatalogName.toLowerCase().trim(),
      });

      toast({
        title: "Catalog Created",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>{response.message}</span>
          </div>
        ),
      });

      setNewCatalogName("");
      setDialogOpen(false);
      fetchCatalogs();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to create catalog",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCatalog = async (catalogName: string) => {
    setDeleting(catalogName);
    try {
      const response = await deleteCatalog(catalogName);

      toast({
        title: "Catalog Deleted",
        description: response.message,
      });

      fetchCatalogs();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to delete catalog",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const getConnectorBadge = (connector: string) => {
    switch (connector) {
      case "iceberg":
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            Iceberg
          </Badge>
        );
      case "postgresql":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            PostgreSQL
          </Badge>
        );
      case "mysql":
        return (
          <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">
            MySQL
          </Badge>
        );
      default:
        return <Badge variant="secondary">{connector}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catalogs</h1>
          <p className="text-muted-foreground">
            Manage Trino catalogs for your data lakehouse projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchCatalogs} disabled={loading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Catalog
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Catalog</DialogTitle>
                <DialogDescription>
                  Create a new Iceberg catalog for your project. Each catalog is
                  a separate namespace for your tables and schemas.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Catalog Name</Label>
                  <Input
                    id="name"
                    placeholder="my_project"
                    value={newCatalogName}
                    onChange={(e) => setNewCatalogName(e.target.value)}
                    disabled={creating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use lowercase letters, numbers, and underscores. Must start
                    with a letter.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateCatalog} disabled={creating}>
                  {creating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Catalog
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Available Catalogs
          </CardTitle>
          <CardDescription>
            Catalogs define data sources in Trino. Iceberg catalogs store tables
            in your data lakehouse.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-destructive">{error}</p>
              <Button
                variant="outline"
                onClick={fetchCatalogs}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : catalogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Database className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No catalogs found</p>
              <p className="text-sm text-muted-foreground">
                Create your first catalog to start organizing your data
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Connector</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalogs.map((catalog) => (
                  <TableRow key={catalog.name}>
                    <TableCell className="font-medium">
                      {catalog.name}
                    </TableCell>
                    <TableCell>
                      {getConnectorBadge(catalog.connector)}
                    </TableCell>
                    <TableCell>
                      {catalog.is_default ? (
                        <Badge
                          variant="outline"
                          className="border-primary text-primary"
                        >
                          Default
                        </Badge>
                      ) : catalog.is_system ? (
                        <Badge variant="secondary">System</Badge>
                      ) : (
                        <Badge variant="outline">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!catalog.is_system &&
                        !catalog.is_default &&
                        catalog.name !== "postgres" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={deleting === catalog.name}
                              >
                                {deleting === catalog.name ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Catalog?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the &quot;
                                  {catalog.name}&quot; catalog? This action
                                  cannot be undone. Any tables in this catalog
                                  will become inaccessible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteCatalog(catalog.name)
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Catalog
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-5 w-5" />
            Important Note
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            After creating or deleting a catalog, you need to restart the Trino
            container for changes to take effect. Run the following command:
          </p>
          <code className="mt-2 block rounded bg-muted px-3 py-2 font-mono text-sm">
            docker restart conveyor-trino
          </code>
        </CardContent>
      </Card>
    </div>
  );
}
