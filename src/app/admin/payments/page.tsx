"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import PaginationBar from "@/components/PaginationBar";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { SiteHeader } from "@/components/admin/site-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { payments, type PaymentStatus } from "@/lib/mock-data";

const statusVariant: Record<
  PaymentStatus,
  "default" | "secondary" | "destructive"
> = {
  approved: "default",
  pending: "secondary",
  rejected: "destructive",
};

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(
    () =>
      payments.filter((payment) => {
        const query = search.toLowerCase();
        const matchesSearch =
          payment.studentName.toLowerCase().includes(query) ||
          payment.studentNumber.toLowerCase().includes(query);
        const matchesStatus = status === "all" || payment.status === status;
        return matchesSearch && matchesStatus;
      }),
    [search, status],
  );

  return (
    <>
      <SiteHeader title="Payments" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <PageHeader eyebrow="Payment Records" count={payments.length} />
        <DataToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by student or number"
          filterOptions={[
            { label: "Pending", value: "pending" },
            { label: "Approved", value: "approved" },
            { label: "Rejected", value: "rejected" },
          ]}
          filterValue={status}
          onFilterChange={setStatus}
          filterLabel="All statuses"
        />
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Student</TableHead>
              <TableHead>Month</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((payment) => (
              <TableRow key={payment.id}>
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
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No payments match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <PaginationBar totalPage={3} currentPage={1} />
      </div>
    </>
  );
}
