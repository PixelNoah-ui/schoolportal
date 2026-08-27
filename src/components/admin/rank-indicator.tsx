// components/admin/rank-indicator.tsx
import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export function RankIndicator({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
        <Trophy className="size-4" />
        <span className="text-sm font-semibold tabular-nums">{rank}</span>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center gap-1.5 text-zinc-500">
        <Medal className="size-4" />
        <span className="text-sm font-semibold tabular-nums">{rank}</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center gap-1.5 text-orange-700 dark:text-orange-500">
        <Award className="size-4" />
        <span className="text-sm font-semibold tabular-nums">{rank}</span>
      </div>
    );
  }
  return (
    <span className={cn("text-sm tabular-nums text-muted-foreground")}>
      {rank}
    </span>
  );
}
