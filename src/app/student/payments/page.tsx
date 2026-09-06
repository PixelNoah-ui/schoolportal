"use client";

import { FormEvent, useState } from "react";
import { Banknote, Building2, CircleHelp, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StudentSiteHeader } from "@/components/student/site-header";
import {
  usePaymentOptions,
  useSubmitStudentPayment,
} from "@/hooks/use-student-portal";

const methodIcons = {
  bank_transfer: Building2,
  mobile_money: Smartphone,
  cash: Banknote,
  other: CircleHelp,
} as const;

export default function StudentPaymentsPage() {
  const options = usePaymentOptions();
  const submit = useSubmitStudentPayment();
  const [selectedOption, setSelectedOption] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const submitPayment = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    const option = options.data?.find((item) => item.id === selectedOption);
    if (!option || !proof || !amount || !month) {
      setMessage("Choose a payment option and attach your receipt.");
      return;
    }

    try {
      await submit.mutateAsync({
        amount: Number(amount),
        paymentMonth: month,
        paymentMethod: option.paymentMethod,
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

  return (
    <>
      <StudentSiteHeader
        title="Payments"
        subtitle="Available payment methods"
      />
      <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-6">
        <section className="border-l-4 border-primary bg-background p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Payment information
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Choose a payment method
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Use one of the options below and keep your payment reference for
            your records.
          </p>
        </section>

        {options.isLoading && (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-48 w-full rounded-none" />
            ))}
          </div>
        )}

        {options.isError && (
          <Card className="rounded-none shadow-none">
            <CardContent className="p-6 text-sm text-destructive">
              Could not load payment options. Please contact the school office.
            </CardContent>
          </Card>
        )}

        {!options.isLoading &&
          !options.isError &&
          options.data?.length === 0 && (
            <Card className="rounded-none shadow-none">
              <CardContent className="p-6 text-sm text-muted-foreground">
                No payment options are available yet.
              </CardContent>
            </Card>
          )}

        {!options.isLoading &&
          !options.isError &&
          options.data &&
          options.data.length > 0 && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {options.data.map((option) => {
                  const Icon =
                    methodIcons[
                      option.paymentMethod as keyof typeof methodIcons
                    ] ?? CircleHelp;
                  return (
                    <Card
                      key={option.id}
                      className={`rounded-none shadow-none ${selectedOption === option.id ? "border-primary ring-1 ring-primary" : ""}`}
                    >
                      <CardHeader className="border-b">
                        <div className="flex items-start gap-3">
                          <div className="flex size-10 items-center justify-center bg-primary/10 text-primary">
                            {option.iconUrl ? (
                              <span
                                aria-hidden="true"
                                className="size-8 bg-contain bg-center bg-no-repeat"
                                style={{
                                  backgroundImage: `url(${option.iconUrl})`,
                                }}
                              />
                            ) : (
                              <Icon className="size-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{option.name}</p>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              {option.paymentMethod.replace("_", " ")}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant={
                            selectedOption === option.id ? "default" : "outline"
                          }
                          size="sm"
                          className="mt-3 w-full rounded-none"
                          onClick={() => setSelectedOption(option.id)}
                        >
                          {selectedOption === option.id
                            ? "Selected"
                            : "Use this option"}
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-3 p-5 text-sm">
                        {option.accountName && (
                          <div className="flex justify-between gap-4 border-b pb-2">
                            <span className="text-muted-foreground">
                              Account name
                            </span>
                            <span className="text-right font-medium">
                              {option.accountName}
                            </span>
                          </div>
                        )}
                        {option.accountNumber && (
                          <div className="flex justify-between gap-4 border-b pb-2">
                            <span className="text-muted-foreground">
                              Account number
                            </span>
                            <span className="text-right font-medium">
                              {option.accountNumber}
                            </span>
                          </div>
                        )}
                        {option.phoneNumber && (
                          <div className="flex justify-between gap-4 border-b pb-2">
                            <span className="text-muted-foreground">
                              Phone number
                            </span>
                            <span className="text-right font-medium">
                              {option.phoneNumber}
                            </span>
                          </div>
                        )}
                        {option.instructions && (
                          <p className="pt-1 text-muted-foreground">
                            {option.instructions}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <Card className="mt-6 rounded-none shadow-none">
                <CardHeader className="border-b">
                  <p className="font-semibold">Upload payment receipt</p>
                  <p className="text-sm text-muted-foreground">
                    Select a payment option, then upload your receipt for
                    review.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={submitPayment} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="payment-month">Payment month</Label>
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
                        <Label htmlFor="payment-amount">Amount</Label>
                        <Input
                          id="payment-amount"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={amount}
                          onChange={(event) => setAmount(event.target.value)}
                          required
                          className="rounded-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-proof">Receipt file</Label>
                      <Input
                        id="payment-proof"
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
                      <Label htmlFor="payment-note">Note</Label>
                      <Textarea
                        id="payment-note"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Reference number or note"
                        className="rounded-none"
                      />
                    </div>
                    {message && (
                      <p className="text-sm text-muted-foreground">{message}</p>
                    )}
                    <Button
                      type="submit"
                      disabled={submit.isPending}
                      className="rounded-none"
                    >
                      {submit.isPending ? "Submitting..." : "Submit receipt"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </>
          )}
      </main>
    </>
  );
}
