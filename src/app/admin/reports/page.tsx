"use client";

import {
  GraduationCap,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { SiteHeader } from "@/components/admin/site-header";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDashboard } from "@/hooks/use-dashboard";

export default function ReportsPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard();

  if (isLoading) {
    return (
      <>
        <SiteHeader title="Reports" />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <Skeleton className="h-4 w-40 rounded-none" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-none" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-none" />
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <SiteHeader title="Reports" />
        <div className="flex flex-1 items-center justify-center p-6">
          <Card className="w-full max-w-md rounded-none shadow-none">
            <CardContent className="p-8 text-center">
              <p className="text-sm font-semibold">Could not load report data</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : "Something went wrong while loading the report summary."}
              </p>
              <button
                type="button"
                className="mt-4 text-sm font-medium underline underline-offset-4"
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

  const approvedPayments = data.payments.filter(
    (payment) => payment.status === "approved",
  );
  const pendingPayments = data.payments.filter(
    (payment) => payment.status === "pending",
  );
  const rejectedPayments = data.payments.filter(
    (payment) => payment.status === "rejected",
  );
  const collectedRevenue = approvedPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );

  return (
    <>
      <SiteHeader title="Reports" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageHeader eyebrow="Executive summary" count={data.students.length} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Students"
            value={data.stats.totalStudents}
            delta="registered students"
            icon={GraduationCap}
          />
          <StatCard
            label="Total Teachers"
            value={data.stats.totalTeachers}
            delta="active teachers"
            icon={Users}
          />
          <StatCard
            label="Class Average"
            value={`${data.stats.avgScore.toFixed(1)}%`}
            delta="overall performance"
            icon={TrendingUp}
          />
          <StatCard
            label="Collected Revenue"
            value={`${collectedRevenue.toLocaleString()} ETB`}
            delta={`${approvedPayments.length} approved payments`}
            icon={WalletCards}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="rounded-none shadow-none">
            <CardHeader className="border-b pb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Enrollment by grade
              </span>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {data.enrollmentByGrade.map((row) => (
                <div key={row.grade} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{row.grade}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-28 overflow-hidden border bg-muted/40">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.min((row.count / 250) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm font-medium tabular-nums">
                      {row.count}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-none shadow-none">
            <CardHeader className="border-b pb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Payment status
              </span>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Approved</span>
                <span className="text-lg font-semibold tabular-nums">
                  {approvedPayments.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className="text-lg font-semibold tabular-nums">
                  {pendingPayments.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rejected</span>
                <span className="text-lg font-semibold tabular-nums">
                  {rejectedPayments.length}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none shadow-none">
            <CardHeader className="border-b pb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Campus snapshot
              </span>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Academic year</span>
                <span className="text-sm font-medium">{data.academicYear}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Semester</span>
                <span className="text-sm font-medium">{data.semester}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Classes</span>
                <span className="text-sm font-medium tabular-nums">
                  {data.stats.totalClasses}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-none shadow-none">
          <CardHeader className="border-b pb-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Subject performance
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Average</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.subjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>{subject.className}</TableCell>
                    <TableCell className="tabular-nums">
                      {subject.avgScore.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
