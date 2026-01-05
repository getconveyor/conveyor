"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  IconCheck,
  IconX,
  IconClock,
  IconDatabase,
  IconTrendingUp,
  IconCalendar,
  IconLoader2,
} from "@tabler/icons-react";

export interface PipelineStats {
  pipeline_id: string;
  pipeline_name?: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  success_rate: number;
  total_records_processed: number;
  last_run: string | null;
  next_run: string | null;
}

interface PipelineStatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: PipelineStats | null;
  pipelineName?: string;
  isLoading?: boolean;
}

export function PipelineStatsDialog({
  open,
  onOpenChange,
  stats,
  pipelineName,
  isLoading,
}: PipelineStatsDialogProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-600 dark:text-green-400";
    if (rate >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getSuccessRateBg = (rate: number) => {
    if (rate >= 90) return "bg-green-100 dark:bg-green-900/20";
    if (rate >= 70) return "bg-yellow-100 dark:bg-yellow-900/20";
    return "bg-red-100 dark:bg-red-900/20";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconTrendingUp className="h-5 w-5 text-primary" />
            Pipeline Statistics
          </DialogTitle>
          <DialogDescription>
            {pipelineName || stats?.pipeline_name || "Pipeline"} performance
            overview
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : stats ? (
          <div className="space-y-4">
            {/* Success Rate Card */}
            <Card className={getSuccessRateBg(stats.success_rate)}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Success Rate</span>
                  <span
                    className={`text-2xl font-bold ${getSuccessRateColor(
                      stats.success_rate
                    )}`}
                  >
                    {stats.success_rate.toFixed(1)}%
                  </span>
                </div>
                <Progress value={stats.success_rate} className="h-2" />
              </CardContent>
            </Card>

            {/* Run Statistics */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold">{stats.total_runs}</div>
                  <div className="text-xs text-muted-foreground">
                    Total Runs
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <IconCheck className="h-4 w-4 text-green-500" />
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats.successful_runs}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Successful
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <IconX className="h-4 w-4 text-red-500" />
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {stats.failed_runs}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </CardContent>
              </Card>
            </div>

            {/* Records Processed */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <IconDatabase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Records Processed
                    </div>
                    <div className="text-xl font-bold">
                      {formatNumber(stats.total_records_processed)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timing Information */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <IconClock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Last Run
                    </span>
                  </div>
                  <div className="text-sm font-medium">
                    {formatDate(stats.last_run)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <IconCalendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Next Run
                    </span>
                  </div>
                  <div className="text-sm font-medium">
                    {stats.next_run ? (
                      formatDate(stats.next_run)
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Not Scheduled
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No statistics available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
