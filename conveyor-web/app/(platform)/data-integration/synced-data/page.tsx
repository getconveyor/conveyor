"use client";

import { useState, useEffect } from "react";
import {
  IconPlus,
  IconSearch,
  IconRefresh,
  IconSettings,
  IconTrash,
  IconDatabase,
  IconDotsVertical,
  IconCheck,
  IconX,
  IconLoader2,
  IconDownload,
} from "@tabler/icons-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  useDataSources,
  useSyncDataSource,
  useDeleteDataSource,
} from "@/hooks/use-integration";
import { DataSource } from "@/lib/api/integration";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatDistanceToNow } from "date-fns";

type DataSourceStatus = "active" | "inactive" | "error" | "syncing";

const statusConfig: Record<
  DataSourceStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    color: string;
  }
> = {
  active: { label: "Active", variant: "default", color: "text-green-500" },
  inactive: { label: "Inactive", variant: "outline", color: "text-gray-500" },
  error: { label: "Error", variant: "destructive", color: "text-red-500" },
  syncing: { label: "Syncing", variant: "secondary", color: "text-blue-500" },
};

export default function SyncedDataPage() {
  const { currentWorkspace } = useWorkspace();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dataSourceToDelete, setDataSourceToDelete] = useState<string | null>(
    null
  );
  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Use hooks instead of manual loading
  const {
    data: dataSourcesData = [],
    isLoading: dataSourcesLoading,
    error: dataSourcesError,
    refetch: refetchDataSources,
  } = useDataSources();
  const syncMutation = useSyncDataSource();
  const deleteMutation = useDeleteDataSource();

  // Update local state when hook data changes
  useEffect(() => {
    setDataSources(dataSourcesData);
    setIsFetching(dataSourcesLoading);
    if (dataSourcesError) {
      toast.error("Failed to load data sources");
    }
  }, [dataSourcesData, dataSourcesLoading, dataSourcesError]);

  const filteredDataSources = dataSources.filter((ds) => {
    const matchesSearch =
      ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.source_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.source_type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ds.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: dataSources.length,
    active: dataSources.filter((d) => d.status === "active").length,
    syncing: dataSources.filter((d) => d.status === "syncing").length,
    error: dataSources.filter((d) => d.status === "error").length,
  };

  const handleSyncDataSource = async (id: string, name: string) => {
    setIsLoading(true);
    try {
      await syncMutation.mutateAsync(id);
      toast.success(`Sync started for "${name}"`);
    } catch (error: any) {
      console.error("Failed to sync data source:", error);
      toast.error(error.message || "Failed to sync data source");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDataSource = async () => {
    if (!dataSourceToDelete) return;

    setIsLoading(true);
    try {
      await deleteMutation.mutateAsync(dataSourceToDelete);
      toast.success("Data source deleted successfully");
      setDataSourceToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete data source:", error);
      toast.error(error.message || "Failed to delete data source");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Synced Data</h1>
          <p className="text-sm text-muted-foreground">
            Manage synced data from your sources
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Total
            </div>
            <div className="text-xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Active
            </div>
            <div className="text-xl font-bold text-green-500">
              {stats.active}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Syncing
            </div>
            <div className="text-xl font-bold text-blue-500">
              {stats.syncing}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Error
            </div>
            <div className="text-xl font-bold text-red-500">{stats.error}</div>
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
                  placeholder="Search data sources..."
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
                  <SelectItem value="syncing">Syncing</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetchDataSources()}
                disabled={isFetching}
              >
                <IconRefresh
                  className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {isFetching && dataSources.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <IconLoader2 className="h-6 w-6 animate-spin mr-2" />
              Loading synced data...
            </div>
          ) : filteredDataSources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <IconDatabase className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">No synced data found</p>
              <p className="text-xs mt-1">
                Create a pipeline to sync data from your sources
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDataSources.map((dataSource) => (
                <Card key={dataSource.id}>
                  <CardContent className="p-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-semibold text-sm">
                            {dataSource.name}
                          </h3>
                          <Badge
                            variant={statusConfig[dataSource.status].variant}
                            className="text-xs"
                          >
                            {statusConfig[dataSource.status].label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-2">
                          <div>
                            <p className="text-muted-foreground">Source</p>
                            <p className="font-medium">
                              {dataSource.source_name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Type</p>
                            <p className="font-medium">
                              {dataSource.source_type || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Records</p>
                            <p className="font-medium">
                              {dataSource.record_count || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Last Sync</p>
                            <p className="font-medium">
                              {dataSource.last_sync
                                ? formatDistanceToNow(
                                    new Date(dataSource.last_sync),
                                    { addSuffix: true }
                                  )
                                : "Never"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() =>
                            handleSyncDataSource(dataSource.id, dataSource.name)
                          }
                          disabled={isLoading}
                          title="Sync now"
                        >
                          {isLoading ? (
                            <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <IconDownload className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              disabled={isLoading}
                            >
                              <IconDotsVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled>
                              <IconSettings className="mr-2 h-4 w-4" />
                              Edit (Coming Soon)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                setDataSourceToDelete(dataSource.id)
                              }
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
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!dataSourceToDelete}
        onOpenChange={(open) => !open && setDataSourceToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Data Source</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this data source? This action
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDataSource}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
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
  );
}
