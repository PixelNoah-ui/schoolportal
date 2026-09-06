"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

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

export interface StudentGradeDraft {
  courseAssessmentId: string;
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

type ClassSubjectDetails = {
  classes?: {
    section?: string | null;
    grade_levels?: { level_number: number } | { level_number: number }[] | null;
  };
  subjects?: { name: string };
};

type StudentDetails = {
  profiles?: { full_name: string } | { full_name: string }[] | null;
};

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : (value ?? undefined);
}

// Shared by both the read and write paths: a class/subject pairing has one
// class_subjects row per semester, so if the caller passes a placeholder
// semesterId (e.g. a UI-only "sem-..." value rather than a real DB id), this
// resolves the actual row for the requested semester instead of assuming
// classSubjectId is already semester-correct.
async function resolveActiveClassSubject(
  supabase: SupabaseClient,
  classSubjectId: string,
  semesterId: string,
) {
  const { data: classSubject, error: classSubjectError } = await supabase
    .from("class_subjects")
    .select("class_id, subject_id, semester_id")
    .eq("id", classSubjectId)
    .single();
  if (classSubjectError) throw classSubjectError;

  const { data: semesterClassSubject, error: semesterClassSubjectError } =
    await supabase
      .from("class_subjects")
      .select("id, semester_id")
      .eq("class_id", classSubject.class_id)
      .eq("subject_id", classSubject.subject_id)
      .eq(
        "semester_id",
        semesterId.startsWith("sem-") ? classSubject.semester_id : semesterId,
      )
      .maybeSingle();
  if (semesterClassSubjectError) throw semesterClassSubjectError;

  return {
    classSubject,
    activeClassSubjectId: semesterClassSubject?.id ?? classSubjectId,
    activeSemesterId:
      semesterClassSubject?.semester_id ?? classSubject.semester_id,
  };
}

// NOTE: "excused" and "not_taken" currently share no distinct DB value —
// see conversation notes. This maps "excused" to 'draft' with the same
// caveat as "not_taken" until the submission_status enum (or a new column)
// can represent it distinctly.
function toDbStatus(status: GradeStatus): string {
  switch (status) {
    case "graded":
      return "submitted";
    case "exempt":
      return "approved";
    case "absent":
      return "rejected";
    case "excused":
    case "not_taken":
    default:
      return "draft";
  }
}

function displayStatus(status?: string): GradeStatus {
  if (status === "submitted") return "graded";
  if (status === "approved") return "exempt";
  if (status === "rejected") return "absent";
  return "not_taken";
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
      const { classSubject, activeClassSubjectId, activeSemesterId } =
        await resolveActiveClassSubject(supabase, classSubjectId, semesterId);

      const { data: fullClassSubject, error: csError } = await supabase
        .from("class_subjects")
        .select(
          "class_id, subject_id, semester_id, classes ( section, grade_levels!classes_grade_level_id_fkey(level_number) ), subjects ( name )",
        )
        .eq("id", classSubjectId)
        .single();
      if (csError) throw csError;

      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("profiles:profile_id ( full_name )")
        .eq("id", studentId)
        .single();
      if (studentError) throw studentError;

      const classSubjectDetails =
        fullClassSubject as unknown as ClassSubjectDetails;
      const studentDetails = student as unknown as StudentDetails;
      const classRow = classSubjectDetails.classes;
      const gradeLevel = firstRelation(classRow?.grade_levels);
      const studentProfile = firstRelation(studentDetails.profiles);

      const { data: components, error: componentsError } = await supabase
        .from("course_assessments")
        .select("id, name, max_score, order_number")
        .eq("class_subject_id", activeClassSubjectId)
        .eq("semester_id", activeSemesterId)
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
          fullName: studentProfile?.full_name ?? "Unnamed student",
          className: `${gradeLevel?.level_number ?? ""}${classRow?.section ?? ""}`,
          subjectName: classSubjectDetails.subjects?.name ?? "",
        },
        grades: (components ?? []).map((c) => {
          const result = resultByComponent.get(c.id);
          return {
            courseAssessmentId: c.id,
            componentName: c.name,
            maxScore: Number(c.max_score),
            score: result?.score != null ? Number(result.score) : null,
            status: displayStatus(result?.status),
          };
        }),
      };
    },
  });

  const submitGrades = useMutation({
    mutationFn: async (grades: StudentGradeDraft[]) => {
      const { activeClassSubjectId, activeSemesterId } =
        await resolveActiveClassSubject(supabase, classSubjectId, semesterId);

      const { data: assessments, error: assessmentsError } = await supabase
        .from("course_assessments")
        .select("id, name, max_score")
        .eq("class_subject_id", activeClassSubjectId)
        .eq("semester_id", activeSemesterId);
      if (assessmentsError) throw assessmentsError;

      const assessmentById = new Map(
        (assessments ?? []).map((assessment) => [assessment.id, assessment]),
      );

      for (const grade of grades) {
        if (grade.status !== "graded" || grade.score == null) continue;
        const assessment = assessmentById.get(grade.courseAssessmentId);
        const maxScore = Number(assessment?.max_score ?? grade.maxScore);
        if (grade.score < 0 || grade.score > maxScore) {
          throw new Error(
            `${assessment?.name ?? "This grade"} must be between 0 and ${maxScore}.`,
          );
        }
      }

      const { error: resultsError } = await supabase
        .from("assessment_results")
        .upsert(
          grades.map((grade) => ({
            student_id: studentId,
            course_assessment_id: grade.courseAssessmentId,
            score: grade.status === "graded" ? grade.score : null,
            status: toDbStatus(grade.status),
          })),
          { onConflict: "student_id,course_assessment_id" },
        );
      if (resultsError) throw resultsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({
        queryKey: ["class-roster", classSubjectId],
      });
    },
  });

  return { ...query, submitGrades };
}
