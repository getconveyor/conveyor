"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Clock,
  Calendar,
  CalendarDays,
  CalendarClock,
  Settings2,
} from "lucide-react";
import { ScheduleType, ScheduleConfig } from "@/lib/api/integration";

interface ScheduleBuilderProps {
  scheduleType: ScheduleType;
  scheduleConfig: ScheduleConfig;
  timezone: string;
  onScheduleTypeChange: (type: ScheduleType) => void;
  onScheduleConfigChange: (config: ScheduleConfig) => void;
  onTimezoneChange: (timezone: string) => void;
}

const SCHEDULE_TYPES: {
  value: ScheduleType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "manual",
    label: "Manual",
    description: "Run only when triggered manually",
    icon: <Settings2 className="h-4 w-4" />,
  },
  {
    value: "hourly",
    label: "Hourly",
    description: "Run every N hours",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    value: "daily",
    label: "Daily",
    description: "Run once per day at a specific time",
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    value: "weekly",
    label: "Weekly",
    description: "Run on specific days of the week",
    icon: <CalendarDays className="h-4 w-4" />,
  },
  {
    value: "monthly",
    label: "Monthly",
    description: "Run on a specific day each month",
    icon: <CalendarClock className="h-4 w-4" />,
  },
  {
    value: "cron",
    label: "Custom (Cron)",
    description: "Advanced: Use a cron expression",
    icon: <Settings2 className="h-4 w-4" />,
  },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Australia/Sydney",
];

