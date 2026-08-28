// components/admin/rankings/student-status-badge.tsx
import { Ban, CalendarOff, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { StudentStanding } from "@/lib/mock-data";

const config: Record<
  StudentStanding,
  { label: string; icon: typeof Ban; className: string }
> = {
  disciplinary: {
    label: "Disciplinary hold",
    icon: Ban,
    className: "border-destructive text-destructive",
  },
  excused: {
    label: "Excused",
    icon: CalendarOff,
    className: "border-blue-600 text-blue-700 dark:text-blue-400",
  },
  withdrawn: {
    label: "Withdrawn",
    icon: LogOut,
    className: "border-muted-foreground text-muted-foreground",
  },
};

export function StudentStatusBadge({
  standing,
  reason,
}: {
  standing: StudentStanding;
  reason?: string;
}) {
  const { label, icon: Icon, className } = config[standing];
  const badge = (
    <Badge
      variant="outline"
      className={cn("gap-1 rounded-none font-normal", className)}
    >
      <Icon className="size-3" />
      {label}
    </Badge>
  );

  if (!reason) return badge;

  return (
    <Tooltip>
      <TooltipTrigger render={badge} />
      <TooltipContent className="max-w-64 text-xs">{reason}</TooltipContent>
    </Tooltip>
  );
}
