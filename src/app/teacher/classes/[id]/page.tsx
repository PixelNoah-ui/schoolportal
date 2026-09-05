"use client";

import { useParams, useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, AlertTriangle, Search, X } from "lucide-react";
import { SiteHeader } from "@/components/teacher/site-header";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToastManager } from "@/components/ui/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useClassRoster } from "@/hooks/use-class-roster";
import { useGradingStructure } from "@/hooks/use-grading-structure";
import { GradingStructureEditor } from "@/components/teacher/grading-structure-editor";
import { createClient } from "@/utils/supabase/client";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Shared score-tier language: consistent color meaning across roster + grading.
function scoreTone(score: number) {
  if (score >= 70)
    return {
      text: "text-emerald-700 dark:text-emerald-400",
      bar: "bg-emerald-500",
    };
  if (score >= 40)
    return { text: "text-amber-700 dark:text-amber-400", bar: "bg-amber-500" };
  return { text: "text-red-700 dark:text-red-400", bar: "bg-red-500" };
}

export default function ClassRosterPage() {
  const params = useParams();
  const router = useRouter();
  const classSubjectId = params.id as string;
  const [semesterId, setSemesterId] = useState("sem-1");
  const [search, setSearch] = useState("");
  const toastManager = useToastManager();
  const supabase = createClient();

  const semesters = useQuery({
    queryKey: ["class-semesters", classSubjectId],
    queryFn: async () => {
      const { data: assignment, error: assignmentError } = await supabase
        .from("class_subjects")
        .select("class_id, subject_id, semester_id, classes(academic_year_id)")
        .eq("id", classSubjectId)
        .single();
      if (assignmentError) throw assignmentError;

      const classes = assignment.classes as
        | { academic_year_id: string }[]
        | { academic_year_id: string }
        | null;
      const academicYearId = Array.isArray(classes)
        ? classes[0]?.academic_year_id
        : classes?.academic_year_id;
      const { data, error } = await supabase
        .from("semesters")
        .select("id, name, ordinal")
        .eq("academic_year_id", academicYearId)
        .order("ordinal");
      if (error) throw error;
      return { assignment, semesters: data ?? [] };
    },
    enabled: Boolean(classSubjectId),
  });

  const { data, isLoading, isError, error } = useClassRoster(
    classSubjectId,
    semesterId,
  );
  const structure = useGradingStructure(classSubjectId, semesterId);
  const selectedSemesterName =
    semesters.data?.semesters.find((semester) => semester.id === semesterId)
      ?.name ?? "Select semester";

  useEffect(() => {
    const firstSemester = semesters.data?.semesters[0];
    if (semesterId.startsWith("sem-") && firstSemester) {
      startTransition(() => setSemesterId(firstSemester.id));
    }
  }, [semesterId, semesters.data]);

  const filteredStudents = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    if (!term) return data.students;
    return data.students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(term) ||
        s.studentNumber.toLowerCase().includes(term),
    );
  }, [data, search]);

  const stats = useMemo(() => {
    if (!data) return null;
    const graded = data.students.filter((s) => s.normalizedScore != null);
    const incomplete = data.students.filter((s) => !s.isComplete);
    const average =
      graded.length > 0
        ? Math.round(
            graded.reduce((sum, s) => sum + (s.normalizedScore ?? 0), 0) /
              graded.length,
          )
        : null;
    return {
      total: data.students.length,
      gradedCount: graded.length,
      incompleteCount: incomplete.length,
      average,
    };
  }, [data]);

  return (
    <>
      <SiteHeader
        title={
          data
            ? `${data.header.subjectName} · Grade ${data.header.className}`
            : "Class"
        }
      />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              value={semesterId}
              onValueChange={(value) => {
                if (value) setSemesterId(value);
              }}
            >
              <SelectTrigger className="w-full rounded-none sm:w-48">
                <SelectValue>{selectedSemesterName}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {semesters.data?.semesters.map((semester) => (
                  <SelectItem key={semester.id} value={semester.id}>
                    {semester.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!isLoading &&
          !isError &&
          data &&
          data.students.length > 0 &&
          stats && (
            <div className="grid grid-cols-3 divide-x divide-border border border-border sm:max-w-md">
              <div className="px-4 py-3">
                <p className="text-lg font-semibold leading-none">
                  {stats.total}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Students</p>
              </div>
              <div className="px-4 py-3">
                <p
                  className={cn(
                    "text-lg font-semibold leading-none",
                    stats.average != null && scoreTone(stats.average).text,
                  )}
                >
                  {stats.average != null ? stats.average : "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Avg score</p>
              </div>
              <div className="px-4 py-3">
                <p
                  className={cn(
                    "text-lg font-semibold leading-none",
                    stats.incompleteCount > 0 && "text-amber-600",
                  )}
                >
                  {stats.incompleteCount}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Incomplete</p>
              </div>
            </div>
          )}

        {structure.isLoading ? (
          <Card className="rounded-none shadow-none">
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-36 rounded-none" />
                <Skeleton className="h-8 w-28 rounded-none" />
              </div>
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex gap-2">
                  <Skeleton className="h-8 flex-1 rounded-none" />
                  <Skeleton className="h-8 w-20 rounded-none" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : structure.data ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              Set the grading components once, then select a student below to
              enter their marks.
            </p>
            <GradingStructureEditor
              components={structure.data.components}
              isLocked={structure.data.isLocked}
              isSaving={structure.saveStructure.isPending}
              onSave={async (components) => {
                try {
                  await structure.saveStructure.mutateAsync(components);
                  toastManager.add({
                    title: "Grading structure saved",
                    description: "The components are ready for student grades.",
                    type: "success",
                  });
                } catch (error) {
                  toastManager.add({
                    title: "Could not save grading structure",
                    description:
                      error instanceof Error
                        ? error.message
                        : "Please try again.",
                    type: "error",
                  });
                }
              }}
            />
          </div>
        ) : null}

        {!isLoading && !isError && data && data.students.length > 0 && (
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search students"
              className="rounded-none pl-8 pr-8"
            />
            {search && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Clear search"
                className="absolute right-0 top-0 size-8 rounded-none text-muted-foreground hover:text-foreground"
                onClick={() => setSearch("")}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        )}

        {isLoading ? (
          <Table>
            <TableSkeleton rows={8} columns={3} />
          </Table>
        ) : isError ? (
          <Card className="rounded-none shadow-none">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <AlertTriangle className="size-5 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Couldn&apos;t load this class. Try again shortly.
              </p>
              <p className="max-w-xl text-xs text-muted-foreground">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
            </CardContent>
          </Card>
        ) : !data || data.students.length === 0 ? (
          <Card className="rounded-none shadow-none">
            <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
              No students in this class yet.
            </CardContent>
          </Card>
        ) : filteredStudents.length === 0 ? (
          <Card className="rounded-none shadow-none">
            <CardContent className="flex flex-col items-center gap-1 py-12 text-center">
              <p className="text-sm font-semibold">
                No students match your search
              </p>
              <p className="text-sm text-muted-foreground">
                Try a different name or ID.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-none shadow-none">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Student</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => {
                    const tone =
                      student.normalizedScore != null
                        ? scoreTone(student.normalizedScore)
                        : null;
                    return (
                      <TableRow
                        key={student.studentId}
                        className="cursor-pointer"
                        onClick={() =>
                          router.push(
                            `/teacher/classes/${classSubjectId}/students/${student.studentId}?semester=${semesterId}`,
                          )
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8 rounded-none">
                              <AvatarFallback className="rounded-none bg-muted text-xs">
                                {initials(student.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {student.fullName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">
                          {student.studentNumber}
                        </TableCell>
                        <TableCell className="text-sm">
                          {student.normalizedScore != null ? (
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "font-mono font-medium",
                                  tone?.text,
                                )}
                              >
                                {student.normalizedScore}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                / 100
                              </span>
                              <div className="h-1 w-14 overflow-hidden bg-muted">
                                <div
                                  className={cn("h-full", tone?.bar)}
                                  style={{
                                    width: `${Math.min(100, Math.max(0, student.normalizedScore))}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              Not graded
                            </span>
                          )}
                          {!student.isComplete && (
                            <span className="ml-2 border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                              Incomplete
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="size-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