export function ScheduleBuilder({
  scheduleType,
  scheduleConfig,
  timezone,
  onScheduleTypeChange,
  onScheduleConfigChange,
  onTimezoneChange,
}: ScheduleBuilderProps) {
  const handleHourChange = (hour: string) => {
    const hourNum = parseInt(hour, 10);
    if (!isNaN(hourNum) && hourNum >= 0 && hourNum <= 23) {
      onScheduleConfigChange({ ...scheduleConfig, hour: hourNum });
    }
  };

  const handleMinuteChange = (minute: string) => {
    const minuteNum = parseInt(minute, 10);
    if (!isNaN(minuteNum) && minuteNum >= 0 && minuteNum <= 59) {
      onScheduleConfigChange({ ...scheduleConfig, minute: minuteNum });
    }
  };

  const handleIntervalChange = (interval: string) => {
    const intervalNum = parseInt(interval, 10);
    if (!isNaN(intervalNum) && intervalNum >= 1 && intervalNum <= 24) {
      onScheduleConfigChange({ ...scheduleConfig, interval: intervalNum });
    }
  };

  const handleDayChange = (day: string) => {
    const dayNum = parseInt(day, 10);
    if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
      onScheduleConfigChange({ ...scheduleConfig, day: dayNum });
    }
  };

  const handleDaysOfWeekChange = (dayValue: number, checked: boolean) => {
    const currentDays = scheduleConfig.days || [];
    const newDays = checked
      ? [...currentDays, dayValue].sort((a, b) => a - b)
      : currentDays.filter((d) => d !== dayValue);
    onScheduleConfigChange({ ...scheduleConfig, days: newDays });
  };

  const handleCronChange = (expression: string) => {
    onScheduleConfigChange({ ...scheduleConfig, expression });
  };

  const getScheduleDescription = (): string => {
    switch (scheduleType) {
      case "manual":
        return "Pipeline will only run when triggered manually";
      case "hourly": {
        const interval = scheduleConfig.interval || 1;
        return interval === 1
          ? "Runs every hour"
          : `Runs every ${interval} hours`;
      }
      case "daily": {
        const hour = scheduleConfig.hour ?? 0;
        const minute = scheduleConfig.minute ?? 0;
        return `Runs daily at ${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")} ${timezone}`;
      }
      case "weekly": {
        const days = scheduleConfig.days || [];
        const hour = scheduleConfig.hour ?? 0;
        const minute = scheduleConfig.minute ?? 0;
        const dayNames = days
          .map((d) => DAYS_OF_WEEK.find((dw) => dw.value === d)?.label)
          .join(", ");
        return days.length > 0
          ? `Runs on ${dayNames} at ${hour.toString().padStart(2, "0")}:${minute
              .toString()
              .padStart(2, "0")} ${timezone}`
          : "Select days to run";
      }
      case "monthly": {
        const day = scheduleConfig.day ?? 1;
        const hour = scheduleConfig.hour ?? 0;
        const minute = scheduleConfig.minute ?? 0;
        const suffix =
          day === 1 || day === 21 || day === 31
            ? "st"
            : day === 2 || day === 22
            ? "nd"
            : day === 3 || day === 23
            ? "rd"
            : "th";
        return `Runs on the ${day}${suffix} of each month at ${hour
          .toString()
          .padStart(2, "0")}:${minute.toString().padStart(2, "0")} ${timezone}`;
      }
      case "cron":
        return scheduleConfig.expression
          ? `Custom cron: ${scheduleConfig.expression}`
          : "Enter a cron expression";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-5">
      {/* Schedule Type Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Frequency</Label>
        <Select
          value={scheduleType}
          onValueChange={(value) => onScheduleTypeChange(value as ScheduleType)}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            {SCHEDULE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  {type.icon}
                  <span>{type.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {SCHEDULE_TYPES.find((t) => t.value === scheduleType)?.description}
        </p>
      </div>

      {/* Schedule-specific configuration */}
      {scheduleType === "hourly" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Interval</Label>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Run every</span>
            <Select
              value={String(scheduleConfig.interval || 1)}
              onValueChange={handleIntervalChange}
            >
              <SelectTrigger className="w-20 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 6, 8, 12, 24].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">hour(s)</span>
          </div>
        </div>
      )}

      {scheduleType === "daily" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Time</Label>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Run at</span>
            <div className="flex items-center gap-1">
              <Select
                value={String(scheduleConfig.hour ?? 0)}
                onValueChange={handleHourChange}
              >
                <SelectTrigger className="w-20 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {i.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-lg font-medium">:</span>
              <Select
                value={String(scheduleConfig.minute ?? 0)}
                onValueChange={handleMinuteChange}
              >
                <SelectTrigger className="w-20 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 15, 30, 45].map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {scheduleType === "weekly" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Days</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = (scheduleConfig.days || []).includes(
                  day.value
                );
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() =>
                      handleDaysOfWeekChange(day.value, !isSelected)
                    }
                    className={`
                      px-3 py-2 text-sm font-medium rounded-md border transition-colors
                      ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-accent border-input"
                      }
                    `}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Time</Label>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Run at</span>
              <div className="flex items-center gap-1">
                <Select
                  value={String(scheduleConfig.hour ?? 0)}
                  onValueChange={handleHourChange}
                >
                  <SelectTrigger className="w-20 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {i.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-lg font-medium">:</span>
                <Select
                  value={String(scheduleConfig.minute ?? 0)}
                  onValueChange={handleMinuteChange}
                >
                  <SelectTrigger className="w-20 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 15, 30, 45].map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {m.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {scheduleType === "monthly" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Day of Month</Label>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Run on the</span>
              <Select
                value={String(scheduleConfig.day ?? 1)}
                onValueChange={handleDayChange}
              >
                <SelectTrigger className="w-20 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                of each month
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Time</Label>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Run at</span>
              <div className="flex items-center gap-1">
                <Select
                  value={String(scheduleConfig.hour ?? 0)}
                  onValueChange={handleHourChange}
                >
                  <SelectTrigger className="w-20 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {i.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-lg font-medium">:</span>
                <Select
                  value={String(scheduleConfig.minute ?? 0)}
                  onValueChange={handleMinuteChange}
                >
                  <SelectTrigger className="w-20 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 15, 30, 45].map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {m.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {scheduleType === "cron" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Cron Expression</Label>
          <Input
            value={scheduleConfig.expression || ""}
            onChange={(e) => handleCronChange(e.target.value)}
            placeholder="0 0 * * *"
            className="font-mono h-10"
          />
          <p className="text-xs text-muted-foreground">
            Format: minute hour day month day_of_week (e.g., &quot;0 9 * *
            1-5&quot; = weekdays at 9am)
          </p>
        </div>
      )}

      {/* Timezone selector (for all except manual) */}
      {scheduleType !== "manual" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Timezone</Label>
          <Select value={timezone} onValueChange={onTimezoneChange}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Schedule Description Preview */}
      <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">
            {getScheduleDescription()}
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper to get default config for a schedule type
export function getDefaultScheduleConfig(type: ScheduleType): ScheduleConfig {
  switch (type) {
    case "manual":
      return {};
    case "hourly":
      return { interval: 1, minute: 0 };
    case "daily":
      return { hour: 9, minute: 0 };
    case "weekly":
      return { days: [1], hour: 9, minute: 0 }; // Monday at 9am
    case "monthly":
      return { day: 1, hour: 9, minute: 0 };
    case "cron":
      return { expression: "0 0 * * *" };
    default:
      return {};
  }
}
