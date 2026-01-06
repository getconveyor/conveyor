"use client";

import { useState, useMemo, useCallback } from "react";
import { Tree, NodeRendererProps } from "react-arborist";
import {
  IconDatabase,
  IconFolder,
  IconFolderOpen,
  IconTable,
  IconColumns,
  IconKey,
  IconChevronRight,
  IconChevronDown,
  IconRefresh,
  IconSearch,
  IconStack,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export interface SchemaTreeNode {
  id: string;
  name: string;
  type: "namespace" | "schema" | "table" | "column" | "layer";
  dataType?: string;
  isPrimaryKey?: boolean;
  isNullable?: boolean;
  children?: SchemaTreeNode[];
  layer?: "bronze" | "silver" | "gold";
}

interface SchemaTreeProps {
  data: SchemaTreeNode[];
  onSelect?: (node: SchemaTreeNode) => void;
  onTableSelect?: (namespaceSchemaTable: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
  className?: string;
  height?: number;
}

// Icon mapping for node types
const nodeIcons: Record<string, React.ElementType> = {
  namespace: IconDatabase,
  schema: IconFolder,
  layer: IconStack,
  table: IconTable,
  column: IconColumns,
};

const layerColors: Record<string, string> = {
  bronze: "text-amber-600",
  silver: "text-slate-500",
  gold: "text-yellow-500",
};

function Node({ node, style, dragHandle }: NodeRendererProps<SchemaTreeNode>) {
  const data = node.data;
  const Icon = nodeIcons[data.type] || IconFolder;
  const isOpen = node.isOpen;

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          ref={dragHandle}
          style={style}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 cursor-pointer rounded-md text-sm",
            "hover:bg-muted/80 transition-colors",
            node.isSelected && "bg-accent text-accent-foreground"
          )}
          onClick={() => node.isInternal && node.toggle()}
          onDoubleClick={() => {
            if (data.type === "table" && node.tree.props.onSelect) {
              // Build full table path
              const path: string[] = [];
              let current = node;
              while (current) {
                if (current.data.type !== "column") {
                  path.unshift(current.data.name);
                }
                current = current.parent as any;
              }
              // Call onTableSelect with full path
            }
          }}
        >
          {/* Expand/collapse icon */}
          {node.isInternal ? (
            <span className="w-4 h-4 flex items-center justify-center">
              {isOpen ? (
                <IconChevronDown className="h-3 w-3 text-muted-foreground" />
              ) : (
                <IconChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
            </span>
          ) : (
            <span className="w-4" />
          )}

          {/* Node icon */}
          <Icon
            className={cn(
              "h-4 w-4",
              data.type === "layer" && data.layer
                ? layerColors[data.layer]
                : "text-muted-foreground"
            )}
          />

          {/* Node name */}
          <span className="truncate flex-1">{data.name}</span>

          {/* Column type badge */}
          {data.type === "column" && data.dataType && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
              {data.dataType}
            </Badge>
          )}

          {/* Primary key indicator */}
          {data.isPrimaryKey && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <IconKey className="h-3 w-3 text-yellow-500" />
                </TooltipTrigger>
                <TooltipContent>Primary Key</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {data.type === "table" && (
          <>
            <ContextMenuItem>Preview Data</ContextMenuItem>
            <ContextMenuItem>Query Table</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Copy Table Name</ContextMenuItem>
            <ContextMenuItem>View Schema</ContextMenuItem>
          </>
        )}
        {data.type === "column" && (
          <>
            <ContextMenuItem>Copy Column Name</ContextMenuItem>
            <ContextMenuItem>Add to Query</ContextMenuItem>
          </>
        )}
        {(data.type === "namespace" || data.type === "schema") && (
          <>
            <ContextMenuItem>Refresh</ContextMenuItem>
            <ContextMenuItem>Copy Name</ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function SchemaTree({
  data,
  onSelect,
  onTableSelect,
  onRefresh,
  loading = false,
  className,
  height = 400,
}: SchemaTreeProps) {
  const [search, setSearch] = useState("");

  // Filter tree based on search
  const filteredData = useMemo(() => {
    if (!search) return data;

    const filterNodes = (nodes: SchemaTreeNode[]): SchemaTreeNode[] => {
      return nodes
        .map((node) => {
          const matchesSearch = node.name
            .toLowerCase()
            .includes(search.toLowerCase());
          const filteredChildren = node.children
            ? filterNodes(node.children)
            : undefined;

          if (
            matchesSearch ||
            (filteredChildren && filteredChildren.length > 0)
          ) {
            return {
              ...node,
              children: filteredChildren,
            };
          }
          return null;
        })
        .filter(Boolean) as SchemaTreeNode[];
    };

    return filterNodes(data);
  }, [data, search]);

  const handleSelect = useCallback(
    (nodes: any[]) => {
      if (nodes.length > 0 && onSelect) {
        onSelect(nodes[0].data);
      }
    },
    [onSelect]
  );

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Search and refresh */}
      <div className="flex items-center gap-2 p-2 border-b">
        <div className="relative flex-1">
          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onRefresh}
          disabled={loading}
        >
          <IconRefresh className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {search ? "No results found" : "No schema data available"}
            </div>
          ) : (
            <Tree<SchemaTreeNode>
              data={filteredData}
              openByDefault={false}
              width="100%"
              height={height}
              indent={16}
              rowHeight={28}
              onSelect={handleSelect}
              searchTerm={search}
              searchMatch={(node, term) =>
                node.data.name.toLowerCase().includes(term.toLowerCase())
              }
            >
              {Node}
            </Tree>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
