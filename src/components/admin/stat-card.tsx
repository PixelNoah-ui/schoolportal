// components/admin/stat-card.tsx
import { type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  delta: string;
  icon: LucideIcon;
  positive?: boolean;
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  positive = true,
}: StatCardProps) {
  return (
    <Card className="rounded-none p-5 shadow-none">
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      <div
        className={cn(
          "mt-1 text-xs font-medium",
          positive
            ? "text-emerald-600 dark:text-emerald-500"
            : "text-destructive",
        )}
      >
        {delta}
      </div>
    </Card>
  );
}
