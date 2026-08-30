"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { SiteHeader } from "@/components/admin/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SemesterRow = {
  id: string;
  name: string;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  academic_years?: { name: string }[];
};

export default function SemestersPage() {
  const [years, setYears] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [rows, setRows] = useState<SemesterRow[]>([]);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("grading_open");

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: yearData } = await supabase
        .from("academic_years")
        .select("id, name")
        .order("start_date", { ascending: false });
      if (yearData) {
        setYears(yearData);
        if (!selectedYear && yearData[0]) setSelectedYear(yearData[0].id);
      }

      if (selectedYear) {
        const { data } = await supabase
          .from("semesters")
          .select("id, name, status, start_date, end_date, academic_years(name)")
          .eq("academic_year_id", selectedYear)
          .order("start_date", { ascending: true });
        setRows((data ?? []) as SemesterRow[]);
      }
    };

    void fetchData();
  }, [selectedYear]);

  const handleCreate = async () => {
    if (!selectedYear || !name.trim()) return;
    const supabase = createClient();
    const { error } = await supabase.from("semesters").insert({
      academic_year_id: selectedYear,
      name: name.trim(),
      start_date: startDate || null,
      end_date: endDate || null,
      status,
    });
    if (error) {
      // no toast support; show via wall message in page state if needed
      return;
    }
    setName("");
    setStartDate("");
    setEndDate("");
    setStatus("grading_open");
    const { data } = await supabase
      .from("semesters")
      .select("id, name, status, start_date, end_date, academic_years(name)")
      .eq("academic_year_id", selectedYear)
      .order("start_date", { ascending: true });
    setRows((data ?? []) as SemesterRow[]);
  };

  return (
    <>
      <SiteHeader title="Semesters" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <PageHeader eyebrow="Academic timeline" count={rows.length} />
        </div>

        <Card className="rounded-none shadow-none">
          <CardHeader className="border-b pb-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Create semester
            </span>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Academic year</Label>
                <Select
                  value={selectedYear}
                  onValueChange={(value) => setSelectedYear(value ?? "")}
                >
                  <SelectTrigger className="w-full rounded-none">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="semester-name">Name</Label>
                <Input
                  id="semester-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Semester 1"
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester-start">Start date</Label>
                <Input
                  id="semester-start"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester-end">End date</Label>
                <Input
                  id="semester-end"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value ?? "grading_open")}
                >
                  <SelectTrigger className="w-full rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grading_open">Grading open</SelectItem>
                    <SelectItem value="grading_closed">Grading closed</SelectItem>
                    <SelectItem value="finalized">Finalized</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-end justify-end">
              <Button className="rounded-none" onClick={handleCreate} disabled={!name.trim()}>
                <Plus className="size-4" />
                Add semester
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.length === 0 ? (
            <div className="rounded-none border border-dashed p-6 text-sm text-muted-foreground">
              No semesters for this academic year yet.
            </div>
          ) : (
            rows.map((semester) => (
              <div key={semester.id} className="rounded-none border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{semester.name}</p>
                  <Badge className="rounded-none">{semester.status ?? "draft"}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {semester.start_date ?? "-"} → {semester.end_date ?? "-"}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Academic year: {semester.academic_years?.[0]?.name ?? "-"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
