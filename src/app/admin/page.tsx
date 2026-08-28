// app/admin/page.tsx
"use client";

import {
  ClipboardList,
  GraduationCap,
  Layers,
  TrendingUp,
  Users,
  WalletCards,
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
    return (
      <>
        <SiteHeader title="Dashboard" />
        <div className="flex flex-1 items-center justify-center p-6">
          <Card className="w-full max-w-md rounded-none shadow-none">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <p className="text-sm font-semibold">Could not load dashboard</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : "Something went wrong while loading dashboard data."}
              </p>
              <button
                type="button"
                className="text-sm font-medium underline underline-offset-4"
                onClick={() => refetch()}
              >
                Try again
              </button>
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

  const approvedPayments = data.payments.filter(
    (payment) => payment.status === "approved",
  );
  const pendingPayments = data.payments.filter(
    (payment) => payment.status === "pending",
  );

  return (
    <>
      <SiteHeader title="Dashboard" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
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
          />
          <StatCard
            label="Total Teachers"
            value={data.stats.totalTeachers}
            delta="from current records"
            icon={Users}
          />
          <StatCard
            label="Total Classes"
            value={data.stats.totalClasses}
            delta="from current records"
            icon={Layers}
          />
          <StatCard
            label="Average Score"
            value={`${data.stats.avgScore.toFixed(1)}%`}
            delta="current average"
            icon={TrendingUp}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Payments Received"
            value={`${approvedPayments.length}`}
            delta="approved payments"
            icon={TrendingUp}
          />
          <StatCard
            label="Pending Payments"
            value={`${pendingPayments.length}`}
            delta="need review"
            icon={ClipboardList}
          />
          <StatCard
            label="Collected This Month"
            value={`${approvedPayments
              .reduce((total, payment) => total + payment.amount, 0)
              .toLocaleString()} ETB`}
            delta="approved total"
            icon={WalletCards}
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
              {data.subjects.slice(0, 4).map((sub) => (
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
                    {sub.avgScore}%
                  </span>
                </div>
              ))}
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
