import { Circle, Lock, CheckCircle2 } from "lucide-react";
import type { StructureStatus } from "@/hooks/use-teacher-classes";

const CONFIG: Record<StructureStatus, { label: string; className: string; icon: typeof Circle }> = {
  not_started: {
    label: "Not started",
    className: "text-muted-foreground border-border",
    icon: Circle,
  },
  draft: {
    label: "Draft",
    className: "text-amber-700 border-amber-200 bg-amber-50",
    icon: Circle,
  },
  in_progress: {
    label: "In progress",
    className: "text-blue-700 border-blue-200 bg-blue-50",
    icon: Circle,
  },
  submitted: {
    label: "Submitted",
    className: "text-emerald-700 border-emerald-200 bg-emerald-50",
    icon: CheckCircle2,
  },
  locked: {
    label: "Locked",
    className: "text-muted-foreground border-border bg-muted/40",
    icon: Lock,
  },
};

export function StructureStatusBadge({ status }: { status: StructureStatus }) {
  const { label, className, icon: Icon } = CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-medium ${className}`}>
      <Icon className="size-3" />
      {label}
    </span>
  );
}
