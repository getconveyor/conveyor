"use client";

import { type Node } from "@xyflow/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  IconDatabase,
  IconSettings,
  IconCode,
  IconTestPipe,
} from "@tabler/icons-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface NodeConfigPanelProps {
  selectedNode: Node | null;
  onUpdate?: (nodeId: string, data: any) => void;
}

export function NodeConfigPanel({
  selectedNode,
  onUpdate,
}: NodeConfigPanelProps) {
  if (!selectedNode) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-background border-l">
        <IconSettings className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-semibold text-lg">Node Configuration</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Select a node on the canvas to configure its properties
        </p>
      </div>
    );
  }

  const nodeType = selectedNode.type;
  const nodeData = selectedNode.data as any;

  return (
    <div className="h-full flex flex-col bg-background border-l">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              nodeType === "source"
                ? "bg-blue-100 text-blue-600"
                : nodeType === "transform"
                ? "bg-purple-100 text-purple-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            <IconDatabase className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">{nodeData.label || "Node"}</h3>
            <p className="text-xs text-muted-foreground capitalize">
              {nodeType} Node
            </p>
          </div>
        </div>
      </div>

      {/* Config Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <Accordion
            type="multiple"
            defaultValue={["general", "connection", "advanced"]}
          >
            {/* General Settings */}
            <AccordionItem value="general">
              <AccordionTrigger>General</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="node-name">Name</Label>
                    <Input
                      id="node-name"
                      defaultValue={nodeData.label}
                      placeholder="Enter node name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="node-description">Description</Label>
                    <Textarea
                      id="node-description"
                      placeholder="Describe this node's purpose"
                      rows={3}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Source-specific settings */}
            {nodeType === "source" && (
              <AccordionItem value="connection">
                <AccordionTrigger>Connection</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="data-source">Data Source</Label>
                      <Select defaultValue={nodeData.connectorType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select data source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="postgresql">PostgreSQL</SelectItem>
                          <SelectItem value="mysql">MySQL</SelectItem>
                          <SelectItem value="csv">CSV File</SelectItem>
                          <SelectItem value="api">REST API</SelectItem>
                          <SelectItem value="s3">S3 Bucket</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="table-name">Table / Object</Label>
                      <Input
                        id="table-name"
                        placeholder="e.g., public.customers"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schema">Schema</Label>
                      <Input id="schema" placeholder="e.g., public" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="incremental">Incremental Load</Label>
                      <Switch id="incremental" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Transform-specific settings */}
            {nodeType === "transform" && (
              <AccordionItem value="transform">
                <AccordionTrigger>Transform Settings</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="transform-type">Transform Type</Label>
                      <Select defaultValue={nodeData.transformType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="filter">Filter</SelectItem>
                          <SelectItem value="select">Select Columns</SelectItem>
                          <SelectItem value="aggregate">Aggregate</SelectItem>
                          <SelectItem value="join">Join</SelectItem>
                          <SelectItem value="sql">SQL Transform</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sql-query">SQL Expression</Label>
                      <Textarea
                        id="sql-query"
                        placeholder="SELECT * FROM source WHERE ..."
                        rows={5}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Destination-specific settings */}
            {nodeType === "destination" && (
              <AccordionItem value="destination">
                <AccordionTrigger>Destination Settings</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="layer">Lakehouse Layer</Label>
                      <Select defaultValue={nodeData.layer || "bronze"}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select layer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bronze">Bronze (Raw)</SelectItem>
                          <SelectItem value="silver">
                            Silver (Cleaned)
                          </SelectItem>
                          <SelectItem value="gold">Gold (Business)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="namespace">Namespace</Label>
                      <Input
                        id="namespace"
                        placeholder="e.g., sales, marketing"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="table-name">Table Name</Label>
                      <Input id="table-name" placeholder="e.g., customers" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="write-mode">Write Mode</Label>
                      <Select defaultValue="append">
                        <SelectTrigger>
                          <SelectValue placeholder="Select write mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="append">Append</SelectItem>
                          <SelectItem value="overwrite">Overwrite</SelectItem>
                          <SelectItem value="merge">Merge (Upsert)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="partitioned">Enable Partitioning</Label>
                      <Switch id="partitioned" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Advanced Settings */}
            <AccordionItem value="advanced">
              <AccordionTrigger>Advanced</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="retry-count">Retry Count</Label>
                    <Input
                      id="retry-count"
                      type="number"
                      defaultValue="3"
                      min="0"
                      max="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeout">Timeout (seconds)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      defaultValue="300"
                      min="30"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fail-on-error">Fail on Error</Label>
                    <Switch id="fail-on-error" defaultChecked />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="p-4 border-t space-y-2">
        <Button variant="outline" className="w-full gap-2">
          <IconTestPipe className="h-4 w-4" />
          Test Connection
        </Button>
        <Button variant="outline" className="w-full gap-2">
          <IconCode className="h-4 w-4" />
          View Generated Code
        </Button>
      </div>
    </div>
  );
}
