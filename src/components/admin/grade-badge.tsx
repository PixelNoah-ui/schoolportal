// components/admin/grade-badge.tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { scoreToGrade } from "@/lib/mock-data";

export function GradeBadge({ score }: { score: number }) {
  const grade = scoreToGrade(score);
  const styles: Record<string, string> = {
    A: "border-emerald-600 text-emerald-700 dark:text-emerald-400",
    B: "border-blue-600 text-blue-700 dark:text-blue-400",
    C: "border-amber-600 text-amber-700 dark:text-amber-400",
    D: "border-orange-600 text-orange-700 dark:text-orange-400",
    F: "border-destructive text-destructive",
  };

  return (
    <Badge
      variant="outline"
      className={cn("rounded-none font-mono font-semibold", styles[grade])}
    >
      {grade}
    </Badge>
  );
}
