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
  getNamespaces,
  createNamespace,
  deleteNamespace,
  Namespace,
} from "@/lib/api/warehouse";

export default function NamespacesPage() {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [newNamespaceName, setNewNamespaceName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchNamespaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const namespacesList = await getNamespaces();
      setNamespaces(namespacesList);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load namespaces";
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
    fetchNamespaces();
  }, [fetchNamespaces]);

  const handleCreateNamespace = async () => {
    if (!newNamespaceName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a namespace name",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const response = await createNamespace({
        name: newNamespaceName.toLowerCase().trim(),
      });

      toast({
        title: "Namespace Created",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>{response.message}</span>
          </div>
        ),
      });

      setNewNamespaceName("");
      setDialogOpen(false);
      fetchNamespaces();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to create namespace",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteNamespace = async (namespaceName: string) => {
    setDeleting(namespaceName);
    try {
      const response = await deleteNamespace(namespaceName);

      toast({
        title: "Namespace Deleted",
        description: response.message,
      });

      fetchNamespaces();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to delete namespace",
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
    <div className="flex-1 space-y-6 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Namespaces</h1>
          <p className="text-muted-foreground">
            Manage Trino namespaces for your data lakehouse projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchNamespaces}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Namespace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Namespace</DialogTitle>
                <DialogDescription>
                  Create a new Iceberg namespace for your project. Each
                  namespace is a separate area for your tables and schemas.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Namespace Name</Label>
                  <Input
                    id="name"
                    placeholder="my_project"
                    value={newNamespaceName}
                    onChange={(e) => setNewNamespaceName(e.target.value)}
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
                <Button onClick={handleCreateNamespace} disabled={creating}>
                  {creating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Namespace
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
            Available Namespaces
          </CardTitle>
          <CardDescription>
            Namespaces define data sources in Trino. Iceberg namespaces store
            tables in your data lakehouse.
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
                onClick={fetchNamespaces}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : namespaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Database className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No namespaces found</p>
              <p className="text-sm text-muted-foreground">
                Create your first namespace to start organizing your data
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
                {namespaces.map((namespace) => (
                  <TableRow key={namespace.name}>
                    <TableCell className="font-medium">
                      {namespace.name}
                    </TableCell>
                    <TableCell>
                      {getConnectorBadge(namespace.connector)}
                    </TableCell>
                    <TableCell>
                      {namespace.is_default ? (
                        <Badge
                          variant="outline"
                          className="border-primary text-primary"
                        >
                          Default
                        </Badge>
                      ) : namespace.is_system ? (
                        <Badge variant="secondary">System</Badge>
                      ) : (
                        <Badge variant="outline">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!namespace.is_system &&
                        !namespace.is_default &&
                        namespace.name !== "postgres" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={deleting === namespace.name}
                              >
                                {deleting === namespace.name ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Namespace?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the &quot;
                                  {namespace.name}&quot; namespace? This action
                                  cannot be undone. Any tables in this namespace
                                  will become inaccessible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteNamespace(namespace.name)
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Namespace
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
            After creating or deleting a namespace, you need to restart the
            Trino container for changes to take effect. Run the following
            command:
          </p>
          <code className="mt-2 block rounded bg-muted px-3 py-2 font-mono text-sm">
            docker restart conveyor-trino
          </code>
        </CardContent>
      </Card>
    </div>
  );
}
