// components/admin/payment-review-dialog.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { PaymentRow } from "@/lib/mock-data";

interface PaymentReviewDialogProps {
  payment: PaymentRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

export function PaymentReviewDialog({
  payment,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: PaymentReviewDialogProps) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  if (!payment) return null;

  const close = () => {
    setRejecting(false);
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) close();
        else onOpenChange(o);
      }}
    >
      <DialogContent className="rounded-none sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review payment</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
          {/* Screenshot proof */}
          <div className="space-y-2">
            <a
              href={payment.screenshotUrl}
              target="_blank"
              rel="noreferrer"
              className="group relative block overflow-hidden rounded-none border"
            >
              <Image
                src={payment.screenshotUrl}
                alt="Payment proof screenshot"
                fill
                sizes="220px"
                className="object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                <ExternalLink className="size-5 text-white" />
              </span>
            </a>
            <p className="text-center text-xs text-muted-foreground">
              Click to view full size
            </p>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">{payment.studentName}</p>
              <p className="text-xs text-muted-foreground">
                {payment.studentNumber} · {payment.className}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-medium tabular-nums">
                  {payment.amount.toLocaleString()} ETB
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">For month</p>
                <p className="font-medium">{payment.paymentMonth}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Method</p>
                <p className="font-medium capitalize">
                  {payment.paymentMethod}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="font-medium">{payment.submittedAt}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge
                variant={
                  payment.status === "approved"
                    ? "default"
                    : payment.status === "rejected"
                      ? "destructive"
                      : "secondary"
                }
                className="mt-1 rounded-none capitalize"
              >
                {payment.status}
              </Badge>
            </div>

            {payment.status === "rejected" && payment.rejectionReason && (
              <div className="rounded-none border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-xs font-medium text-destructive">
                  Rejection reason
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {payment.rejectionReason}
                </p>
              </div>
            )}

            {payment.status === "pending" && rejecting && (
              <div className="space-y-2">
                <p className="text-xs font-medium">
                  Reason for rejection (shown to the student)
                </p>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Screenshot doesn't show the amount clearly"
                  className="rounded-none"
                  rows={3}
                />
              </div>
            )}
          </div>
        </div>

        {payment.status === "pending" && (
          <DialogFooter className="gap-2 sm:gap-2">
            {!rejecting ? (
              <>
                <Button
                  variant="outline"
                  className="rounded-none"
                  onClick={() => setRejecting(true)}
                >
                  <XCircle className="size-4" />
                  Reject
                </Button>
                <Button
                  className="rounded-none"
                  onClick={() => {
                    onApprove(payment.id);
                    close();
                  }}
                >
                  <CheckCircle2 className="size-4" />
                  Approve payment
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="rounded-none"
                  onClick={() => setRejecting(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-none"
                  disabled={!reason.trim()}
                  onClick={() => {
                    onReject(payment.id, reason.trim());
                    close();
                  }}
                >
                  Confirm rejection
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
