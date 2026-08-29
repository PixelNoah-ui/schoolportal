// components/admin/rankings/completion-banner.tsx
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { periodLabel, type Period } from "@/lib/ranking-utils";

export function CompletionBanner({
  period,
  percent,
  pendingCount,
}: {
  period: Period;
  percent: number;
  pendingCount: number;
}) {
  if (pendingCount === 0) {
    return (
      <div className="flex items-center gap-2 border border-emerald-600/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
        <CheckCircle2 className="size-4 shrink-0" />
        <span>
          All grades are in for {periodLabel[period]}. Rankings below are final.
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 border border-amber-600/30 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
      <AlertTriangle className="size-4 shrink-0" />
      <span>
        {percent}% of grades submitted for {periodLabel[period]} —{" "}
        {pendingCount} class{pendingCount === 1 ? "" : "es"} still pending.
        Classes with incomplete grades show as &ldquo;not ranked&rdquo; until
        every subject teacher submits.
      </span>
    </div>
  );
}
