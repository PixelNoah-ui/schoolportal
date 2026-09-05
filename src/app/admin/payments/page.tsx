// app/.../payments/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Bell,
  Eye,
  CreditCard,
} from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PaginationBar from "@/components/PaginationBar";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { SiteHeader } from "@/components/admin/site-header";
import { PaymentReviewDialog } from "@/components/admin/payment-review-dialog";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { EntityEmptyState } from "@/components/admin/entity-empty-state";
import { useClassOptions } from "@/hooks/use-classes";
import {
  usePaymentStudents,
  usePayments,
  useUpdatePaymentStatus,
} from "@/hooks/use-payments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaymentRow, PaymentStatus } from "@/lib/mock-data";

const currentPaymentMonth = new Date().toISOString().slice(0, 7);
const monthlyTuitionFee = 2500;
const emptyPayments: PaymentRow[] = [];
const emptyClasses: {
  id: string;
  name: string;
  grade: number;
  section: string;
}[] = [];

function formatMonth(month: string) {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function StatCardSkeleton() {
  return <div className="h-24 animate-pulse border bg-muted/30" />;
}

function daysOverdue(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const dueDate = new Date(year, monthNumber - 1, 5);
  return Math.max(Math.floor((Date.now() - dueDate.getTime()) / 86_400_000), 0);
}

const statusVariant: Record<
  PaymentStatus,
  "default" | "secondary" | "destructive"
> = {
  approved: "default",
  pending: "secondary",
  rejected: "destructive",
};

type Tab = "pending" | "all" | "overdue";
type PaymentFilterStatus = "all" | PaymentStatus;
const PAGE_SIZE = 6;

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof TrendingUp;
  tone?: "default" | "warn" | "good";
}) {
  const toneClasses = {
    default: "text-foreground",
    warn: "text-amber-600",
    good: "text-emerald-600",
  }[tone];

  return (
    <div className="flex items-start justify-between gap-3 border p-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p
          className={`mt-1 text-2xl font-semibold tabular-nums ${toneClasses}`}
        >
          {value}
        </p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
      <Icon className={`size-5 ${toneClasses}`} />
    </div>
  );
}

