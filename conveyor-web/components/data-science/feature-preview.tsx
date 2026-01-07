"use client";

import { useState } from "react";
import {
  IconLoader2,
  IconTable,
  IconChartBar,
  IconEye,
  IconDownload,
  IconAlertCircle,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MultiFeatureStats,
  FeatureStatisticsChart,
} from "./feature-statistics-chart";

interface FeaturePreviewData {
  columns: string[];
  rows: Record<string, any>[];
  total_rows: number;
  statistics?: {
    name: string;
    count: number;
    null_count: number;
    mean?: number;
    std?: number;
    min?: number;
    max?: number;
    median?: number;
    percentile_25?: number;
    percentile_75?: number;
    unique_count?: number;
    histogram?: { bucket: string; count: number }[];
    value_counts?: { value: string; count: number }[];
    data_type: string;
  }[];
}

interface FeaturePreviewProps {
  data: FeaturePreviewData | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onExport?: () => void;
  title?: string;
  className?: string;
}

export function FeaturePreview({
  data,
  loading = false,
  error = null,
  onRefresh,
  onExport,
  title = "Feature Preview",
  className,
}: FeaturePreviewProps) {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <IconLoader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Loading preview...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <IconAlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="text-red-600 font-medium">Error loading preview</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={onRefresh}
              >
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.rows.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <IconTable className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No data to preview</p>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={onRefresh}
              >
                Load Preview
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedStats = selectedFeature
    ? data.statistics?.find((s) => s.name === selectedFeature)
    : null;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant="secondary">
              {data.total_rows.toLocaleString()} rows
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <IconEye className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            )}
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <IconDownload className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="data">
          <TabsList>
            <TabsTrigger value="data">
              <IconTable className="w-4 h-4 mr-2" />
              Data
            </TabsTrigger>
            <TabsTrigger value="statistics" disabled={!data.statistics}>
              <IconChartBar className="w-4 h-4 mr-2" />
              Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="pt-4">
            <div className="rounded-md border overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    {data.columns.map((col) => (
                      <TableHead
                        key={col}
                        className="font-mono text-xs cursor-pointer hover:bg-muted"
                        onClick={() => setSelectedFeature(col)}
                      >
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((row, index) => (
                    <TableRow key={index}>
                      {data.columns.map((col) => (
                        <TableCell key={col} className="font-mono text-sm">
                          {formatCellValue(row[col])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {data.rows.length < data.total_rows && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing {data.rows.length} of {data.total_rows.toLocaleString()}{" "}
                rows
              </p>
            )}
          </TabsContent>

          <TabsContent value="statistics" className="pt-4">
            {selectedStats ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    Statistics for:{" "}
                    <span className="font-mono">{selectedFeature}</span>
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFeature(null)}
                  >
                    View All
                  </Button>
                </div>
                <FeatureStatisticsChart statistics={selectedStats} />
              </div>
            ) : data.statistics ? (
              <MultiFeatureStats statistics={data.statistics} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No statistics available
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return value.toLocaleString();
    }
    return value.toFixed(4);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "object") {
    return JSON.stringify(value).slice(0, 50);
  }
  const str = String(value);
  return str.length > 50 ? str.slice(0, 47) + "..." : str;
}

interface CompactFeaturePreviewProps {
  columns: string[];
  sampleValues: Record<string, any[]>;
  className?: string;
}

export function CompactFeaturePreview({
  columns,
  sampleValues,
  className,
}: CompactFeaturePreviewProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {columns.map((col) => (
        <div key={col} className="flex items-center gap-2 text-sm">
          <span className="font-mono text-muted-foreground min-w-32">
            {col}:
          </span>
          <div className="flex gap-1 flex-wrap">
            {(sampleValues[col] || []).slice(0, 5).map((val, i) => (
              <Badge key={i} variant="secondary" className="font-mono text-xs">
                {formatCellValue(val)}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
