// components/admin/rankings/completion-banner.tsx
import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { periodLabel, type Period } from "@/utils/supabase/ranking-utils";

interface CompletionBannerProps {
  period: Period;
  percent: number;
  pendingCount: number;
}

export function CompletionBanner({
  period,
  percent,
  pendingCount,
}: CompletionBannerProps) {
  if (pendingCount === 0) {
    return (
      <div className="flex items-center gap-2 border border-emerald-600/30 bg-emerald-600/5 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="size-4 shrink-0" />
        <span>
          All grades submitted for {periodLabel[period]} — rankings are final.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 border border-amber-600/30 bg-amber-600/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-400 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <span>
          Grades {percent}% submitted for {periodLabel[period]} — rankings shown
          are <strong className="font-semibold">provisional</strong> and may
          change as {pendingCount} {pendingCount === 1 ? "class" : "classes"}{" "}
          finish entry.
        </span>
      </div>
      <Link
        href="/admin/rankings/submissions"
        className={buttonVariants({
          variant: "outline",
          size: "sm",
          className:
            "rounded-none border-amber-600/40 text-amber-800 hover:bg-amber-600/10 dark:text-amber-400",
        })}
      >
        View submission status
      </Link>
    </div>
  );
}
