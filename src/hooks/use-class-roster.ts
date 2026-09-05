"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export interface RosterStudent {
  studentId: string;
  fullName: string;
  studentNumber: string;
  normalizedScore: number | null;
  isComplete: boolean;
}

export interface ClassSubjectHeader {
  classSubjectId: string;
  className: string;
  subjectName: string;
}

export function useClassRoster(classSubjectId: string, semesterId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["class-roster", classSubjectId, semesterId],
    enabled: Boolean(classSubjectId && semesterId),
    queryFn: async (): Promise<{
      header: ClassSubjectHeader;
      students: RosterStudent[];
    }> => {
      const { data: classSubject, error: csError } = await supabase
        .from("class_subjects")
        .select(
          "id, class_id, subject_id, semester_id, classes ( academic_year_id, section, grade_levels!classes_grade_level_id_fkey(level_number) ), subjects ( name )",
        )
        .eq("id", classSubjectId)
        .single();
      if (csError) throw csError;

      const activeSemesterId = semesterId.startsWith("sem-")
        ? classSubject.semester_id
        : semesterId;
      const { data: semesterClassSubject, error: semesterClassSubjectError } =
        await supabase
          .from("class_subjects")
          .select("id, semester_id")
          .eq("class_id", classSubject.class_id)
          .eq("subject_id", classSubject.subject_id)
          .eq("semester_id", activeSemesterId)
          .maybeSingle();
      if (semesterClassSubjectError) throw semesterClassSubjectError;
      const activeClassSubjectId = semesterClassSubject?.id ?? classSubjectId;

      const { data: enrollments, error: enrollmentsError } = await supabase
        .from("student_enrollments")
        .select("student_id")
        .eq("class_id", classSubject.class_id)
        .eq("semester_id", activeSemesterId)
        .eq("status", "active");
      if (enrollmentsError) throw enrollmentsError;

      const studentIds = Array.from(
        new Set((enrollments ?? []).map((enrollment) => enrollment.student_id)),
      );
      const { data: students, error: studentsError } =
        studentIds.length > 0
          ? await supabase
              .from("students")
              .select("id, phone, profiles:profile_id ( full_name, username )")
              .in("id", studentIds)
          : { data: [], error: null };
      if (studentsError) throw studentsError;

      const { data: assessments, error: assessmentsError } = await supabase
        .from("course_assessments")
        .select("id, max_score")
        .eq("class_subject_id", activeClassSubjectId)
        .eq("semester_id", activeSemesterId);
      if (assessmentsError) throw assessmentsError;

      const assessmentIds = (assessments ?? []).map(
        (assessment) => assessment.id,
      );
      const { data: results, error: resultsError } =
        assessmentIds.length > 0
          ? await supabase
              .from("assessment_results")
              .select("student_id, course_assessment_id, score, status")
              .in("course_assessment_id", assessmentIds)
          : { data: [], error: null };
      if (resultsError) throw resultsError;

      const maxScoreByAssessment = new Map(
        (assessments ?? []).map((assessment) => [
          assessment.id,
          Number(assessment.max_score),
        ]),
      );
      const resultsByStudent = new Map<string, typeof results>();
      for (const result of results ?? []) {
        const studentResults = resultsByStudent.get(result.student_id) ?? [];
        studentResults.push(result);
        resultsByStudent.set(result.student_id, studentResults);
      }

      const totalPossible = Array.from(maxScoreByAssessment.values()).reduce(
        (sum, maxScore) => sum + maxScore,
        0,
      );

      return {
        header: {
          classSubjectId: activeClassSubjectId,
          className: `${classSubject.classes?.grade_levels?.level_number ?? ""}${classSubject.classes?.section ?? ""}`,
          subjectName: classSubject.subjects?.name ?? "",
        },
        students: (students ?? []).map((s: any) => {
          const studentResults = resultsByStudent.get(s.id) ?? [];
          const gradedResults = studentResults.filter(
            (result) => result.status === "submitted" && result.score != null,
          );
          const totalScore = gradedResults.reduce(
            (sum, result) => sum + Number(result.score),
            0,
          );
          const normalizedScore =
            totalPossible > 0
              ? Math.round((totalScore / totalPossible) * 100)
              : null;
          const isComplete =
            assessmentIds.length > 0 &&
            studentResults.filter((result) => result.status !== "draft")
              .length === assessmentIds.length;

          return {
            studentId: s.id,
            fullName: s.profiles?.full_name ?? "Unnamed student",
            studentNumber: s.profiles?.username ?? "",
            normalizedScore,
            isComplete,
          };
        }),
      };
    },
  });
}
