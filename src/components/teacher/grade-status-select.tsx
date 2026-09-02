import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GradeStatus } from "@/hooks/use-student-grades";

const LABELS: Record<GradeStatus, string> = {
  graded: "Graded",
  absent: "Absent",
  excused: "Excused",
  exempt: "Exempt",
  not_taken: "Not taken",
};

export function GradeStatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: GradeStatus;
  onChange: (status: GradeStatus) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as GradeStatus)} disabled={disabled}>
      <SelectTrigger className="h-8 w-[120px] rounded-none text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
