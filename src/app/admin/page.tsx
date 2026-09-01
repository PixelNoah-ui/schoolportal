"use client";

import {
  ClipboardList,
  GraduationCap,
  Layers,
  TrendingUp,
  Users,
  WalletCards,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { StatCard } from "@/components/admin/stat-card";
import { EnrollmentChart } from "@/components/admin/enrollment-chart";
import { RecentStudentsTable } from "@/components/admin/recent-students-table";
import { StatCardSkeleton } from "@/components/admin/stat-card-skeleton";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table } from "@/components/ui/table";
import { useDashboard } from "@/hooks/use-dashboard";
import { DashboardEmptyState } from "@/components/admin/dashboard-empty-state";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard();

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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </div>
          <Card className="rounded-none shadow-none">
            <CardContent className="p-0">
              <Table>
                <TableSkeleton rows={5} columns={5} />
              </Table>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (isError) {
    const message =
      error instanceof Error && error.message
        ? error.message.toLowerCase().includes("cannot read properties")
          ? "We couldn't load the dashboard right now. Please try again in a moment."
          : "Something went wrong while loading the dashboard. Please try again."
        : "Something went wrong while loading the dashboard. Please try again.";

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
                <p className="text-sm leading-6 text-muted-foreground">
                  {message}
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
    data.students.length === 0 &&
    data.classes.length === 0 &&
    data.subjects.length === 0 &&
    data.payments.length === 0;

  if (isEmpty) {
    return (
      <>
        <SiteHeader title="Dashboard" />
        <DashboardEmptyState />
      </>
    );
  }

  const approvedPayments = data.payments.filter((p) => p.status === "approved");
  const pendingPayments = data.payments.filter((p) => p.status === "pending");

  return (
    <>
      <SiteHeader title="Dashboard" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-lg font-semibold">Overview</h1>
          <p className="text-sm text-muted-foreground">
            {data.academicYear} · {data.semester}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Students"
            value={data.stats.totalStudents}
            delta="from current records"
            icon={GraduationCap}
            tone="blue"
          />
          <StatCard
            label="Total Teachers"
            value={data.stats.totalTeachers}
            delta="from current records"
            icon={Users}
            tone="violet"
          />
          <StatCard
            label="Total Classes"
            value={data.stats.totalClasses}
            delta="from current records"
            icon={Layers}
            tone="amber"
          />
          <StatCard
            label="Average Score"
            value={`${data.stats.avgScore.toFixed(1)}%`}
            delta="current average"
            icon={TrendingUp}
            tone="emerald"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Payments Received"
            value={`${approvedPayments.length}`}
            delta="approved payments"
            icon={TrendingUp}
            tone="emerald"
          />
          <StatCard
            label="Pending Payments"
            value={`${pendingPayments.length}`}
            delta="need review"
            icon={ClipboardList}
            tone="amber"
          />
          <StatCard
            label="Collected This Month"
            value={`${approvedPayments.reduce((t, p) => t + p.amount, 0).toLocaleString()} ETB`}
            delta="approved total"
            icon={WalletCards}
            tone="blue"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EnrollmentChart enrollmentByGrade={data.enrollmentByGrade} />
          </div>
          <Card className="rounded-none shadow-none">
            <CardHeader className="border-b pb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Top Performing Subjects
              </span>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {data.subjects.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  No subject scores yet.
                </p>
              ) : (
                data.subjects.slice(0, 4).map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{sub.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {sub.className}
                      </span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {sub.avgScore.toFixed(1)}%
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <RecentStudentsTable students={data.students.slice(0, 5)} />

        <Card className="rounded-none shadow-none">
          <CardHeader className="border-b pb-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Classes Overview
            </span>
          </CardHeader>
          <CardContent className="grid grid-cols-1 divide-y p-0 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
            {data.classes.map((c) => (
              <div key={c.id} className="p-4">
                <p className="text-sm font-medium">
                  Grade {c.grade} - {c.section}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.teacher}
                </p>
                <p className="mt-3 text-2xl font-semibold tabular-nums">
                  {c.studentCount}
                </p>
                <p className="text-xs text-muted-foreground">students</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
