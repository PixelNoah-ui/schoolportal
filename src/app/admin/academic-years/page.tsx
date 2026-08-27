// app/admin/academic-years/page.tsx
import { SiteHeader } from "@/components/admin/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { academicYears } from "@/lib/mock-data";

export default function AcademicYearsPage() {
  return (
    <>
      <SiteHeader title="Academic Years" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <PageHeader
          eyebrow="Academic Calendar"
          count={academicYears.length}
          actionLabel="Add Academic Year"
        />

        <div className="flex flex-col gap-4">
          {academicYears.map((year) => (
            <Card key={year.id} className="rounded-none shadow-none">
              <CardHeader className="flex-row items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <p className="text-lg font-semibold tracking-tight">
                    {year.name}
                  </p>
                  {year.is_current && (
                    <Badge className="rounded-none bg-primary text-primary-foreground">
                      Current
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {year.start_date} — {year.end_date}
                </span>
              </CardHeader>
              <CardContent className="grid grid-cols-1 divide-y p-0 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                {year.semesters.map((s) => (
                  <div key={s.name} className="p-4">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {s.name}
                    </span>
                    <p className="mt-1 text-sm">
                      {s.start_date} — {s.end_date}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
