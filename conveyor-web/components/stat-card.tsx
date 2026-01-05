import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  description?: string;
  className?: string;
  valueClassName?: string;
  ariaLabel?: string;
}

/**
 * Memoized stat card component for displaying metrics
 * Prevents unnecessary re-renders when parent component updates
 */
export const StatCard = memo(function StatCard({
  title,
  value,
  change,
  trend = "neutral",
  icon: Icon,
  description,
  className,
  valueClassName,
  ariaLabel,
}: StatCardProps) {
  const trendColor = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-muted-foreground",
  }[trend];

  return (
    <Card className={className}>
      <CardContent
        className="pt-4 pb-4"
        role="region"
        aria-label={ariaLabel || `${title} statistics`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-muted-foreground">
              {title}
            </div>
            <div
              className={cn(
                "text-3xl font-bold mt-1",
                valueClassName
              )}
              aria-label={`${value} ${title.toLowerCase()}`}
            >
              {value}
            </div>
            {description && (
              <div className="text-xs text-muted-foreground mt-1">
                {description}
              </div>
            )}
            {change && (
              <div className={cn("text-xs font-medium mt-1", trendColor)}>
                {change}
              </div>
            )}
          </div>
          {Icon && (
            <div className="ml-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-6 w-6 text-primary" />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
