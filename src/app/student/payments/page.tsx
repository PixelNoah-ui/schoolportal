"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Upload } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentSiteHeader } from "@/components/student/site-header";
import {
  useStudentPayments,
  useSubmitStudentPayment,
} from "@/hooks/use-student-portal";

const monthNow = new Date().toISOString().slice(0, 7);
const statusIcon = {
  approved: CheckCircle2,
  pending: Clock,
  rejected: AlertTriangle,
};

export default function StudentPaymentsPage() {
  const payments = useStudentPayments();
  const submit = useSubmitStudentPayment();
  const [month, setMonth] = useState(monthNow);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [note, setNote] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    if (!proof || !method) {
      setMessage("Choose a payment method and attach your receipt.");
      return;
    }
    try {
      await submit.mutateAsync({
        amount: Number(amount),
        paymentMonth: month,
        paymentMethod: method,
        note,
        proof,
      });
      setAmount("");
      setNote("");
      setProof(null);
      setMessage("Payment submitted for review.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not submit payment.",
      );
    }
  };
  const paidThisMonth = payments.data?.find((item) =>
    item.paymentMonth.startsWith(month),
  );
  return (
    <>
      <StudentSiteHeader
        title="Payments"
        subtitle="Monthly tuition and payment receipts"
      />
      <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-6">
        <section
          className={`border-l-4 p-5 ${paidThisMonth?.status === "approved" ? "border-emerald-500 bg-emerald-50/70" : "border-amber-500 bg-amber-50/70"}`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {month} payment cycle
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            {paidThisMonth?.status === "approved"
              ? "Payment approved"
              : paidThisMonth?.status === "pending"
                ? "Payment under review"
                : "Monthly payment is due"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {paidThisMonth?.status === "approved"
              ? "Your account is up to date for this month."
              : "Submit your payment receipt before the monthly due date."}
          </p>
        </section>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <Card className="rounded-none shadow-none">
            <CardHeader className="border-b">
              <p className="font-semibold">Submit payment</p>
              <p className="text-sm text-muted-foreground">
                Upload a clear screenshot or receipt for admin review.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="payment-month">Month</Label>
                    <Input
                      id="payment-month"
                      type="month"
                      value={month}
                      onChange={(event) => setMonth(event.target.value)}
                      required
                      className="rounded-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      required
                      placeholder="0.00"
                      className="rounded-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Payment method</Label>
                  <Select
                    value={method}
                    onValueChange={(value) => setMethod(value ?? "")}
                  >
                    <SelectTrigger className="w-full rounded-none">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank transfer</SelectItem>
                      <SelectItem value="telebirr">Telebirr</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proof">Receipt screenshot</Label>
                  <Input
                    id="proof"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(event) =>
                      setProof(event.target.files?.[0] ?? null)
                    }
                    required
                    className="rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">
                    Note{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Add a reference number or note"
                    className="rounded-none"
                  />
                </div>
                {message && (
                  <p
                    className={`text-sm ${message.includes("submitted") ? "text-emerald-700" : "text-destructive"}`}
                  >
                    {message}
                  </p>
                )}
                <Button
                  disabled={submit.isPending}
                  className="w-full rounded-none"
                >
                  <Upload />
                  {submit.isPending ? "Submitting..." : "Submit for review"}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card className="rounded-none shadow-none">
            <CardHeader className="border-b">
              <p className="font-semibold">Payment history</p>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {payments.isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading payment history...
                </p>
              ) : payments.data?.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No payments submitted yet.
                </p>
              ) : (
                payments.data?.map((payment) => {
                  const Icon = statusIcon[payment.status];
                  return (
                    <div key={payment.id} className="border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            {payment.paymentMonth.slice(0, 7)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {payment.amount.toLocaleString()} ·{" "}
                            {payment.paymentMethod ?? "Payment"}
                          </p>
                        </div>
                        <Badge
                          variant={
                            payment.status === "rejected"
                              ? "destructive"
                              : payment.status === "approved"
                                ? "default"
                                : "secondary"
                          }
                        >
                          <Icon />
                          {payment.status}
                        </Badge>
                      </div>
                      {payment.rejectionReason && (
                        <p className="mt-3 border-t pt-3 text-sm text-destructive">
                          Reason: {payment.rejectionReason}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
