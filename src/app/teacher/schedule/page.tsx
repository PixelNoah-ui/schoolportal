// app/teacher/schedule/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarClock,
  Clock3,
  MapPin,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { SiteHeader } from "@/components/teacher/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useTeacherSchedule } from "@/hooks/use-teacher-schedule";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Pixels per minute of class time — controls how "tall" an hour reads.
const PX_PER_MIN = 1.35;
// Minimum block height so a 15-minute session is still legible.
const MIN_BLOCK_PX = 34;

type Session = {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject: string;
  className: string;
  room?: string | null;
};

function toMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function formatHourLabel(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour} ${suffix}`;
}

// One hue per subject, applied consistently so a teacher can pattern-match
// by color before reading any text. Order is fixed (not random) so the same
// subject always lands on the same color across renders.
const SUBJECT_PALETTE = [
  {
    bg: "bg-primary/5",
    line: "border-l-primary",
    text: "text-foreground",
    dot: "bg-primary",
  },
  {
    bg: "bg-secondary",
    line: "border-l-secondary-foreground",
    text: "text-foreground",
    dot: "bg-secondary-foreground",
  },
  {
    bg: "bg-accent",
    line: "border-l-accent-foreground",
    text: "text-foreground",
    dot: "bg-accent-foreground",
  },
  {
    bg: "bg-muted",
    line: "border-l-muted-foreground",
    text: "text-foreground",
    dot: "bg-muted-foreground",
  },
  {
    bg: "bg-card",
    line: "border-l-foreground",
    text: "text-foreground",
    dot: "bg-foreground",
  },
  {
    bg: "bg-primary/10",
    line: "border-l-primary",
    text: "text-foreground",
    dot: "bg-primary",
  },
];

function colorForSubject(subject: string) {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = (hash * 31 + subject.charCodeAt(i)) | 0;
  }
  return SUBJECT_PALETTE[Math.abs(hash) % SUBJECT_PALETTE.length];
}

type LaidOutSession = Session & { col: number; cols: number };

// Greedy interval layout: sessions that don't overlap in time stack full-width;
// sessions that do overlap split into side-by-side columns and are flagged as
// conflicts, rather than silently stacking on top of one another.
function layoutDay(sessions: Session[]): LaidOutSession[] {
  const sorted = [...sessions].sort(
    (a, b) =>
      toMinutes(a.startTime) - toMinutes(b.startTime) ||
      toMinutes(a.endTime) - toMinutes(b.endTime),
  );

  const result: LaidOutSession[] = [];
  let cluster: LaidOutSession[] = [];
  let clusterEnd = -Infinity;
  let columnEnds: number[] = [];

  const flush = () => {
    if (!cluster.length) return;
    const cols = Math.max(...cluster.map((s) => s.col)) + 1;
    cluster.forEach((s) => (s.cols = cols));
    result.push(...cluster);
    cluster = [];
    columnEnds = [];
  };

  for (const session of sorted) {
    const start = toMinutes(session.startTime);
    const end = toMinutes(session.endTime);

    if (start >= clusterEnd) {
      flush();
      clusterEnd = end;
    } else {
      clusterEnd = Math.max(clusterEnd, end);
    }

    let col = columnEnds.findIndex((e) => e <= start);
    if (col === -1) {
      col = columnEnds.length;
      columnEnds.push(end);
    } else {
      columnEnds[col] = end;
    }
    cluster.push({ ...session, col, cols: 1 });
  }
  flush();

  return result;
}

export default function SchedulePage() {
  const { data, isLoading, isError, error, refetch } = useTeacherSchedule();

  // Deferred to an effect so the "today" highlight and live time-line never
  // cause a server/client render mismatch.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setNow(new Date()));
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(id);
    };
  }, []);

  const todayName =
    now && now.getDay() >= 1 && now.getDay() <= 5
      ? DAY_ORDER[now.getDay() - 1]
      : null;
  const nowMinutes = now ? now.getHours() * 60 + now.getMinutes() : null;

  const sortedSchedule = useMemo(() => {
    if (!data) return [];
    return [...data.schedule].sort((a, b) => {
      const dayA = DAY_ORDER.indexOf(a.dayOfWeek);
      const dayB = DAY_ORDER.indexOf(b.dayOfWeek);
      if (dayA !== dayB) return dayA - dayB;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [data]);

  const byDay = useMemo(() => {
    const map = new Map<string, LaidOutSession[]>();
    for (const day of DAY_ORDER) {
      map.set(
        day,
        layoutDay(sortedSchedule.filter((s) => s.dayOfWeek === day)),
      );
    }
    return map;
  }, [sortedSchedule]);

  const { rangeStart, rangeEnd, hourMarks } = useMemo(() => {
    if (sortedSchedule.length === 0) {
      return {
        rangeStart: 8 * 60,
        rangeEnd: 16 * 60,
        hourMarks: [8, 9, 10, 11, 12, 13, 14, 15, 16],
      };
    }
    const starts = sortedSchedule.map((s) => toMinutes(s.startTime));
    const ends = sortedSchedule.map((s) => toMinutes(s.endTime));
    const paddedStart = Math.max(0, Math.min(...starts) - 30);
    const paddedEnd = Math.min(24 * 60, Math.max(...ends) + 30);
    const start = Math.floor(paddedStart / 60) * 60;
    const end = Math.ceil(paddedEnd / 60) * 60;
    const marks: number[] = [];
    for (let h = start / 60; h <= end / 60; h++) marks.push(h);
    return { rangeStart: start, rangeEnd: end, hourMarks: marks };
  }, [sortedSchedule]);

  const totalHeight = (rangeEnd - rangeStart) * PX_PER_MIN;
  const subjects = useMemo(
    () => Array.from(new Set(sortedSchedule.map((s) => s.subject))),
    [sortedSchedule],
  );

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

  return (
    <>
      <SiteHeader title="My Schedule" />

      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <PageHeader
            eyebrow="Weekly teaching plan"
            count={data.schedule.length}
          />
          <div className="flex items-center gap-2 border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" />
            <span>
              {data.schedule.length} scheduled session
              {data.schedule.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {data.schedule.length === 0 ? (
          <Card className="rounded-none shadow-none">
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <CalendarClock className="size-5" />
              <span>No schedule configured yet.</span>
            </CardContent>
          </Card>
        ) : (
          <>
            {subjects.length > 1 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                {subjects.map((subject) => {
                  const palette = colorForSubject(subject);
                  return (
                    <span key={subject} className="flex items-center gap-1.5">
                      <span
                        className={cn("size-2 rounded-full", palette.dot)}
                      />
                      {subject}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Desktop / tablet: real time-grid so duration and gaps read visually */}
            <div className="hidden overflow-hidden border border-border bg-background md:block">
              <div className="grid grid-cols-[56px_repeat(5,1fr)] border-b border-border bg-muted/30">
                <div className="border-r border-border" />
                {DAY_ORDER.map((day) => (
                  <div
                    key={day}
                    className={cn(
                      "flex items-center justify-center gap-1.5 border-r border-border px-2 py-2.5 last:border-r-0",
                      day === todayName && "bg-primary/6",
                    )}
                  >
                    <span className="text-sm font-semibold text-foreground">
                      {day}
                    </span>
                    {day === todayName && (
                      <span className="size-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex" style={{ height: totalHeight }}>
                <div className="relative w-14 shrink-0 border-r border-border">
                  {hourMarks.map((h) => (
                    <span
                      key={h}
                      className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground"
                      style={{ top: (h * 60 - rangeStart) * PX_PER_MIN }}
                    >
                      {formatHourLabel(h)}
                    </span>
                  ))}
                </div>

                {DAY_ORDER.map((day) => {
                  const sessions = byDay.get(day) ?? [];
                  const showNowLine =
                    day === todayName &&
                    nowMinutes !== null &&
                    nowMinutes >= rangeStart &&
                    nowMinutes <= rangeEnd;

                  return (
                    <div
                      key={day}
                      className={cn(
                        "relative flex-1 border-r border-border last:border-r-0",
                        day === todayName && "bg-primary/2",
                      )}
                      style={{
                        backgroundImage: `repeating-linear-gradient(to bottom, hsl(var(--border)) 0, hsl(var(--border)) 1px, transparent 1px, transparent ${
                          PX_PER_MIN * 60
                        }px)`,
                      }}
                    >
                      {sessions.map((session) => {
                        const start = toMinutes(session.startTime);
                        const end = toMinutes(session.endTime);
                        const top = (start - rangeStart) * PX_PER_MIN;
                        const height = Math.max(
                          (end - start) * PX_PER_MIN - 2,
                          MIN_BLOCK_PX,
                        );
                        const widthPct = 100 / session.cols;
                        const leftPct = session.col * widthPct;
                        const palette = colorForSubject(session.subject);
                        const isConflict = session.cols > 1;
                        const roomy = height >= 56;

                        return (
                          <div
                            key={session.id}
                            className={cn(
                              "absolute overflow-hidden border-l-2 px-2 py-1 shadow-sm",
                              palette.bg,
                              palette.line,
                            )}
                            style={{
                              top,
                              height,
                              left: `${leftPct}%`,
                              width: `calc(${widthPct}% - 2px)`,
                            }}
                            title={`${session.subject} · ${session.className}${session.room ? ` · ${session.room}` : ""}`}
                          >
                            {isConflict && (
                              <AlertTriangle className="absolute right-1 top-1 size-3 text-destructive" />
                            )}
                            <p
                              className={cn(
                                "truncate pr-3 text-[11px] font-semibold leading-tight",
                                palette.text,
                              )}
                            >
                              {session.subject}
                            </p>
                            <p className="truncate text-[10px] leading-tight text-muted-foreground">
                              {formatTime(session.startTime)}–
                              {formatTime(session.endTime)}
                            </p>
                            {roomy && (
                              <p className="mt-0.5 truncate text-[10px] leading-tight text-muted-foreground">
                                {session.className}
                                {session.room ? ` · ${session.room}` : ""}
                              </p>
                            )}
                          </div>
                        );
                      })}

                      {sessions.length === 0 && (
                        <span className="absolute inset-x-0 top-3 text-center text-[11px] text-muted-foreground">
                          Open
                        </span>
                      )}

                      {showNowLine && (
                        <div
                          className="absolute inset-x-0 z-10 flex items-center"
                          style={{
                            top: (nowMinutes! - rangeStart) * PX_PER_MIN,
                          }}
                        >
                          <span className="-ml-0.75 size-1.75 rounded-full bg-destructive" />
                          <span className="h-px flex-1 bg-destructive" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile: stacked agenda, one section per day */}
            <div className="flex flex-col gap-4 md:hidden">
              {DAY_ORDER.map((day) => {
                const sessions = sortedSchedule.filter(
                  (s) => s.dayOfWeek === day,
                );
                return (
                  <section
                    key={day}
                    className="border border-border bg-background"
                  >
                    <div
                      className={cn(
                        "flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2",
                        day === todayName && "bg-primary/6",
                      )}
                    >
                      <span className="flex items-center gap-1.5 text-sm font-semibold">
                        {day}
                        {day === todayName && (
                          <span className="size-1.5 rounded-full bg-primary" />
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {sessions.length === 0
                          ? "Open"
                          : `${sessions.length} session${sessions.length === 1 ? "" : "s"}`}
                      </span>
                    </div>
                    {sessions.length === 0 ? (
                      <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground">
                        <CalendarClock className="size-3.5" />
                        No sessions
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {sessions.map((session) => {
                          const palette = colorForSubject(session.subject);
                          return (
                            <div
                              key={session.id}
                              className={cn(
                                "flex items-start gap-2.5 border-l-2 px-3 py-2.5",
                                palette.line,
                              )}
                            >
                              <BookOpen
                                className={cn(
                                  "mt-0.5 size-3.5 shrink-0",
                                  palette.text,
                                )}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {session.subject}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-primary">
                                  <Clock3 className="size-3" />
                                  {formatTime(session.startTime)}–
                                  {formatTime(session.endTime)}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                  {session.className}
                                  {session.room ? (
                                    <span className="ml-2 inline-flex items-center gap-1">
                                      <MapPin className="size-3" />
                                      {session.room}
                                    </span>
                                  ) : null}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
