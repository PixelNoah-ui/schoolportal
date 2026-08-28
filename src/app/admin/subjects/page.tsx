// app/admin/subjects/page.tsx
"use client";

import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/admin/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { RowActions } from "@/components/admin/row-actions";
import type { FieldConfig } from "@/components/admin/entity-form-dialog";
import { GradeBadge } from "@/components/admin/grade-badge";
import PaginationBar from "@/components/PaginationBar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { allSubjects, classes } from "@/lib/mock-data";

const subjectFields: FieldConfig[] = [
  { name: "name", label: "Subject" },
  { name: "className", label: "Class" },
  { name: "avgScore", label: "Average score", type: "number" },
];

export default function SubjectsPage() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");

  const filtered = useMemo(() => {
    return allSubjects.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchesClass = classFilter === "all" || s.classId === classFilter;
      return matchesSearch && matchesClass;
    });
  }, [search, classFilter]);

  return (
    <>
      <SiteHeader title="Subjects" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <PageHeader
          eyebrow="All Subjects"
          count={allSubjects.length}
          actionLabel="Add Subject"
        />
        <DataToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by subject name"
          filterOptions={classes.map((c) => ({
            label: `Grade ${c.grade} - ${c.section}`,
            value: c.id,
          }))}
          filterValue={classFilter}
          onFilterChange={setClassFilter}
          filterLabel="All Classes"
        />
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Subject</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Class Average</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="text-sm font-medium">{s.name}</TableCell>
                <TableCell className="text-sm">{s.className}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {s.teacher}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm tabular-nums">
                      {s.avgScore.toFixed(1)}%
                    </span>
                    <GradeBadge score={s.avgScore} />
                  </div>
                </TableCell>
                <TableCell>
                  <RowActions
                    entityName={s.name}
                    fields={subjectFields}
                    values={{
                      name: s.name,
                      className: s.className,
                      avgScore: String(s.avgScore),
                    }}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PaginationBar totalPage={3} currentPage={1} />
      </div>
    </>
  );
}
