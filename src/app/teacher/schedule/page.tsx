// app/teacher/schedule/page.tsx
"use client";

import { CalendarClock, AlertTriangle, RefreshCw } from "lucide-react";
import { SiteHeader } from "@/components/teacher/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTeacherSchedule } from "@/hooks/use-teacher-schedule";

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function SchedulePage() {
  const { data, isLoading, isError, error, refetch } = useTeacherSchedule();

  if (isLoading) {
    return (
      <>
        <SiteHeader title="My Schedule" />
        <div className="flex flex-1 flex-col gap-5 p-6">
          <PageHeader eyebrow="Teaching Schedule" count={0} />
          <Table>
            <TableSkeleton rows={8} columns={5} />
          </Table>
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <SiteHeader title="My Schedule" />
        <div className="flex flex-1 items-center justify-center p-6">
          <Card className="w-full max-w-lg rounded-none border-border shadow-none">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="flex size-12 items-center justify-center bg-destructive/10 text-destructive">
                <AlertTriangle className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground">
                  Could not load schedule
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {error instanceof Error
                    ? error.message
                    : "Something went wrong. Please try again."}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => refetch()}
                className="rounded-none"
              >
                <RefreshCw className="size-4" />
                Try again
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!data) return null;

  const sorted = [...data.schedule].sort((a, b) => {
    const dayA = DAY_ORDER.indexOf(a.dayOfWeek) || 0;
    const dayB = DAY_ORDER.indexOf(b.dayOfWeek) || 0;
    if (dayA !== dayB) return dayA - dayB;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <>
      <SiteHeader title="Schedule" />

      <div className="flex flex-1 flex-col gap-5 p-6">
        <PageHeader eyebrow="Teaching Schedule" count={data.schedule.length} />

        {data.schedule.length === 0 ? (
          <Card className="rounded-none shadow-none">
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <CalendarClock className="size-5" />
              <span>No schedule configured yet.</span>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-none shadow-none">
            <CardHeader className="border-b">
              <span className="text-sm font-semibold">
                Weekly Teaching Schedule
              </span>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Day</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Room</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        {session.dayOfWeek}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {session.subject}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {session.className}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {session.startTime} – {session.endTime}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {session.room ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
