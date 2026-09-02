"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export type GradeStatus =
  | "graded"
  | "absent"
  | "excused"
  | "exempt"
  | "not_taken";

export interface StudentComponentGrade {
  courseAssessmentId: string;
  componentName: string;
  maxScore: number;
  score: number | null;
  status: GradeStatus;
}

export interface StudentHeader {
  studentId: string;
  fullName: string;
  className: string;
  subjectName: string;
}

export function useStudentGrades(
  classSubjectId: string,
  semesterId: string,
  studentId: string,
) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const queryKey = ["student-grades", classSubjectId, semesterId, studentId];

  const query = useQuery({
    queryKey,
    enabled: Boolean(classSubjectId && semesterId && studentId),
    queryFn: async (): Promise<{
      header: StudentHeader;
      grades: StudentComponentGrade[];
    }> => {
      const { data: classSubject, error: csError } = await supabase
        .from("class_subjects")
        .select("classes ( grade, section ), subjects ( name )")
        .eq("id", classSubjectId)
        .single();
      if (csError) throw csError;

      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("profiles:profile_id ( full_name )")
        .eq("id", studentId)
        .single();
      if (studentError) throw studentError;

      const { data: components, error: componentsError } = await supabase
        .from("course_assessments")
        .select("id, name, max_score, order_number")
        .eq("class_subject_id", classSubjectId)
        .eq("semester_id", semesterId)
        .order("order_number");
      if (componentsError) throw componentsError;

      const { data: results, error: resultsError } = await supabase
        .from("assessment_results")
        .select("course_assessment_id, score, status")
        .eq("student_id", studentId)
        .in(
          "course_assessment_id",
          (components ?? []).map((c) => c.id),
        );
      if (resultsError) throw resultsError;

      const resultByComponent = new Map(
        (results ?? []).map((r) => [r.course_assessment_id, r]),
      );

      return {
        header: {
          studentId,
          fullName: (student as any).profiles?.full_name ?? "Unnamed student",
          className: `${(classSubject as any).classes?.grade ?? ""}${(classSubject as any).classes?.section ?? ""}`,
          subjectName: (classSubject as any).subjects?.name ?? "",
        },
        grades: (components ?? []).map((c) => {
          const result = resultByComponent.get(c.id);
          return {
            courseAssessmentId: c.id,
            componentName: c.name,
            maxScore: Number(c.max_score),
            score: result?.score != null ? Number(result.score) : null,
            status: (result?.status ?? "not_taken") as GradeStatus,
          };
        }),
      };
    },
  });

  const saveGrade = useMutation({
    mutationFn: async (input: {
      courseAssessmentId: string;
      score: number | null;
      status: GradeStatus;
    }) => {
      const { error } = await supabase.from("assessment_results").upsert(
        {
          student_id: studentId,
          course_assessment_id: input.courseAssessmentId,
          score: input.status === "graded" ? input.score : null,
          status: input.status,
          source: "teacher",
        },
        { onConflict: "student_id,course_assessment_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { ...query, saveGrade };
}
