// components/admin/rankings/student-status-badge.tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StudentStanding } from "@/lib/mock-data";

const config: Record<StudentStanding, { label: string; className: string }> = {
  disciplinary: {
    label: "Disciplinary hold",
    className: "border-destructive text-destructive",
  },
  excused: {
    label: "Excused",
    className: "border-muted-foreground/40 text-muted-foreground",
  },
  withdrawn: {
    label: "Withdrawn",
    className: "border-muted-foreground/40 text-muted-foreground",
  },
};

export function StudentStatusBadge({
  standing,
  reason,
}: {
  standing: StudentStanding;
  reason: string;
}) {
  const c = config[standing];
  return (
    <Badge
      variant="outline"
      title={reason}
      className={cn("rounded-none font-normal", c.className)}
    >
      {c.label}
    </Badge>
  );
}
