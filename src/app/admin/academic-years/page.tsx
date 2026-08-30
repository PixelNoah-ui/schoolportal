"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAcademicYears, useCreateAcademicYear } from "@/hooks/use-academic-years";

export default function AcademicYearsPage() {
  const { data = [], isLoading } = useAcademicYears();
  const createAcademicYear = useCreateAcademicYear();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [semesters, setSemesters] = useState("Semester 1, Semester 2");

  const currentYear = useMemo(
    () => data.find((year) => year.isCurrent) ?? data[0],
    [data],
  );

  const handleSubmit = () => {
    if (!name.trim()) return;
    createAcademicYear.mutate({
      name,
      start_date: startDate,
      end_date: endDate,
      is_current: currentYear ? "false" : "true",
      semesters: JSON.stringify(
        semesters
          .split(",")
          .map((semester) => semester.trim())
          .filter(Boolean)
          .map((semesterName) => ({ name: semesterName })),
      ),
    });
    setName("");
    setStartDate("");
    setEndDate("");
    setSemesters("Semester 1, Semester 2");
  };

  return (
    <>
      <SiteHeader title="Academic years" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <PageHeader eyebrow="Academic management" count={data.length} />
        </div>

        <Card className="rounded-none shadow-none">
          <CardHeader className="border-b pb-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Create academic year
            </span>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="year-name">Name</Label>
                <Input
                  id="year-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="2026/2027"
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year-status">Current active year</Label>
                <Input
                  id="year-status"
                  value={currentYear ? currentYear.name : "No active year"}
                  disabled
                  className="rounded-none bg-muted/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year-start">Start date</Label>
                <Input
                  id="year-start"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year-end">End date</Label>
                <Input
                  id="year-end"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="year-semesters">Default semesters</Label>
                <Input
                  id="year-semesters"
                  value={semesters}
                  onChange={(event) => setSemesters(event.target.value)}
                  placeholder="Semester 1, Semester 2"
                  className="rounded-none"
                />
              </div>
            </div>

            <div className="flex items-end justify-end">
              <Button
                className="rounded-none"
                onClick={handleSubmit}
                disabled={createAcademicYear.isPending || !name.trim()}
              >
                <Plus className="size-4" />
                Create year
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            <div className="rounded-none border p-6 text-sm text-muted-foreground">
              Loading academic years...
            </div>
          ) : data.length === 0 ? (
            <div className="rounded-none border border-dashed p-6 text-sm text-muted-foreground">
              No academic years yet.
            </div>
          ) : (
            data.map((year) => (
              <div key={year.id} className="rounded-none border p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{year.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {year.startDate ?? "-"} → {year.endDate ?? "-"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {year.isCurrent && <Badge className="rounded-none">Active</Badge>}
                    {year.status === "completed" && (
                      <Badge variant="secondary" className="rounded-none">
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {year.semesters.length > 0 ? (
                    year.semesters.map((semester) => (
                      <Badge key={semester.id} variant="outline" className="rounded-none">
                        {semester.name}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="rounded-none">
                      No semesters yet
                    </Badge>
                  )}
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  Status: {year.status}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
