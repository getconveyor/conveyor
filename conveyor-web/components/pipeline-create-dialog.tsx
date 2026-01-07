"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconLoader2,
  IconSearch,
  IconDatabase,
  IconTable,
  IconCheck,
  IconRefresh,
  IconAlertCircle,
  IconChevronRight,
  IconChevronDown,
  IconPlus,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  integrationApi,
  Source,
  StreamInfo,
  SourceSchema,
  CreatePipelineData,
} from "@/lib/api/integration";
import { getNamespaces, Namespace } from "@/lib/api/warehouse";
import { useSourceSchema, useCreatePipeline } from "@/hooks/use-integration";
import { cn } from "@/lib/utils";

interface PipelineCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: Source[];
  onSuccess: () => void;
}

type SyncMode = "selected" | "all";

interface SelectedStream {
  name: string;
  schema?: string;
  tableName: string; // Lakehouse table name
}

export function PipelineCreateDialog({
  open,
  onOpenChange,
  sources,
  onSuccess,
}: PipelineCreateDialogProps) {
  const { token, currentWorkspace } = useAuth();

  // Form state
  const [step, setStep] = useState<"config" | "tables">("config");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [trinoNamespace, setTrinoNamespace] = useState("iceberg");
  const [layer, setLayer] = useState("bronze");
  const [schemaNamespace, setSchemaNamespace] = useState("");
  const [schedule, setSchedule] = useState("");

  // Namespace state
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [isFetchingNamespaces, setIsFetchingNamespaces] = useState(false);

  // Use hooks instead of manual loading
  const {
    data: sourceSchema,
    isLoading: isDiscovering,
    error: schemaError,
  } = useSourceSchema(sourceId);
  const createPipelineMutation = useCreatePipeline();

  // Schema discovery state - now using hook
  const discoveredSchema = sourceSchema;
  const discoveryError = schemaError?.message || null;

  // Table selection state
  const [syncMode, setSyncMode] = useState<SyncMode>("selected");
  const [selectedStreams, setSelectedStreams] = useState<Set<string>>(
    new Set()
  );
  const [tableNameOverrides, setTableNameOverrides] = useState<
    Record<string, string>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(
    new Set()
  );

  // Fetch available namespaces when dialog opens
  const fetchNamespacesData = useCallback(async () => {
    setIsFetchingNamespaces(true);
    try {
      const allNamespaces = await getNamespaces();
      // Filter to only show Iceberg namespaces (not system namespaces)
      const icebergNamespaces = allNamespaces.filter(
        (c) => c.connector === "iceberg" && !c.is_system
      );
      setNamespaces(icebergNamespaces);

      // Set default namespace if available
      const defaultNamespace = icebergNamespaces.find((c) => c.is_default);
      if (defaultNamespace) {
        setTrinoNamespace(defaultNamespace.name);
      } else if (icebergNamespaces.length > 0) {
        setTrinoNamespace(icebergNamespaces[0].name);
      }
    } catch (error) {
      console.error("Failed to fetch namespaces:", error);
    } finally {
      setIsFetchingNamespaces(false);
    }
  }, []);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      fetchNamespacesData();
    } else {
      setStep("config");
      setName("");
      setDescription("");
      setSourceId("");
      setTrinoNamespace("iceberg");
      setLayer("bronze");
      setSchemaNamespace("");
      setSchedule("");
      setSelectedStreams(new Set());
      setTableNameOverrides({});
      setSearchQuery("");
      setSyncMode("selected");
    }
  }, [open, fetchNamespacesData]);

  // Group streams by schema
  const groupedStreams = discoveredSchema?.streams.reduce((acc, stream) => {
    const schemaName = stream.schema || "default";
    if (!acc[schemaName]) {
      acc[schemaName] = [];
    }
    acc[schemaName].push(stream);
    return acc;
  }, {} as Record<string, StreamInfo[]>);

  // Filter streams by search query
  const filteredGroups = groupedStreams
    ? Object.entries(groupedStreams).reduce((acc, [schema, streams]) => {
        const filtered = streams.filter(
          (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            schema.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filtered.length > 0) {
          acc[schema] = filtered;
        }
        return acc;
      }, {} as Record<string, StreamInfo[]>)
    : {};

  // Handle stream selection
  const toggleStream = (streamName: string) => {
    const newSelected = new Set(selectedStreams);
    if (newSelected.has(streamName)) {
      newSelected.delete(streamName);
    } else {
      newSelected.add(streamName);
    }
    setSelectedStreams(newSelected);
  };

  // Handle select all in schema
  const toggleSchemaStreams = (schemaName: string, streams: StreamInfo[]) => {
    const newSelected = new Set(selectedStreams);
    const allSelected = streams.every((s) => selectedStreams.has(s.name));

    if (allSelected) {
      streams.forEach((s) => newSelected.delete(s.name));
    } else {
      streams.forEach((s) => newSelected.add(s.name));
    }
    setSelectedStreams(newSelected);
  };

  // Handle select all
  const selectAll = () => {
    if (discoveredSchema) {
      setSelectedStreams(new Set(discoveredSchema.streams.map((s) => s.name)));
    }
  };

  // Handle deselect all
  const deselectAll = () => {
    setSelectedStreams(new Set());
  };

  // Get table name for a stream
  const getTableName = (streamName: string) => {
    return (
      tableNameOverrides[streamName] ||
      streamName.toLowerCase().replace(/[^a-z0-9_]/g, "_")
    );
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!name.trim() || !sourceId) {
      toast.error("Please fill in all required fields");
      return;
    }

    const streamsToSync =
      syncMode === "all"
        ? discoveredSchema?.streams.map((s) => s.name) || []
        : Array.from(selectedStreams);

    if (streamsToSync.length === 0) {
      toast.error("Please select at least one table to sync");
      return;
    }

    try {
      // Create pipeline with streams config
      const pipelineData: CreatePipelineData = {
        name,
        description,
        source: sourceId,
        destination: sourceId, // For lakehouse, we use same source ID
        schedule: schedule || undefined,
        config: {
          destination_type: "lakehouse",
          streams: streamsToSync,
          stream_configs: streamsToSync.reduce((acc, streamName) => {
            acc[streamName] = {
              table_name: getTableName(streamName),
              enabled: true,
            };
            return acc;
          }, {} as Record<string, any>),
          lakehouse: {
            namespace: trinoNamespace,
            layer,
            schema_namespace: schemaNamespace || "default",
            format: "iceberg",
            storage: "minio",
          },
        },
      };

      await createPipelineMutation.mutateAsync(pipelineData);
      toast.success(
        `Pipeline created with ${streamsToSync.length} table${
          streamsToSync.length > 1 ? "s" : ""
        }`
      );
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create pipeline";
      toast.error(message);
    }
  };

  // Move to table selection step
  const handleNextStep = useCallback(async () => {
    if (!name.trim()) {
      toast.error("Please enter a pipeline name");
      return;
    }
    if (!sourceId) {
      toast.error("Please select a source");
      return;
    }
    setStep("tables");

    // Auto-expand first schema if available when schema is loaded
    if (discoveredSchema) {
      const schemas = new Set(
        discoveredSchema.streams
          .map((s) => s.schema || "default")
          .filter(Boolean)
      );
      if (schemas.size > 0) {
        setExpandedSchemas(new Set([Array.from(schemas)[0]]));
      }
    }
  }, [name, sourceId, discoveredSchema]);

  const selectedSource = sources.find((s) => s.id === sourceId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!w-[80%] !max-w-none max-h-[90vh] overflow-hidden sm:!max-w-[80%]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {step === "config"
              ? "Create New Pipeline"
              : "Select Tables to Sync"}
          </DialogTitle>
          <DialogDescription>
            {step === "config"
              ? "Configure your pipeline settings."
              : `Select which tables to sync from ${
                  selectedSource?.name || "your source"
                } to the Lakehouse.`}
          </DialogDescription>
        </DialogHeader>

        {step === "config" ? (
          // Step 1: Basic configuration
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="pipeline-name">Pipeline Name *</Label>
              <Input
                id="pipeline-name"
                placeholder="e.g., Production Database Sync"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pipeline-description">Description</Label>
              <Textarea
                id="pipeline-description"
                placeholder="Describe what this pipeline does..."
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Source and Destination Configuration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="source">Source Connection *</Label>
                <Select value={sourceId} onValueChange={setSourceId}>
                  <SelectTrigger id="source">
                    <SelectValue placeholder="Select a source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        No sources available
                      </SelectItem>
                    ) : (
                      sources.map((source) => (
                        <SelectItem key={source.id} value={source.id}>
                          <div className="flex items-center gap-2">
                            <IconDatabase className="h-4 w-4" />
                            {source.name}
                            <Badge variant="outline" className="ml-1 text-xs">
                              {source.type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="namespace">Lakehouse Namespace *</Label>
                <Select
                  value={trinoNamespace}
                  onValueChange={setTrinoNamespace}
                  disabled={isFetchingNamespaces}
                >
                  <SelectTrigger id="namespace">
                    {isFetchingNamespaces ? (
                      <div className="flex items-center gap-2">
                        <IconLoader2 className="h-4 w-4 animate-spin" />
                        <span>Loading namespaces...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Select a namespace" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {namespaces.length === 0 ? (
                      <SelectItem value="iceberg">
                        <div className="flex items-center gap-2">
                          <IconDatabase className="h-4 w-4" />
                          iceberg (default)
                        </div>
                      </SelectItem>
                    ) : (
                      namespaces.map((ns) => (
                        <SelectItem key={ns.name} value={ns.name}>
                          <div className="flex items-center gap-2">
                            <IconDatabase className="h-4 w-4" />
                            {ns.name}
                            {ns.is_default && (
                              <Badge
                                variant="secondary"
                                className="ml-1 text-xs"
                              >
                                default
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Data will be stored in this Iceberg namespace
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="layer">Lakehouse Layer *</Label>
                <Select value={layer} onValueChange={setLayer}>
                  <SelectTrigger id="layer">
                    <SelectValue placeholder="Select layer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bronze">🥉 Bronze (Raw Data)</SelectItem>
                    <SelectItem value="silver">🥈 Silver (Cleaned)</SelectItem>
                    <SelectItem value="gold">🥇 Gold (Business)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="namespace">Namespace / Database</Label>
                <Input
                  id="namespace"
                  placeholder="e.g., sales, marketing (default: source name)"
                  value={schemaNamespace}
                  onChange={(e) =>
                    setSchemaNamespace(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_")
                    )
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="schedule">Schedule (Optional)</Label>
                <Input
                  id="schedule"
                  placeholder="e.g., @hourly, 0 */6 * * *"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : (
          // Step 2: Table selection
          <div className="flex flex-col gap-4 py-4 h-[60vh]">
            {/* Schema discovery status */}
            {isDiscovering && (
              <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/20">
                <IconLoader2 className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <p className="font-medium">Discovering Schema...</p>
                  <p className="text-sm text-muted-foreground">
                    Fetching available tables from{" "}
                    {selectedSource?.name || "the source"}
                  </p>
                </div>
              </div>
            )}

            {discoveredSchema && !isDiscovering && (
              <div className="flex items-center justify-between gap-4 text-sm bg-green-500/10 text-green-700 dark:text-green-400 p-3 rounded-md">
                <div className="flex items-center gap-2">
                  <IconCheck className="h-4 w-4" />
                  <span>
                    Found <strong>{discoveredSchema.streams.length}</strong>{" "}
                    tables across{" "}
                    <strong>
                      {
                        new Set(
                          discoveredSchema.streams.map(
                            (s) => s.schema || "default"
                          )
                        ).size
                      }
                    </strong>{" "}
                    schema(s)
                  </span>
                </div>
              </div>
            )}

            {/* Sync mode selection */}
            {discoveredSchema && !isDiscovering && (
              <>
                <div className="flex items-center gap-4 pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sync-all"
                      checked={syncMode === "all"}
                      onCheckedChange={(checked) =>
                        setSyncMode(checked ? "all" : "selected")
                      }
                    />
                    <Label
                      htmlFor="sync-all"
                      className="font-medium cursor-pointer"
                    >
                      Sync all tables ({discoveredSchema?.streams.length || 0})
                    </Label>
                  </div>

                  {syncMode === "selected" && (
                    <>
                      <div className="h-4 w-px bg-border" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={selectAll}
                        className="text-xs"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={deselectAll}
                        className="text-xs"
                      >
                        Deselect All
                      </Button>
                      <div className="ml-auto">
                        <Badge variant="secondary">
                          {selectedStreams.size} selected
                        </Badge>
                      </div>
                    </>
                  )}
                </div>

                {syncMode === "selected" && (
                  <>
                    {/* Search */}
                    <div className="relative">
                      <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tables..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    {/* Table list */}
                    <ScrollArea className="flex-1 border rounded-md min-h-0">
                      <div className="p-2 space-y-1 max-h-full">
                        {Object.entries(filteredGroups).map(
                          ([schema, streams]) => (
                            <Collapsible
                              key={schema}
                              open={expandedSchemas.has(schema)}
                              onOpenChange={(open) => {
                                const newExpanded = new Set(expandedSchemas);
                                if (open) {
                                  newExpanded.add(schema);
                                } else {
                                  newExpanded.delete(schema);
                                }
                                setExpandedSchemas(newExpanded);
                              }}
                            >
                              <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted/50 rounded-md">
                                {expandedSchemas.has(schema) ? (
                                  <IconChevronDown className="h-4 w-4" />
                                ) : (
                                  <IconChevronRight className="h-4 w-4" />
                                )}
                                <IconDatabase className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{schema}</span>
                                <Badge variant="outline" className="ml-auto">
                                  {streams.length} tables
                                </Badge>
                                <Checkbox
                                  checked={streams.every((s) =>
                                    selectedStreams.has(s.name)
                                  )}
                                  onCheckedChange={() =>
                                    toggleSchemaStreams(schema, streams)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="ml-6 space-y-1 mt-1">
                                  {streams.map((stream) => (
                                    <div
                                      key={stream.name}
                                      className={cn(
                                        "flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer",
                                        selectedStreams.has(stream.name) &&
                                          "bg-primary/5"
                                      )}
                                      onClick={() => toggleStream(stream.name)}
                                    >
                                      <Checkbox
                                        checked={selectedStreams.has(
                                          stream.name
                                        )}
                                        onCheckedChange={() =>
                                          toggleStream(stream.name)
                                        }
                                      />
                                      <IconTable className="h-4 w-4 text-muted-foreground" />
                                      <div className="flex-1">
                                        <span className="text-sm">
                                          {stream.name}
                                        </span>
                                        {stream.row_count !== undefined && (
                                          <span className="text-xs text-muted-foreground ml-2">
                                            (~
                                            {stream.row_count.toLocaleString()}{" "}
                                            rows)
                                          </span>
                                        )}
                                      </div>
                                      {selectedStreams.has(stream.name) && (
                                        <div className="text-xs text-muted-foreground">
                                          → {trinoNamespace}.{layer}.
                                          {schemaNamespace ||
                                            selectedSource?.name
                                              .toLowerCase()
                                              .replace(/[^a-z0-9_]/g, "_") ||
                                            "default"}
                                          .{getTableName(stream.name)}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          )
                        )}

                        {Object.keys(filteredGroups).length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No tables found matching your search
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </>
                )}

                {syncMode === "all" && (
                  <div className="flex-1 border rounded-md p-4 bg-muted/20">
                    <div className="flex items-center gap-2 mb-4">
                      <IconCheck className="h-5 w-5 text-green-500" />
                      <span className="font-medium">
                        All {discoveredSchema?.streams.length} tables will be
                        synced
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Each table will be synced to the{" "}
                      <strong>{trinoNamespace}</strong> namespace,{" "}
                      <strong>{layer}</strong> layer with its original name
                      converted to a valid Iceberg table name.
                    </p>
                    <div className="bg-background rounded-md p-3 text-sm font-mono">
                      <p className="text-muted-foreground mb-2">
                        Example paths:
                      </p>
                      {discoveredSchema?.streams.slice(0, 3).map((stream) => (
                        <p key={stream.name}>
                          {stream.name} → {trinoNamespace}.{layer}.
                          {schemaNamespace ||
                            selectedSource?.name
                              .toLowerCase()
                              .replace(/[^a-z0-9_]/g, "_") ||
                            "default"}
                          .{getTableName(stream.name)}
                        </p>
                      ))}
                      {(discoveredSchema?.streams.length || 0) > 3 && (
                        <p className="text-muted-foreground">
                          ... and {(discoveredSchema?.streams.length || 0) - 3}{" "}
                          more
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "tables" && (
            <Button
              variant="outline"
              onClick={() => setStep("config")}
              disabled={createPipelineMutation.isPending}
            >
              Back
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createPipelineMutation.isPending}
          >
            Cancel
          </Button>
          {step === "config" ? (
            <Button
              onClick={handleNextStep}
              disabled={!name.trim() || !sourceId}
            >
              Next: Select Tables
              <IconChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={
                createPipelineMutation.isPending ||
                (syncMode === "selected" && selectedStreams.size === 0)
              }
            >
              {createPipelineMutation.isPending ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Pipeline...
                </>
              ) : (
                <>
                  Create Pipeline
                  {syncMode === "selected" && selectedStreams.size > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedStreams.size} tables
                    </Badge>
                  )}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
