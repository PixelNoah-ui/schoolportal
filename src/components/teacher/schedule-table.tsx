// components/teacher/schedule-table.tsx
"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface ScheduleItem {
  id: string;
  subject: string;
  className: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface ScheduleTableProps {
  schedules: ScheduleItem[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

export function ScheduleTable({
  schedules,
  isLoading = false,
  isError = false,
  error = null,
  onRefresh,
}: ScheduleTableProps) {
  if (isLoading) {
    return (
      <Card className="rounded-none shadow-none border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Teaching Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-none" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="rounded-none shadow-none border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Teaching Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-8">
            <AlertTriangle className="size-8 text-destructive" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Could not load schedule
              </p>
              {error && (
                <p className="text-xs text-muted-foreground mt-1">
                  {error.message}
                </p>
              )}
            </div>
            {onRefresh && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="rounded-none"
              >
                <RefreshCw className="size-4" />
                Try again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (schedules.length === 0) {
    return (
      <Card className="rounded-none shadow-none border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Teaching Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No schedules assigned yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort schedules by day order
  const sortedSchedules = [...schedules].sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek),
  );

  return (
    <Card className="rounded-none shadow-none border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Teaching Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-none border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="font-semibold">Day</TableHead>
                <TableHead className="font-semibold">Time</TableHead>
                <TableHead className="font-semibold">Subject</TableHead>
                <TableHead className="font-semibold">Class</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSchedules.map((schedule, index) => (
                <TableRow
                  key={schedule.id}
                  className={index % 2 === 0 ? "bg-muted/30" : "bg-background"}
                >
                  <TableCell className="font-medium text-sm">
                    {schedule.dayOfWeek}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatTime(schedule.startTime)} -{" "}
                    {formatTime(schedule.endTime)}
                  </TableCell>
                  <TableCell className="text-sm">{schedule.subject}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {schedule.className}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function formatTime(timeStr: string): string {
  if (!timeStr) return "N/A";
  // Handle HH:mm format
  try {
    const [hours, minutes] = timeStr.split(":").slice(0, 2);
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch {
    return timeStr;
  }
}
