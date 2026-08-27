// app/admin/classes/page.tsx
"use client";

import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/admin/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { RowActions } from "@/components/admin/row-actions";
import type { FieldConfig } from "@/components/admin/entity-form-dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Users } from "lucide-react";
import { classes } from "@/lib/mock-data";

const classFields: FieldConfig[] = [
  { name: "grade", label: "Grade", type: "number" },
  { name: "section", label: "Section" },
  { name: "teacher", label: "Homeroom teacher" },
  { name: "studentCount", label: "Students", type: "number" },
];

export default function ClassesPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      classes.filter(
        (c) =>
          `grade ${c.grade} ${c.section}`
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          c.teacher.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  return (
    <>
      <SiteHeader title="Classes" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <PageHeader
          eyebrow="All Classes"
          count={classes.length}
          actionLabel="Add Class"
        />
        <DataToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by class or teacher"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="rounded-none shadow-none">
              <CardHeader className="flex-row items-start justify-between border-b pb-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Grade {c.grade}
                  </span>
                  <p className="mt-1 text-lg font-semibold tracking-tight">
                    Section {c.section}
                  </p>
                </div>
                <RowActions
                  entityName={`Grade ${c.grade} - Section ${c.section}`}
                  fields={classFields}
                  values={{
                    grade: String(c.grade),
                    section: c.section,
                    teacher: c.teacher,
                    studentCount: String(c.studentCount),
                  }}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Homeroom teacher
                </p>
                <p className="text-sm font-medium">{c.teacher}</p>
                <div className="mt-4 flex items-center gap-2 border-t pt-4">
                  <Users className="size-4 text-muted-foreground" />
                  <span className="text-sm tabular-nums">
                    {c.studentCount} students
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
