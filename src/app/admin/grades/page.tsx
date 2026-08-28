// app/admin/grades/page.tsx
"use client";

import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/admin/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { DataToolbar } from "@/components/admin/data-toolbar";
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
import { gradeRecords } from "@/lib/mock-data";

export default function GradesPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      gradeRecords.filter(
        (g) =>
          g.studentName.toLowerCase().includes(search.toLowerCase()) ||
          g.subject.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  return (
    <>
      <SiteHeader title="Grades" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <PageHeader
          eyebrow="Grade Records"
          count={gradeRecords.length}
          actionLabel="Add Grade"
        />
        <DataToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by student or subject"
        />
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Student</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="text-sm font-medium">
                  {g.studentName}
                </TableCell>
                <TableCell className="text-sm">{g.subject}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {g.className}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {g.semester}
                </TableCell>
                <TableCell className="text-sm tabular-nums">
                  {g.score.toFixed(1)}
                </TableCell>
                <TableCell>
                  <GradeBadge score={g.score} />
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
