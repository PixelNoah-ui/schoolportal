// components/admin/enrollment-chart.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { enrollmentByGrade } from "@/lib/mock-data";

export function EnrollmentChart() {
  const max = Math.max(...enrollmentByGrade.map((d) => d.count));

  return (
    <Card className="rounded-none shadow-none">
      <CardHeader className="border-b pb-4">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Enrollment by Grade
        </span>
        <p className="text-sm text-muted-foreground">{`Current academic year`}</p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-end justify-between gap-4 h-48">
          {enrollmentByGrade.map((row) => (
            <div
              key={row.grade}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <span className="text-xs font-medium tabular-nums text-muted-foreground">
                {row.count}
              </span>
              <div
                className="w-full bg-primary"
                style={{ height: `${(row.count / max) * 140}px` }}
              />
              <span className="text-xs text-muted-foreground">{row.grade}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
