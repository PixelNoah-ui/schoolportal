"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/teacher/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToastManager } from "@/components/ui/toast";
import { GradeStatusSelect } from "@/components/teacher/grade-status-select";
import { cn } from "@/lib/utils";
import {
  useStudentGrades,
  type GradeStatus,
  type StudentGradeDraft,
} from "@/hooks/use-student-grades";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Shared score-tier language, consistent with the roster page.
function scoreTone(pct: number) {
  if (pct >= 70)
    return {
      text: "text-emerald-700 dark:text-emerald-400",
      bar: "bg-emerald-500",
    };
  if (pct >= 40)
    return { text: "text-amber-700 dark:text-amber-400", bar: "bg-amber-500" };
  return { text: "text-red-700 dark:text-red-400", bar: "bg-red-500" };
}

// Left-edge accent per grade row so status is scannable without reading the select.
function statusAccent(status: GradeStatus) {
  if (status === "graded") return "border-l-emerald-500";
  if (status === "excused") return "border-l-slate-400";
  return "border-l-amber-500";
}

export default function StudentGradingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classSubjectId = params.id as string;
  const studentId = params.studentId as string;
  const semesterId = searchParams.get("semester") ?? "sem-1";
  const toastManager = useToastManager();

  const { data, isLoading, submitGrades } = useStudentGrades(
    classSubjectId,
    semesterId,
    studentId,
  );
  const [draftGrades, setDraftGrades] = useState<StudentGradeDraft[]>([]);

  useEffect(() => {
    if (!data) return;
    startTransition(() => {
      setDraftGrades(
        data.grades.map((grade) => ({
          courseAssessmentId: grade.courseAssessmentId,
          maxScore: grade.maxScore,
          score: grade.score,
          status: grade.status,
        })),
      );
    });
  }, [data]);

  const updateDraft = (
    courseAssessmentId: string,
    patch: Partial<StudentGradeDraft>,
  ) => {
    setDraftGrades((grades) =>
      grades.map((grade) =>
        grade.courseAssessmentId === courseAssessmentId
          ? { ...grade, ...patch }
          : grade,
      ),
    );
  };

  const summary = useMemo(() => {
    if (!data) return null;
    const total = draftGrades.reduce(
      (sum, g) => (g.status === "graded" ? sum + (g.score ?? 0) : sum),
      0,
    );
    const totalPossible = data.grades.reduce((sum, g) => sum + g.maxScore, 0);
    const pct =
      totalPossible > 0 ? Math.round((total / totalPossible) * 100) : null;
    const gradedCount = draftGrades.filter((g) => g.status === "graded").length;
    return {
      total,
      totalPossible,
      pct,
      gradedCount,
      componentCount: data.grades.length,
    };
  }, [data, draftGrades]);

  return (
    <>
      <SiteHeader title={data ? data.header.fullName : "Student grades"} />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit rounded-none text-muted-foreground"
          onClick={() => router.push(`/teacher/classes/${classSubjectId}`)}
        >
          <ArrowLeft className="size-3.5" />
          Back to class
        </Button>

        {!data ? (
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-none" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40 rounded-none" />
              <Skeleton className="h-3 w-28 rounded-none" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar className="size-11 rounded-none">
              <AvatarFallback className="rounded-none bg-muted text-sm font-medium">
                {initials(data.header.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold leading-tight">
                {data.header.fullName}
              </p>
              <p className="text-sm text-muted-foreground">
                {data.header.subjectName} · Grade {data.header.className}
              </p>
            </div>
          </div>
        )}

        {summary && summary.componentCount > 0 && (
          <Card className="rounded-none shadow-none">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-semibold">Overall grade</p>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={cn(
                      "text-xl font-semibold",
                      summary.pct != null && scoreTone(summary.pct).text,
                    )}
                  >
                    {summary.total}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {summary.totalPossible}
                  </span>
                  {summary.pct != null && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({summary.pct}%)
                    </span>
                  )}
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden bg-muted">
                <div
                  className={cn(
                    "h-full transition-all",
                    summary.pct != null
                      ? scoreTone(summary.pct).bar
                      : "bg-muted-foreground/30",
                  )}
                  style={{ width: `${summary.pct ?? 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.gradedCount} of {summary.componentCount} component
                {summary.componentCount === 1 ? "" : "s"} graded
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-none shadow-none">
          <CardContent className="flex flex-col gap-3 p-4">
            <p className="text-sm font-semibold">Grades</p>

            {isLoading || !data ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 border-t pt-3 first:border-t-0 first:pt-0"
                  >
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-32 rounded-none" />
                      <Skeleton className="h-3 w-16 rounded-none" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-none" />
                    <Skeleton className="h-8 w-28 rounded-none" />
                  </div>
                ))}
              </div>
            ) : data.grades.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No grade components have been set up yet.
              </p>
            ) : (
              data.grades.map((grade) => {
                const draft = draftGrades.find(
                  (item) =>
                    item.courseAssessmentId === grade.courseAssessmentId,
                ) ?? {
                  courseAssessmentId: grade.courseAssessmentId,
                  maxScore: grade.maxScore,
                  score: null,
                  status: "not_taken" as GradeStatus,
                };
                return (
                  <div
                    key={grade.courseAssessmentId}
                    className={cn(
                      "flex items-center gap-3 border-l-2 border-t pt-3 pl-3 first:border-t-0 first:pt-0",
                      statusAccent(draft.status),
                    )}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {grade.componentName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        out of {grade.maxScore}
                      </p>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={grade.maxScore}
                      step="any"
                      value={draft.score ?? ""}
                      className="h-8 w-20 rounded-none"
                      onChange={(e) => {
                        const value =
                          e.target.value === "" ? null : Number(e.target.value);
                        updateDraft(grade.courseAssessmentId, {
                          score: value,
                          status: "graded",
                        });
                      }}
                    />
                    <GradeStatusSelect
                      value={draft.status}
                      onChange={(status: GradeStatus) =>
                        updateDraft(grade.courseAssessmentId, {
                          status,
                          score: status === "graded" ? draft.score : null,
                        })
                      }
                    />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {data && data.grades.length > 0 && (
          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Components remain Not taken until you choose another status.
            </p>
            <Button
              className="rounded-none"
              disabled={submitGrades.isPending}
              onClick={async () => {
                try {
                  await submitGrades.mutateAsync(draftGrades);
                  toastManager.add({
                    title: "Grades submitted",
                    description:
                      "This student's grades were saved successfully.",
                    type: "success",
                  });
                } catch (error) {
                  toastManager.add({
                    title: "Could not submit grades",
                    description:
                      error instanceof Error
                        ? error.message
                        : "Please try again.",
                    type: "error",
                  });
                }
              }}
            >
              {submitGrades.isPending ? "Submitting..." : "Submit grades"}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
