"use client";

import {
  IconDatabase,
  IconSql,
  IconFileSpreadsheet,
  IconApi,
  IconCloud,
  IconTransform,
  IconFilter,
  IconColumns,
  IconMathFunction,
  IconArrowsShuffle,
  IconCode,
  IconStack,
  IconTable,
  IconServer,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface NodeItem {
  type: "source" | "transform" | "destination";
  label: string;
  icon: React.ElementType;
  connectorType?: string;
  transformType?: string;
  destinationType?: string;
  layer?: string;
  description?: string;
}

const sourceNodes: NodeItem[] = [
  {
    type: "source",
    label: "PostgreSQL",
    icon: IconSql,
    connectorType: "postgresql",
    description: "PostgreSQL database",
  },
  {
    type: "source",
    label: "MySQL",
    icon: IconServer,
    connectorType: "mysql",
    description: "MySQL database",
  },
  {
    type: "source",
    label: "CSV File",
    icon: IconFileSpreadsheet,
    connectorType: "csv",
    description: "CSV file source",
  },
  {
    type: "source",
    label: "REST API",
    icon: IconApi,
    connectorType: "api",
    description: "REST API endpoint",
  },
  {
    type: "source",
    label: "S3 Bucket",
    icon: IconCloud,
    connectorType: "s3",
    description: "Amazon S3 bucket",
  },
  {
    type: "source",
    label: "Generic Database",
    icon: IconDatabase,
    connectorType: "database",
    description: "Generic database connection",
  },
];

const transformNodes: NodeItem[] = [
  {
    type: "transform",
    label: "Filter",
    icon: IconFilter,
    transformType: "filter",
    description: "Filter rows based on conditions",
  },
  {
    type: "transform",
    label: "Select Columns",
    icon: IconColumns,
    transformType: "select",
    description: "Select and reorder columns",
  },
  {
    type: "transform",
    label: "Aggregate",
    icon: IconMathFunction,
    transformType: "aggregate",
    description: "Group and aggregate data",
  },
  {
    type: "transform",
    label: "Join",
    icon: IconArrowsShuffle,
    transformType: "join",
    description: "Join multiple data sources",
  },
  {
    type: "transform",
    label: "SQL Transform",
    icon: IconCode,
    transformType: "sql",
    description: "Custom SQL transformation",
  },
  {
    type: "transform",
    label: "Transform",
    icon: IconTransform,
    transformType: "custom",
    description: "Custom transformation",
  },
];

const destinationNodes: NodeItem[] = [
  {
    type: "destination",
    label: "Bronze Layer",
    icon: IconStack,
    destinationType: "lakehouse",
    layer: "bronze",
    description: "Raw data landing zone",
  },
  {
    type: "destination",
    label: "Silver Layer",
    icon: IconStack,
    destinationType: "lakehouse",
    layer: "silver",
    description: "Cleaned and validated data",
  },
  {
    type: "destination",
    label: "Gold Layer",
    icon: IconStack,
    destinationType: "lakehouse",
    layer: "gold",
    description: "Business-ready data",
  },
  {
    type: "destination",
    label: "Table",
    icon: IconTable,
    destinationType: "table",
    description: "Database table",
  },
  {
    type: "destination",
    label: "S3 Export",
    icon: IconCloud,
    destinationType: "s3",
    description: "Export to S3",
  },
];

interface NodePaletteItemProps {
  item: NodeItem;
}

function NodePaletteItem({ item }: NodePaletteItemProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string, data: any) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.setData("application/nodedata", JSON.stringify(data));
    event.dataTransfer.effectAllowed = "move";
  };

  const colorClasses = {
    source:
      "border-blue-200 bg-blue-50 hover:border-blue-300 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50",
    transform:
      "border-purple-200 bg-purple-50 hover:border-purple-300 hover:bg-purple-100 dark:bg-purple-950/30 dark:hover:bg-purple-950/50",
    destination:
      "border-green-200 bg-green-50 hover:border-green-300 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50",
  };

  const iconColorClasses = {
    source: "text-blue-600",
    transform: "text-purple-600",
    destination: "text-green-600",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 cursor-grab transition-colors",
        colorClasses[item.type]
      )}
      draggable
      onDragStart={(e) =>
        onDragStart(e, item.type, {
          label: item.label,
          connectorType: item.connectorType,
          transformType: item.transformType,
          destinationType: item.destinationType,
          layer: item.layer,
        })
      }
    >
      <item.icon className={cn("h-5 w-5", iconColorClasses[item.type])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{item.label}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground truncate">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}

export function NodePalette() {
  return (
    <div className="h-full flex flex-col border-r bg-background">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Components</h3>
        <p className="text-xs text-muted-foreground">
          Drag and drop to add to canvas
        </p>
      </div>
      <ScrollArea className="flex-1">
        <Accordion
          type="multiple"
          defaultValue={["sources", "transforms", "destinations"]}
          className="p-4"
        >
          <AccordionItem value="sources">
            <AccordionTrigger className="text-sm font-medium">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                Sources
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {sourceNodes.map((node) => (
                  <NodePaletteItem key={node.label} item={node} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="transforms">
            <AccordionTrigger className="text-sm font-medium">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                Transforms
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {transformNodes.map((node) => (
                  <NodePaletteItem key={node.label} item={node} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="destinations">
            <AccordionTrigger className="text-sm font-medium">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                Destinations
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {destinationNodes.map((node) => (
                  <NodePaletteItem key={node.label} item={node} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
    </div>
  );
}
