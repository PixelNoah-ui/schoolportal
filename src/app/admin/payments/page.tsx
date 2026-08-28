// app/.../payments/page.tsx
"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Bell,
  Eye,
} from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PaginationBar from "@/components/PaginationBar";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { SiteHeader } from "@/components/admin/site-header";
import { PaymentReviewDialog } from "@/components/admin/payment-review-dialog";
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
  payments as initialPayments,
  classes,
  currentPaymentMonth,
  monthlyTuitionFee,
  getOverdueStudents,
  daysOverdue,
  type PaymentRow,
  type PaymentStatus,
} from "@/lib/mock-data";

const statusVariant: Record<
  PaymentStatus,
  "default" | "secondary" | "destructive"
> = {
  approved: "default",
  pending: "secondary",
  rejected: "destructive",
};

type Tab = "pending" | "all" | "overdue";

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
  const [payments, setPayments] = useState<PaymentRow[]>(initialPayments);
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [classFilter, setClassFilter] = useState("all");
  const [reviewPayment, setReviewPayment] = useState<PaymentRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const overdueStudents = useMemo(
    () => getOverdueStudents(currentPaymentMonth),
    [],
  );

  const stats = useMemo(() => {
    const thisMonth = payments.filter(
      (p) => p.paymentMonth === currentPaymentMonth,
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
  }, [payments, overdueStudents]);

  const filtered = useMemo(() => {
    const query = debouncedSearch.toLowerCase();
    return payments.filter((p) => {
      const matchesSearch =
        p.studentName.toLowerCase().includes(query) ||
        p.studentNumber.toLowerCase().includes(query);
      const matchesClass = classFilter === "all" || p.classId === classFilter;
      const matchesStatus = tab === "pending" ? p.status === "pending" : true;
      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [payments, debouncedSearch, classFilter, tab]);

  const openReview = (payment: PaymentRow) => {
    setReviewPayment(payment);
    setDialogOpen(true);
  };

  const handleApprove = (id: string) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "approved",
              reviewedBy: "Admin",
              reviewedAt: "Today",
            }
          : p,
      ),
    );
  };

  const handleReject = (id: string, reason: string) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "rejected",
              rejectionReason: reason,
              reviewedBy: "Admin",
              reviewedAt: "Today",
            }
          : p,
      ),
    );
  };

  return (
    <>
      <SiteHeader title="Payments" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <PageHeader eyebrow="Monthly Payment Review" count={payments.length} />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label={`Collected · ${currentPaymentMonth}`}
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

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
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
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search by student or number"
              filterOptions={classes.map((c) => ({
                label: `${c.name} · Grade ${c.grade}${c.section}`,
                value: c.id,
              }))}
              filterValue={classFilter}
              onFilterChange={setClassFilter}
              filterLabel="All classes"
            />

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
              <TableBody>
                {filtered.map((payment) => (
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
                      {payment.paymentMonth}
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
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      {tab === "pending"
                        ? "Nothing waiting on review — you're caught up."
                        : "No payments match your filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <PaginationBar totalPage={3} currentPage={1} />
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
                const overdue = daysOverdue(currentPaymentMonth);
                return (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {student.profile.full_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {student.student_number}
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
                    Everyone&apos;s paid for {currentPaymentMonth}. 🎉
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
