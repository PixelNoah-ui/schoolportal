// app/teacher/page.tsx
"use client";

import {
  Users,
  Layers,
  BookOpen,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { SiteHeader } from "@/components/teacher/site-header";
import { StatCard } from "@/components/admin/stat-card";
import { StatCardSkeleton } from "@/components/admin/stat-card-skeleton";
import { ClassCard } from "@/components/teacher/class-card";
import { ScheduleTable } from "@/components/teacher/schedule-table";
import { NoClassesEmptyState } from "@/components/teacher/no-classes-empty-state";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useTeacherDashboard } from "@/hooks/use-teacher-dashboard";

export default function TeacherDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useTeacherDashboard();

  if (isLoading) {
    return (
      <>
        <SiteHeader title="Dashboard" />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <Skeleton className="h-4 w-40 rounded-none" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </div>
          <Skeleton className="h-6 w-32 rounded-none" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="rounded-none shadow-none">
                <CardContent className="space-y-4 p-5">
                  <Skeleton className="size-9 rounded-none" />
                  <Skeleton className="h-4 w-2/3 rounded-none" />
                  <Skeleton className="h-3 w-1/3 rounded-none" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (isError) {
    const errorMessage =
      error instanceof Error && error.message
        ? error.message
        : "Something went wrong while loading your dashboard.";

    // Log full error details to console
    console.error("Teacher Dashboard Error:", {
      error,
      errorMessage,
      errorStack: error instanceof Error ? error.stack : "No stack",
    });

    return (
      <>
        <SiteHeader title="Dashboard" />
        <div className="flex flex-1 items-center justify-center p-6">
          <Card className="w-full max-w-lg rounded-none border-border shadow-none">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="flex size-12 items-center justify-center bg-destructive/10 text-destructive">
                <AlertTriangle className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground">
                  Could not load dashboard
                </p>
                <p className="text-sm leading-6 text-muted-foreground whitespace-pre-wrap break-words">
                  {errorMessage}
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

  const isEmpty =
    data.stats.classesCount === 0 && data.recentClasses.length === 0;

  if (isEmpty) {
    return (
      <>
        <SiteHeader title="Dashboard" />
        <NoClassesEmptyState />
      </>
    );
  }

  return (
    <>
      <SiteHeader title="Dashboard" subtitle="Welcome back" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h2 className="text-lg font-semibold">Overview</h2>
          <p className="text-sm text-muted-foreground">Your teaching summary</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Classes"
            value={data.stats.classesCount}
            delta="assigned to you"
            icon={Layers}
            tone="blue"
          />
          <StatCard
            label="Students"
            value={data.stats.studentsCount}
            delta="across all classes"
            icon={Users}
            tone="violet"
          />
          <StatCard
            label="Subjects"
            value={data.stats.subjectsCount}
            delta="teaching"
            icon={BookOpen}
            tone="amber"
          />
          <StatCard
            label="Schedule"
            value={data.stats.upcomingScheduleCount}
            delta="upcoming sessions"
            icon={Layers}
            tone="emerald"
          />
        </div>

        {data.recentClasses.length > 0 && (
          <div>
            <h3 className="mb-4 text-sm font-semibold">Your Classes</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.recentClasses.map((classRow) => (
                <ClassCard
                  key={classRow.id}
                  classRow={{
                    id: classRow.id,
                    subjectName: classRow.subjectName,
                    className: classRow.className,
                    classGrade: 0,
                    classSection: "",
                    studentCount: classRow.studentCount,
                    semester: classRow.semester,
                    semesterId: "",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {data.upcomingSchedule.length > 0 && (
          <div>
            <ScheduleTable
              schedules={data.upcomingSchedule}
              onRefresh={refetch}
            />
          </div>
        )}
      </div>
    </>
  );
}
