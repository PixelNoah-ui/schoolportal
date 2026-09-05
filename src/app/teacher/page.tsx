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
import { NoClassesEmptyState } from "@/components/teacher/no-classes-empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useTeacherDashboard } from "@/hooks/use-teacher-dashboard";
import { useTeacherClasses } from "@/hooks/use-teacher-classes";

export default function TeacherDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useTeacherDashboard();
  const classesQuery = useTeacherClasses();

  if (isLoading) {
    return (
      <>
        <SiteHeader title="Dashboard" />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <Skeleton className="h-4 w-40 rounded-none" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <p className="text-sm leading-6 text-muted-foreground whitespace-pre-wrap wrap-break-word">
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

  const classes = classesQuery.data ?? [];
  const isEmpty = data.stats.classesCount === 0 && classes.length === 0;

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
        <div className="w-full">
          <h2 className="text-lg font-semibold">Overview</h2>
          <p className="text-sm text-muted-foreground">Your teaching summary</p>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        </div>

        {classes.length > 0 && (
          <div>
            <h3 className="mb-4 text-sm font-semibold">Your Classes</h3>
            <div
              className={`grid grid-cols-1 gap-4 ${
                classes.length > 1 ? "sm:grid-cols-2" : ""
              } ${classes.length > 2 ? "lg:grid-cols-3" : ""}`}
            >
              {classes.slice(0, 6).map((classRow) => (
                <ClassCard key={classRow.id} classRow={classRow} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
