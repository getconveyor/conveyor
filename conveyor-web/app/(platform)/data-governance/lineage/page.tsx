"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconSearch,
  IconRefresh,
  IconGitBranch,
  IconArrowRight,
  IconDatabase,
  IconTable,
  IconTransform,
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
import { governanceApi, LineageGraph } from "@/lib/api/governance";

interface LineageNode {
  id: string;
  name: string;
  type: "source" | "transformation" | "target";
  description: string;
  database?: string;
  schema?: string;
}

interface LineageRelationship {
  id: string;
  from: string;
  to: string;
  label: string;
}

export default function LineagePage() {
  const [lineageNodes, setLineageNodes] = useState<LineageNode[]>([]);
  const [lineageRelationships, setLineageRelationships] = useState<
    LineageRelationship[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLineage = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const lineageGraph = await governanceApi.getLineageGraph();

      // Map API response to local types
      const nodes: LineageNode[] =
        lineageGraph.nodes?.map((node: any) => ({
          id: node.id,
          name: node.name || node.id,
          type:
            node.type === "source"
              ? "source"
              : node.type === "target"
              ? "target"
              : "transformation",
          description: node.description || "",
          database: node.database,
          schema: node.schema,
        })) || [];

      const edges: LineageRelationship[] =
        lineageGraph.edges?.map((edge: any, index: number) => ({
          id: `edge-${index}`,
          from: edge.source || edge.from,
          to: edge.target || edge.to,
          label: edge.label || "transforms",
        })) || [];

      setLineageNodes(nodes);
      setLineageRelationships(edges);

      // Select first node if available
      if (nodes.length > 0 && !selectedNode) {
        setSelectedNode(nodes[0].id);
      }
    } catch (err) {
      console.error("Failed to load lineage:", err);
      setError("Failed to load data lineage");
    } finally {
      setIsLoading(false);
    }
  }, [selectedNode]);

  useEffect(() => {
    loadLineage();
  }, [loadLineage]);

  const filteredNodes = lineageNodes.filter((node) => {
    const matchesSearch =
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || node.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: lineageNodes.length,
    sources: lineageNodes.filter((n) => n.type === "source").length,
    transformations: lineageNodes.filter((n) => n.type === "transformation")
      .length,
    targets: lineageNodes.filter((n) => n.type === "target").length,
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "source":
        return <IconDatabase className="h-4 w-4 text-blue-500" />;
      case "transformation":
        return <IconTransform className="h-4 w-4 text-orange-500" />;
      case "target":
        return <IconTable className="h-4 w-4 text-green-500" />;
      default:
        return <IconDatabase className="h-4 w-4" />;
    }
  };

  const getUpstreamNodes = (nodeId: string): LineageNode[] => {
    const upstreamIds = lineageRelationships
      .filter((r) => r.to === nodeId)
      .map((r) => r.from);
    return lineageNodes.filter((n) => upstreamIds.includes(n.id));
  };

  const getDownstreamNodes = (nodeId: string): LineageNode[] => {
    const downstreamIds = lineageRelationships
      .filter((r) => r.from === nodeId)
      .map((r) => r.to);
    return lineageNodes.filter((n) => downstreamIds.includes(n.id));
  };

  const selectedNodeData = lineageNodes.find((n) => n.id === selectedNode);
  const upstreamNodes = selectedNode ? getUpstreamNodes(selectedNode) : [];
  const downstreamNodes = selectedNode ? getDownstreamNodes(selectedNode) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex items-center gap-2 py-4">
          <IconAlertCircle className="h-5 w-5 text-destructive" />
          <span className="text-destructive">{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={loadLineage}
            className="ml-auto"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Lineage</h1>
          <p className="text-sm text-muted-foreground">
            Trace data flow and dependencies
          </p>
        </div>
        <Button variant="outline" onClick={loadLineage}>
          <IconRefresh className="mr-2 h-4 w-4" />
          Refresh Lineage
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Total Nodes
            </div>
            <div className="text-xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Sources
            </div>
            <div className="text-xl font-bold text-blue-500">
              {stats.sources}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Transformations
            </div>
            <div className="text-xl font-bold text-orange-500">
              {stats.transformations}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
              Targets
            </div>
            <div className="text-xl font-bold text-green-500">
              {stats.targets}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Nodes List */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-2">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search nodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="source">Sources</SelectItem>
                  <SelectItem value="transformation">
                    Transformations
                  </SelectItem>
                  <SelectItem value="target">Targets</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-1">
              {filteredNodes.map((node) => (
                <div
                  key={node.id}
                  className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedNode === node.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted/50 border-transparent"
                  }`}
                  onClick={() => setSelectedNode(node.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getNodeIcon(node.type)}
                    <h3 className="font-semibold text-sm">{node.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {node.description}
                  </p>
                  {node.database && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {node.database}.{node.schema}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lineage Visualization */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconGitBranch className="h-5 w-5" />
              <h2 className="font-semibold">
                {selectedNodeData
                  ? `Lineage: ${selectedNodeData.name}`
                  : "Select a node"}
              </h2>
            </div>
          </CardHeader>
          <CardContent>
            {selectedNodeData ? (
              <div className="space-y-6">
                {/* Upstream */}
                {upstreamNodes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">
                      Upstream Dependencies
                    </h3>
                    <div className="space-y-2">
                      {upstreamNodes.map((node) => (
                        <Card
                          key={node.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedNode(node.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-1">
                              {getNodeIcon(node.type)}
                              <h4 className="font-semibold text-sm">
                                {node.name}
                              </h4>
                              <Badge
                                variant="outline"
                                className="text-xs ml-auto"
                              >
                                {node.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {node.description}
                            </p>
                            {node.database && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {node.database}.{node.schema}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Node */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <IconArrowRight className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Current Node</h3>
                  </div>
                  <Card className="bg-primary/5 border-primary">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        {getNodeIcon(selectedNodeData.type)}
                        <h4 className="font-semibold text-sm">
                          {selectedNodeData.name}
                        </h4>
                        <Badge variant="default" className="text-xs ml-auto">
                          {selectedNodeData.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {selectedNodeData.description}
                      </p>
                      {selectedNodeData.database && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Database</p>
                            <p className="font-medium">
                              {selectedNodeData.database}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Schema</p>
                            <p className="font-medium">
                              {selectedNodeData.schema}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Downstream */}
                {downstreamNodes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">
                      Downstream Dependencies
                    </h3>
                    <div className="space-y-2">
                      {downstreamNodes.map((node) => (
                        <Card
                          key={node.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedNode(node.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-1">
                              {getNodeIcon(node.type)}
                              <h4 className="font-semibold text-sm">
                                {node.name}
                              </h4>
                              <Badge
                                variant="outline"
                                className="text-xs ml-auto"
                              >
                                {node.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {node.description}
                            </p>
                            {node.database && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {node.database}.{node.schema}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {upstreamNodes.length === 0 && downstreamNodes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <IconGitBranch className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">
                      No dependencies found for this node
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <IconGitBranch className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Select a node to view its lineage</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
