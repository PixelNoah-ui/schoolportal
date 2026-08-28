// app/admin/rankings/submissions/page.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  classes,
  gradeSubmissions,
  type GradeSubmissionStatus,
} from "@/lib/mock-data";
import {
  type Period,
  periodLabel,
  periodToSemesterNames,
} from "@/utils/supabase/ranking-utils";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  GradeSubmissionStatus,
  { label: string; className: string }
> = {
  complete: {
    label: "Complete",
    className: "border-emerald-600 text-emerald-700 dark:text-emerald-400",
  },
  in_progress: {
    label: "In progress",
    className: "border-amber-600 text-amber-700 dark:text-amber-400",
  },
  not_started: {
    label: "Not started",
    className: "border-destructive text-destructive",
  },
};

export default function SubmissionsPage() {
  const [period, setPeriod] = useState<Period>("sem1");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const semesters = periodToSemesterNames(period);
    return gradeSubmissions
      .filter((g) => semesters.includes(g.semester))
      .filter(
        (g) =>
          g.subjectName.toLowerCase().includes(search.toLowerCase()) ||
          g.teacher.toLowerCase().includes(search.toLowerCase()),
      )
      .map((g) => {
        const klass = classes.find((c) => c.id === g.classId);
        return {
          ...g,
          className: klass
            ? `Grade ${klass.grade} - ${klass.section}`
            : g.classId,
        };
      })
      .sort((a, b) => a.status.localeCompare(b.status));
  }, [period, search]);

  const pendingCount = rows.filter((r) => r.status !== "complete").length;

  return (
    <>
      <SiteHeader title="Grade Submission Status" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/rankings"
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
                className:
                  "mb-2 -ml-2 rounded-none text-xs text-muted-foreground hover:text-foreground",
              })}
            >
              <ArrowLeft className="size-3.5" />
              Back to rankings
            </Link>
            <h2 className="text-lg font-semibold tracking-tight">
              Grade Submission Status
            </h2>
            <p className="text-sm text-muted-foreground">
              {pendingCount === 0
                ? `All subjects submitted for ${periodLabel[period]}.`
                : `${pendingCount} of ${rows.length} subjects still pending for ${periodLabel[period]}.`}
            </p>
          </div>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList className="rounded-none">
              <TabsTrigger value="sem1" className="rounded-none">
                Semester 1
              </TabsTrigger>
              <TabsTrigger value="sem2" className="rounded-none">
                Semester 2
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <DataToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by subject or teacher"
        />

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Class</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-sm text-muted-foreground">
                  {r.className}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {r.subjectName}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.teacher}
                </TableCell>
                <TableCell className="text-sm tabular-nums">
                  {r.submitted} / {r.total}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-none font-normal",
                      statusConfig[r.status].className,
                    )}
                  >
                    {statusConfig[r.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {r.status !== "complete" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-none text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Mail className="size-3.5" />
                      Remind
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No subjects match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
