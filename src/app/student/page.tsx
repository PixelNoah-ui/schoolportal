"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentSiteHeader } from "@/components/student/site-header";
import {
  useStudentPayments,
  useStudentResults,
} from "@/hooks/use-student-portal";

export default function StudentOverview() {
  const results = useStudentResults({});
  const payments = useStudentPayments();
  const latest = results.data?.slice(0, 3) ?? [];
  const paymentRecords = payments.data ?? [];
  const outstanding = payments.data?.find(
    (payment) => payment.status === "rejected",
  );

  const formatPaymentMonth = (month: string) => {
    const date = new Date(`${month.slice(0, 7)}-01T00:00:00`);
    return Number.isNaN(date.getTime())
      ? month
      : new Intl.DateTimeFormat("en", {
          month: "long",
          year: "numeric",
        }).format(date);
  };

  const paymentStatusVariant: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    approved: "default",
    pending: "secondary",
    rejected: "destructive",
  } as const;
  const paymentMonths = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - index);
    return date.toISOString().slice(0, 7);
  });
  const recordedMonths = paymentRecords.map((payment) =>
    payment.paymentMonth.slice(0, 7),
  );
  const monthsToShow = [
    ...paymentMonths,
    ...recordedMonths.filter((month) => !paymentMonths.includes(month)),
  ];
  return (
    <>
      <StudentSiteHeader
        title="Welcome back"
        subtitle="Your learning and account overview"
      />
      <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-6">
        <section className="border-l-4 border-primary bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Student space
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Everything important, in one place.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Review your latest academic results and keep your monthly payments
            up to date.
          </p>
        </section>
        {outstanding && (
          <Card className="rounded-none border-destructive/30 shadow-none">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-destructive">
                  Payment needs attention
                </p>
                <p className="text-sm text-muted-foreground">
                  {outstanding.rejectionReason ||
                    "Your latest payment was rejected."}
                </p>
              </div>
              <Link href="/student/payments">
                <Button variant="outline" className="rounded-none">
                  Review payment <ArrowRight />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/student/results">
            <Card className="h-full rounded-none shadow-none transition-colors hover:border-primary">
              <CardContent className="p-6">
                <BookOpen className="size-6 text-primary" />
                <p className="mt-5 text-lg font-semibold">My Results</p>
                <div className="mt-1 text-sm text-muted-foreground">
                  {results.isLoading ? (
                    <Skeleton className="h-4 w-40 rounded-none" />
                  ) : (
                    `${results.data?.length ?? 0} subject results available`
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/student/payments">
            <Card className="h-full rounded-none shadow-none transition-colors hover:border-primary">
              <CardContent className="p-6">
                <CreditCard className="size-6 text-primary" />
                <p className="mt-5 text-lg font-semibold">Payments</p>
                <div className="mt-1 text-sm text-muted-foreground">
                  {payments.isLoading ? (
                    <Skeleton className="h-4 w-32 rounded-none" />
                  ) : (
                    `${payments.data?.length ?? 0} payment records`
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
        {latest.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Latest results</h3>
              <Link
                href="/student/results"
                className="text-sm text-primary underline underline-offset-4"
              >
                View all
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {latest.map((result) => (
                <Card key={result.id} className="rounded-none shadow-none">
                  <CardContent className="p-4">
                    <p className="font-medium">{result.subject}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {result.className} · {result.semester}
                    </p>
                    <p className="mt-5 text-2xl font-semibold">
                      {result.score == null
                        ? "—"
                        : `${result.score}/${result.maxScore}`}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Monthly payment status</h3>
            <Link
              href="/student/payments"
              className="text-sm text-primary underline underline-offset-4"
            >
              Submit payment
            </Link>
          </div>
          {payments.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-16 w-full rounded-none" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {monthsToShow.map((month) => {
                const payment = paymentRecords.find(
                  (record) => record.paymentMonth.slice(0, 7) === month,
                );
                const card = (
                  <Card className="rounded-none shadow-none">
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">
                          {formatPaymentMonth(month)}
                        </p>
                        {payment ? (
                          <p className="text-sm text-muted-foreground">
                            {payment.amount.toLocaleString()} ETB
                            {payment.paymentMethod
                              ? ` · ${payment.paymentMethod.replace("_", " ")}`
                              : ""}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No payment submitted · Click to submit
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          payment
                            ? paymentStatusVariant[payment.status]
                            : "outline"
                        }
                        className="w-fit rounded-none capitalize"
                      >
                        {payment?.status ?? "not submitted"}
                      </Badge>
                    </CardContent>
                  </Card>
                );

                return payment ? (
                  <div key={month}>{card}</div>
                ) : (
                  <Link
                    key={month}
                    href={`/student/payments?month=${encodeURIComponent(month)}`}
                    className="block transition-colors hover:border-primary"
                  >
                    {card}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
