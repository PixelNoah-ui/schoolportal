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
        .select("id, classes ( grade, section ), subjects ( name ), class_id")
        .eq("id", classSubjectId)
        .single();
      if (csError) throw csError;

      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id, phone, profiles:profile_id ( full_name, username )")
        .eq("class_id", classSubject.class_id);
      if (studentsError) throw studentsError;

      const { data: scores, error: scoresError } = await supabase.rpc(
        "list_class_scores",
        {
          p_class_subject_id: classSubjectId,
          p_semester_id: semesterId,
        },
      );
      if (scoresError) throw scoresError;

      const scoreByStudent = new Map(
        (scores ?? []).map((s: any) => [s.student_id, s]),
      );

      return {
        header: {
          classSubjectId,
          className: `${classSubject.classes?.grade ?? ""}${classSubject.classes?.section ?? ""}`,
          subjectName: classSubject.subjects?.name ?? "",
        },
        students: (students ?? []).map((s: any) => {
          const score = scoreByStudent.get(s.id);
          return {
            studentId: s.id,
            fullName: s.profiles?.full_name ?? "Unnamed student",
            studentNumber: s.profiles?.username ?? "",
            normalizedScore: score?.normalized_score ?? null,
            isComplete: score?.is_complete ?? false,
          };
        }),
      };
    },
  });
}
