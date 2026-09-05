"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/teacher/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GradingStructureEditor } from "@/components/teacher/grading-structure-editor";
import { GradeStatusSelect } from "@/components/teacher/grade-status-select";
import { useGradingStructure } from "@/hooks/use-grading-structure";
import { useStudentGrades, type GradeStatus } from "@/hooks/use-student-grades";

export default function StudentGradingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classSubjectId = params.id as string;
  const studentId = params.studentId as string;
  const semesterId = searchParams.get("semester") ?? "sem-1";

  const structure = useGradingStructure(classSubjectId, semesterId);
  const { data, isLoading, saveGrade } = useStudentGrades(
    classSubjectId,
    semesterId,
    studentId,
  );

  const total =
    data?.grades.reduce(
      (sum, g) => (g.status === "graded" ? sum + (g.score ?? 0) : sum),
      0,
    ) ?? 0;
  const totalPossible =
    data?.grades.reduce((sum, g) => sum + g.maxScore, 0) ?? 0;

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

        {data && (
          <div>
            <p className="text-lg font-semibold">{data.header.fullName}</p>
            <p className="text-sm text-muted-foreground">
              {data.header.subjectName} · Grade {data.header.className}
            </p>
          </div>
        )}

        {structure.data && (
          <GradingStructureEditor
            components={structure.data.components}
            isLocked={structure.data.isLocked}
            isSaving={structure.saveStructure.isPending}
            onSave={(components) => structure.saveStructure.mutate(components)}
          />
        )}

        <Card className="rounded-none shadow-none">
          <CardContent className="flex flex-col gap-3 p-4">
            <p className="text-sm font-semibold">Grades</p>

            {isLoading || !data ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              data.grades.map((grade) => (
                <div
                  key={grade.courseAssessmentId}
                  className="flex items-center gap-3 border-t pt-3 first:border-t-0 first:pt-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{grade.componentName}</p>
                    <p className="text-xs text-muted-foreground">
                      out of {grade.maxScore}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    value={grade.score ?? ""}
                    disabled={grade.status !== "graded"}
                    className="h-8 w-20 rounded-none"
                    onChange={(e) => {
                      const value =
                        e.target.value === "" ? null : Number(e.target.value);
                      saveGrade.mutate({
                        courseAssessmentId: grade.courseAssessmentId,
                        score: value,
                        status: "graded",
                      });
                    }}
                  />
                  <GradeStatusSelect
                    value={grade.status}
                    onChange={(status: GradeStatus) =>
                      saveGrade.mutate({
                        courseAssessmentId: grade.courseAssessmentId,
                        score: status === "graded" ? grade.score : null,
                        status,
                      })
                    }
                  />
                </div>
              ))
            )}

            {data && data.grades.length > 0 && (
              <div className="flex items-center justify-between border-t pt-3 text-sm">
                <span className="font-medium">Total</span>
                <span className="font-mono font-semibold">
                  {total} / {totalPossible}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
