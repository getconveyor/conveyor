"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FeatureStatistics {
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
}

interface FeatureStatisticsChartProps {
  statistics: FeatureStatistics;
  className?: string;
}

export function FeatureStatisticsChart({
  statistics,
  className,
}: FeatureStatisticsChartProps) {
  const isNumeric = ["int", "float", "double"].includes(statistics.data_type);
  const nullPercentage = (
    (statistics.null_count / statistics.count) *
    100
  ).toFixed(1);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-mono">
            {statistics.name}
          </CardTitle>
          <Badge variant="outline">{statistics.data_type}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="distribution" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="distribution" className="pt-4">
            {isNumeric && statistics.histogram ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statistics.histogram}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="bucket"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : statistics.value_counts ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={statistics.value_counts.slice(0, 10)}
                    layout="vertical"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis
                      dataKey="value"
                      type="category"
                      tick={{ fontSize: 10 }}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                No distribution data available
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Count</span>
                  <span className="text-sm font-medium">
                    {statistics.count.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nulls</span>
                  <span className="text-sm font-medium">
                    {statistics.null_count.toLocaleString()} ({nullPercentage}%)
                  </span>
                </div>
                {statistics.unique_count !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Unique
                    </span>
                    <span className="text-sm font-medium">
                      {statistics.unique_count.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
              {isNumeric && (
                <div className="space-y-2">
                  {statistics.mean !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Mean
                      </span>
                      <span className="text-sm font-medium">
                        {statistics.mean.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {statistics.std !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Std Dev
                      </span>
                      <span className="text-sm font-medium">
                        {statistics.std.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {statistics.min !== undefined &&
                    statistics.max !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Range
                        </span>
                        <span className="text-sm font-medium">
                          {statistics.min.toFixed(2)} -{" "}
                          {statistics.max.toFixed(2)}
                        </span>
                      </div>
                    )}
                </div>
              )}
            </div>

            {isNumeric && statistics.median !== undefined && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-2">
                  Percentiles
                </div>
                <div className="flex justify-between text-sm">
                  <span>25%: {statistics.percentile_25?.toFixed(2)}</span>
                  <span>50%: {statistics.median?.toFixed(2)}</span>
                  <span>75%: {statistics.percentile_75?.toFixed(2)}</span>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface FeatureDriftChartProps {
  data: {
    timestamp: string;
    mean: number;
    min: number;
    max: number;
  }[];
  featureName: string;
  className?: string;
}

export function FeatureDriftChart({
  data,
  featureName,
  className,
}: FeatureDriftChartProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Feature Drift: {featureName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="timestamp"
                tick={{ fontSize: 10 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="max"
                stackId="1"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.1}
              />
              <Area
                type="monotone"
                dataKey="mean"
                stackId="2"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
              />
              <Line
                type="monotone"
                dataKey="mean"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface MultiFeatureStatsProps {
  statistics: FeatureStatistics[];
  className?: string;
}

export function MultiFeatureStats({
  statistics,
  className,
}: MultiFeatureStatsProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}
    >
      {statistics.map((stat) => (
        <FeatureStatisticsChart key={stat.name} statistics={stat} />
      ))}
    </div>
  );
}
