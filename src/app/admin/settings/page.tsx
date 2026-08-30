"use client";

import { useState } from "react";
import { Plus, School } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useAcademicYears,
  useCreateAcademicYear,
  useActivateAcademicYear,
  useCompleteAcademicYear,
} from "@/hooks/use-academic-years";

export default function SettingsPage() {
  const { data, isLoading } = useAcademicYears();
  const createAcademicYear = useCreateAcademicYear();
  const activateAcademicYear = useActivateAcademicYear();
  const completeAcademicYear = useCompleteAcademicYear();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [semesters, setSemesters] = useState("Semester 1,Semester 2");

  const academicYears = data ?? [];
  const currentYear = academicYears.find((year) => year.isCurrent) ?? academicYears[0];

  function handleCreateYear() {
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
    setSemesters("Semester 1,Semester 2");
  }

  return (
    <>
      <SiteHeader title="Settings" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <Card className="rounded-none shadow-none">
          <CardHeader className="border-b pb-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Academic Years
            </span>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="year-name">Academic year</Label>
                  <Input
                    id="year-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="2026/2027"
                    className="rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year-status">Current status</Label>
                  <Input
                    id="year-status"
                    value={currentYear ? currentYear.name : "No active year"}
                    disabled
                    className="rounded-none bg-muted/40"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="year-semesters">Semesters</Label>
                <Input
                  id="year-semesters"
                  value={semesters}
                  onChange={(event) => setSemesters(event.target.value)}
                  placeholder="Semester 1, Semester 2"
                  className="rounded-none"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  className="rounded-none"
                  onClick={handleCreateYear}
                  disabled={createAcademicYear.isPending || !name.trim()}
                >
                  <Plus className="size-4" />
                  Create academic year
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="text-sm text-muted-foreground">
                  Loading academic years...
                </div>
              ) : academicYears.length === 0 ? (
                <div className="rounded-none border border-dashed p-4 text-sm text-muted-foreground">
                  No academic years created yet.
                </div>
              ) : (
                academicYears.map((year) => (
                  <div key={year.id} className="rounded-none border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{year.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {year.semesters.length} semester(s)
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {year.isCurrent && (
                          <Badge className="rounded-none">Active</Badge>
                        )}
                        {year.status === "completed" && (
                          <Badge variant="secondary" className="rounded-none">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {year.semesters.map((semester) => (
                        <Badge
                          key={semester.id}
                          variant="outline"
                          className="rounded-none"
                        >
                          {semester.name}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {!year.isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-none"
                          onClick={() => activateAcademicYear.mutate(year.id)}
                        >
                          Activate
                        </Button>
                      )}
                      {year.isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-none"
                          onClick={() => completeAcademicYear.mutate(year.id)}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none shadow-none">
          <CardHeader className="border-b pb-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              School Profile
            </span>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 pt-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>School Name</Label>
              <Input defaultValue="PixelNoah School" className="rounded-none" />
            </div>
            <div className="space-y-2">
              <Label>Principal</Label>
              <Input defaultValue="School Principal" className="rounded-none" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue="admin@schoolportal.com" className="rounded-none" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input defaultValue="+251 911 000 000" className="rounded-none" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Address</Label>
              <Input defaultValue="Addis Ababa" className="rounded-none" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Website</Label>
              <Input defaultValue="schoolportal.edu" className="rounded-none" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button className="rounded-none">
            <School className="size-4" />
            Save changes
          </Button>
        </div>
      </div>
    </>
  );
}