export default function PaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParam = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(searchParam);
  const debouncedSearch = useDebouncedValue(searchInput);
  const selectedMonth = searchParams.get("month") ?? currentPaymentMonth;
  const classFilter = searchParams.get("class") ?? "all";
  const statusFilter = (searchParams.get("status") ??
    "all") as PaymentFilterStatus;
  const tab = (searchParams.get("tab") ?? "pending") as Tab;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const backendStatus = tab === "pending" ? "pending" : statusFilter;
  const paymentsQuery = usePayments({
    month: selectedMonth,
    classId: classFilter,
    status: backendStatus,
    search: debouncedSearch,
    page,
    pageSize: PAGE_SIZE,
  });
  const studentsQuery = usePaymentStudents();
  const classesQuery = useClassOptions();
  const updatePayment = useUpdatePaymentStatus();
  const payments = paymentsQuery.data?.payments ?? emptyPayments;
  const classes = classesQuery.data ?? emptyClasses;
  const [reviewPayment, setReviewPayment] = useState<PaymentRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const updateQuery = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams);
      if (!value || value === "all" || (key === "tab" && value === "pending"))
        next.delete(key);
      else next.set(key, value);
      if (key !== "page") next.delete("page");
      router.replace(`?${next.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (debouncedSearch !== searchParam) updateQuery("search", debouncedSearch);
  }, [debouncedSearch, searchParam, updateQuery]);

  const monthOptions = useMemo(() => {
    const months = new Set(
      payments.flatMap((payment) =>
        payment.coveredMonths?.length
          ? payment.coveredMonths
          : [payment.paymentMonth],
      ),
    );
    months.add(currentPaymentMonth);
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [payments]);

  const overdueStudents = useMemo(() => {
    return (studentsQuery.data ?? []).filter((student) => {
      const covered = student.payments.some((payment) => {
        const months = payment.payment_month_allocations?.map((allocation) =>
          allocation.payment_month.slice(0, 7),
        ) ?? [payment.payment_month.slice(0, 7)];
        return (
          months.includes(selectedMonth) &&
          ["approved", "pending"].includes(payment.status)
        );
      });
      return !covered;
    });
  }, [selectedMonth, studentsQuery.data]);

  const stats = useMemo(() => {
    const thisMonth = payments.filter(
      (p) =>
        p.paymentMonth === selectedMonth ||
        p.coveredMonths?.includes(selectedMonth),
    );
    const collected = thisMonth
      .filter((p) => p.status === "approved")
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingCount = thisMonth.filter((p) => p.status === "pending").length;
    const expectedTotal =
      (thisMonth.length + overdueStudents.length) * monthlyTuitionFee || 1;
    const collectionRate = Math.round(
      (thisMonth.filter((p) => p.status === "approved").length /
        (thisMonth.length + overdueStudents.length || 1)) *
        100,
    );
    return { collected, pendingCount, collectionRate, expectedTotal };
  }, [payments, overdueStudents, selectedMonth]);

  const filtered = payments;

  const isLoading =
    paymentsQuery.isLoading ||
    studentsQuery.isLoading ||
    classesQuery.isLoading;
  const totalPage = paymentsQuery.data?.totalPages ?? 1;
  const pageRows = filtered;
  const hasFilters =
    Boolean(searchParam) ||
    classFilter !== "all" ||
    statusFilter !== "all" ||
    selectedMonth !== currentPaymentMonth;

  const clearFilters = () => {
    setSearchInput("");
    router.replace("?");
  };

  const openReview = (payment: PaymentRow) => {
    setReviewPayment(payment);
    setDialogOpen(true);
  };

  const handleApprove = (id: string) =>
    updatePayment.mutate({ id, status: "approved" });

  const handleReject = (id: string, reason: string) =>
    updatePayment.mutate({ id, status: "rejected", rejectionReason: reason });

  return (
    <>
      <SiteHeader title="Payments" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <PageHeader
            eyebrow="Monthly Payment Review"
            count={
              payments.filter(
                (p) =>
                  p.paymentMonth === selectedMonth ||
                  p.coveredMonths?.includes(selectedMonth),
              ).length
            }
          />
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Payment month
            </span>
            <Select
              value={selectedMonth}
              onValueChange={(value) => {
                if (value !== null) {
                  updateQuery("month", value);
                }
              }}
            >
              <SelectTrigger className="w-40 rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem key={month} value={month}>
                    {formatMonth(month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label={`Collected · ${selectedMonth}`}
              value={`${stats.collected.toLocaleString()} ETB`}
              icon={TrendingUp}
              tone="good"
            />
            <StatCard
              label="Awaiting review"
              value={String(stats.pendingCount)}
              sub="Screenshots to check"
              icon={Clock}
              tone={stats.pendingCount > 0 ? "warn" : "default"}
            />
            <StatCard
              label="Overdue students"
              value={String(overdueStudents.length)}
              sub="No payment submitted"
              icon={AlertTriangle}
              tone={overdueStudents.length > 0 ? "warn" : "default"}
            />
            <StatCard
              label="Collection rate"
              value={`${stats.collectionRate}%`}
              icon={CheckCircle2}
            />
          </div>
        )}

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => updateQuery("tab", v)}>
          <TabsList className="rounded-none">
            <TabsTrigger value="pending" className="rounded-none">
              Pending Review
              {stats.pendingCount > 0 && (
                <Badge variant="secondary" className="ml-2 rounded-none px-1.5">
                  {stats.pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-none">
              All Payments
            </TabsTrigger>
            <TabsTrigger value="overdue" className="rounded-none">
              Overdue
              {overdueStudents.length > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 rounded-none px-1.5"
                >
                  {overdueStudents.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {tab !== "overdue" && (
          <>
            <DataToolbar
              searchValue={searchInput}
              onSearchChange={(value) => {
                setSearchInput(value);
              }}
              searchPlaceholder="Search by student or number"
              filterOptions={classes.map((c) => ({
                label: `${c.name} · Grade ${c.grade}${c.section}`,
                value: c.id,
              }))}
              filterValue={classFilter}
              onFilterChange={(value) => {
                updateQuery("class", value);
              }}
              filterLabel="All classes"
            />

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Status
              </span>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  if (value !== null) {
                    updateQuery("status", value);
                  }
                }}
              >
                <SelectTrigger className="w-36 rounded-none">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              {isLoading ? (
                <TableSkeleton rows={6} columns={8} />
              ) : (
                <TableBody>
                  {pageRows.map((payment) => (
                    <TableRow
                      key={payment.id}
                      className="cursor-pointer"
                      onClick={() => openReview(payment)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {payment.studentName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {payment.studentNumber}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.className}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.coveredMonths?.length
                          ? `${payment.coveredMonths.length} months`
                          : payment.paymentMonth}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {payment.amount.toLocaleString()} ETB
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {payment.paymentMethod}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.submittedAt}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariant[payment.status]}
                          className="rounded-none capitalize"
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            openReview(payment);
                          }}
                        >
                          <Eye className="size-4" />
                          {payment.status === "pending" ? "Review" : "View"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
            {!isLoading && filtered.length === 0 && (
              <EntityEmptyState
                icon={CreditCard}
                entityLabel="payment"
                hasFilters={hasFilters}
                onClearFilters={hasFilters ? clearFilters : undefined}
                description="Payments submitted by students will appear here for review."
              />
            )}
            {!isLoading && filtered.length > 0 && (
              <PaginationBar totalPage={totalPage} currentPage={page} />
            )}
          </>
        )}

        {tab === "overdue" && (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Amount due</TableHead>
                <TableHead>Days overdue</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdueStudents.map((student) => {
                const overdue = daysOverdue(selectedMonth);
                return (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {student.full_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {student.student_number ?? ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {student.className}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {monthlyTuitionFee.toLocaleString()} ETB
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={overdue > 7 ? "destructive" : "secondary"}
                        className="rounded-none tabular-nums"
                      >
                        {overdue} {overdue === 1 ? "day" : "days"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-none"
                      >
                        <Bell className="size-4" />
                        Send reminder
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {overdueStudents.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Everyone&apos;s paid for {selectedMonth}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <PaymentReviewDialog
        payment={reviewPayment}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}
