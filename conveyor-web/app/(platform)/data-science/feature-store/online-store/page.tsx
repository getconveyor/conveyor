"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconRefresh,
  IconCloud,
  IconCloudUpload,
  IconSettings,
  IconTrash,
  IconLoader2,
  IconCheck,
  IconX,
  IconDatabase,
  IconAlertCircle,
  IconPlus,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Switch } from "@/components/ui/switch";
import {
  dataScienceApi,
  OnlineFeatureStore,
  FeatureGroup,
} from "@/lib/api/datascience";

export default function OnlineStorePage() {
  const [stores, setStores] = useState<OnlineFeatureStore[]>([]);
  const [featureGroups, setFeatureGroups] = useState<FeatureGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newStore, setNewStore] = useState({
    name: "",
    feature_group: "",
    redis_host: "localhost",
    redis_port: 6379,
    redis_db: 0,
    key_prefix: "",
    ttl_seconds: 86400, // 24 hours
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [storesData, groupsData] = await Promise.all([
        dataScienceApi.getOnlineFeatureStores(),
        dataScienceApi.getFeatureGroups(),
      ]);
      setStores(storesData || []);
      setFeatureGroups(groupsData || []);
    } catch (error) {
      console.error("Failed to load online stores:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStore = async () => {
    try {
      setCreating(true);
      await dataScienceApi.createOnlineFeatureStore(newStore);
      setShowCreateDialog(false);
      setNewStore({
        name: "",
        feature_group: "",
        redis_host: "localhost",
        redis_port: 6379,
        redis_db: 0,
        key_prefix: "",
        ttl_seconds: 86400,
        is_active: true,
      });
      await loadData();
    } catch (error) {
      console.error("Failed to create store:", error);
      alert("Failed to create online store. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleSyncStore = async (storeId: string, groupId: string) => {
    try {
      setSyncing(storeId);
      await dataScienceApi.syncOnlineFeatures(groupId);
      await loadData();
    } catch (error) {
      console.error("Failed to sync store:", error);
    } finally {
      setSyncing(null);
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    try {
      // TODO: Implement deleteOnlineFeatureStore API method
      // await dataScienceApi.deleteOnlineFeatureStore(storeId);
      console.log("Delete store not implemented yet:", storeId);
      // await loadData();
    } catch (error) {
      console.error("Failed to delete store:", error);
    }
  };

  const getGroupName = (groupId: string) => {
    const group = featureGroups.find((g) => g.id === groupId);
    return group?.name || "Unknown";
  };

  const getStatusBadge = (store: OnlineFeatureStore) => {
    if (!store.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (store.last_sync_at) {
      return (
        <Badge variant="default" className="bg-green-500">
          <IconCheck className="w-3 h-3 mr-1" />
          Synced
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <IconAlertCircle className="w-3 h-3 mr-1" />
        Never Synced
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/data-science/feature-store">
            <Button variant="ghost" size="icon">
              <IconArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Online Feature Store</h1>
            <p className="text-muted-foreground">
              Low-latency feature serving via Redis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <IconRefresh className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <IconPlus className="w-4 h-4 mr-2" />
                Add Online Store
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Configure Online Store</DialogTitle>
                <DialogDescription>
                  Set up Redis connection for online feature serving
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Store Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., customer_features_online"
                    value={newStore.name}
                    onChange={(e) =>
                      setNewStore({ ...newStore, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Feature Group</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={newStore.feature_group}
                    onChange={(e) =>
                      setNewStore({
                        ...newStore,
                        feature_group: e.target.value,
                      })
                    }
                  >
                    <option value="">Select feature group...</option>
                    {featureGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="redis_host">Redis Host</Label>
                    <Input
                      id="redis_host"
                      placeholder="localhost"
                      value={newStore.redis_host}
                      onChange={(e) =>
                        setNewStore({ ...newStore, redis_host: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="redis_port">Port</Label>
                    <Input
                      id="redis_port"
                      type="number"
                      value={newStore.redis_port}
                      onChange={(e) =>
                        setNewStore({
                          ...newStore,
                          redis_port: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="redis_db">Redis DB</Label>
                    <Input
                      id="redis_db"
                      type="number"
                      value={newStore.redis_db}
                      onChange={(e) =>
                        setNewStore({
                          ...newStore,
                          redis_db: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ttl_seconds">TTL (seconds)</Label>
                    <Input
                      id="ttl_seconds"
                      type="number"
                      value={newStore.ttl_seconds}
                      onChange={(e) =>
                        setNewStore({
                          ...newStore,
                          ttl_seconds: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="key_prefix">Key Prefix</Label>
                  <Input
                    id="key_prefix"
                    placeholder="features:"
                    value={newStore.key_prefix}
                    onChange={(e) =>
                      setNewStore({ ...newStore, key_prefix: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Prefix for Redis keys (e.g., features:customer:)
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Active</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable feature serving
                    </p>
                  </div>
                  <Switch
                    checked={newStore.is_active}
                    onCheckedChange={(checked) =>
                      setNewStore({ ...newStore, is_active: checked })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateStore}
                  disabled={
                    creating || !newStore.name || !newStore.feature_group
                  }
                >
                  {creating ? (
                    <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <IconCloud className="w-4 h-4 mr-2" />
                  )}
                  Create Store
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Online Stores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stores.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stores.filter((s) => s.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Synced Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {
                stores.filter((s) => {
                  if (!s.last_sync_at) return false;
                  const syncDate = new Date(s.last_sync_at);
                  const today = new Date();
                  return syncDate.toDateString() === today.toDateString();
                }).length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Never Synced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stores.filter((s) => !s.last_sync_at).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Online Stores Table */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Online Stores</CardTitle>
          <CardDescription>
            Redis configurations for feature serving
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stores.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <IconCloud className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No online stores configured</p>
              <p className="text-sm">
                Add an online store to enable low-latency feature serving
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Feature Group</TableHead>
                  <TableHead>Redis</TableHead>
                  <TableHead>TTL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">{store.name}</TableCell>
                    <TableCell>N/A</TableCell>
                    <TableCell className="font-mono text-sm">
                      {store.redis_host}:{store.redis_port}/{store.redis_db}
                    </TableCell>
                    <TableCell>
                      {Math.floor(store.default_ttl_seconds / 3600)}h
                    </TableCell>
                    <TableCell>{getStatusBadge(store)}</TableCell>
                    <TableCell>
                      {store.last_sync_at
                        ? new Date(store.last_sync_at).toLocaleString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncStore(store.id, "")}
                          disabled={syncing === store.id || !store.is_active}
                        >
                          {syncing === store.id ? (
                            <IconLoader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <IconCloudUpload className="w-4 h-4" />
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <IconTrash className="w-4 h-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Online Store
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{store.name}"?
                                This will not delete the underlying Redis data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteStore(store.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Usage Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Guide</CardTitle>
          <CardDescription>
            How to serve features from the online store
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Python SDK</h4>
            <pre className="p-4 bg-muted rounded-lg text-sm font-mono overflow-x-auto">
              {`from conveyor.features import get_online_features

# Get features for a single entity
features = get_online_features(
    feature_group="customer_features",
    entity_ids=["customer_123"],
    features=["total_spend", "avg_order_value", "days_since_last_order"]
)

# Get features for multiple entities (batch)
batch_features = get_online_features(
    feature_group="customer_features",
    entity_ids=["customer_123", "customer_456", "customer_789"],
    features=["total_spend", "avg_order_value"]
)`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">REST API</h4>
            <pre className="p-4 bg-muted rounded-lg text-sm font-mono overflow-x-auto">
              {`POST /api/v1/data-science/feature-groups/{id}/get-features/

{
  "entity_ids": ["customer_123"],
  "features": ["total_spend", "avg_order_value"],
  "source": "online"
}`}
            </pre>
          </div>

          <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg">
            <IconAlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">Best Practices</p>
              <ul className="mt-1 text-blue-700 list-disc list-inside">
                <li>
                  Use online store for real-time inference (p99 &lt; 10ms)
                </li>
                <li>Sync features after each materialization job completes</li>
                <li>
                  Set appropriate TTL based on feature freshness requirements
                </li>
                <li>Use offline store for batch inference and training</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
