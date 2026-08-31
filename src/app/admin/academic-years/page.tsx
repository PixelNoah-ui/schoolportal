"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useAcademicYears,
  useCreateAcademicYear,
  useDeleteAcademicYear,
  useUpdateAcademicYear,
} from "@/hooks/use-academic-years";

const defaultSemesters = ["Semester 1", "Semester 2"];

function buildAcademicYearName(startDate: string, endDate: string) {
  if (!startDate || !endDate) return "Academic year";

  const startYear = new Date(startDate).getFullYear();
  const endYear = new Date(endDate).getFullYear();

  return `${startYear}/${endYear}`;
}

export default function AcademicYearsPage() {
  const { data = [], isLoading } = useAcademicYears();
  const createAcademicYear = useCreateAcademicYear();
  const updateAcademicYear = useUpdateAcademicYear();
  const deleteAcademicYear = useDeleteAcademicYear();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  function resetForm() {
    setStartDate("");
    setEndDate("");
    setEditingId(null);
  }

  function startEdit(year: (typeof data)[number]) {
    setEditingId(year.id);
    setStartDate(year.startDate ?? "");
    setEndDate(year.endDate ?? "");
  }

  function handleDeleteYear(id: string) {
    deleteAcademicYear.mutate(id);
  }

  const handleSubmit = () => {
    if (!startDate || !endDate) return;

    const generatedName = buildAcademicYearName(startDate, endDate);

    createAcademicYear.mutate({
      name: generatedName,
      start_date: startDate,
      end_date: endDate,
      is_current: "true",
      semesters: JSON.stringify(
        defaultSemesters.map((semesterName) => ({ name: semesterName })),
      ),
    });

    resetForm();
  };

  const handleUpdate = () => {
    if (!editingId || !startDate || !endDate) return;

    const generatedName = buildAcademicYearName(startDate, endDate);

    updateAcademicYear.mutate({
      id: editingId,
      payload: {
        name: generatedName,
        start_date: startDate,
        end_date: endDate,
        is_current: "true",
        status: "active",
        semesters: JSON.stringify(
          defaultSemesters.map((semesterName) => ({ name: semesterName })),
        ),
      },
    });

    resetForm();
  };

  const isSubmitting =
    createAcademicYear.isPending || updateAcademicYear.isPending;

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
              {editingId ? "Edit academic year" : "Create academic year"}
            </span>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 lg:grid-cols-[1.2fr_0.8fr]">
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
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="year-semesters">Semesters</Label>
                <Input
                  id="year-semesters"
                  value={defaultSemesters.join(", ")}
                  disabled
                  className="rounded-none bg-muted/40"
                />
              </div>
            </div>

            <div className="flex items-end justify-end gap-2">
              {editingId && (
                <Button
                  variant="outline"
                  className="rounded-none"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  <X className="size-4" />
                  Cancel
                </Button>
              )}
              <Button
                className="rounded-none"
                onClick={editingId ? handleUpdate : handleSubmit}
                disabled={!startDate || !endDate || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {editingId ? "Saving..." : "Creating..."}
                  </>
                ) : (
                  <>
                    {editingId ? (
                      <Save className="size-4" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    {editingId ? "Save changes" : "Create year"}
                  </>
                )}
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
                  {year.semesters.length > 0 ? (
                    year.semesters.map((semester) => (
                      <Badge
                        key={semester.id}
                        variant="outline"
                        className="rounded-none"
                      >
                        {semester.name}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="rounded-none">
                      No semesters yet
                    </Badge>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Status: {year.status}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-none"
                      onClick={() => startEdit(year)}
                      disabled={isSubmitting}
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                    <ConfirmDeleteDialog
                      name={`academic year ${year.name}`}
                      onConfirm={() => handleDeleteYear(year.id)}
                      trigger={
                        <Button
                          variant="destructive"
                          size="sm"
                          className="rounded-none"
                          disabled={deleteAcademicYear.isPending}
                        >
                          {deleteAcademicYear.isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                          Delete
                        </Button>
                      }
                      isLoading={deleteAcademicYear.isPending}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
