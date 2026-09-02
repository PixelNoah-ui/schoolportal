"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export type StructureStatus =
  | "not_started"
  | "draft"
  | "in_progress"
  | "submitted"
  | "locked";

export interface TeacherClassRow {
  id: string; // class_subjects.id -- used as the route param
  classId: string;
  className: string; // e.g. "10A"
  gradeLevel: number;
  subjectName: string;
  studentCount: number;
  structureStatus: StructureStatus;
}

export function useTeacherClasses() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["teacher-classes"],
    queryFn: async (): Promise<TeacherClassRow[]> => {
      const { data: teacher, error: teacherError } = await supabase
        .from("teachers")
        .select("id")
        .single();
      if (teacherError) throw teacherError;

      const { data: assignments, error: assignmentsError } = await supabase
        .from("class_subjects")
        .select(
          `
          id,
          class_id,
          classes ( grade, section ),
          subjects ( name ),
          course_grade_submissions ( status )
        `,
        )
        .eq("teacher_id", teacher.id);
      if (assignmentsError) throw assignmentsError;

      const classIds = Array.from(
        new Set((assignments ?? []).map((row: any) => row.class_id as string)),
      );

      const countByClass = new Map<string, number>();
      if (classIds.length > 0) {
        const { data: students, error: studentsError } = await supabase
          .from("students")
          .select("class_id")
          .in("class_id", classIds);
        if (studentsError) throw studentsError;
        for (const row of students ?? []) {
          countByClass.set(
            row.class_id,
            (countByClass.get(row.class_id) ?? 0) + 1,
          );
        }
      }

      return (assignments ?? []).map((row: any) => ({
        id: row.id,
        classId: row.class_id,
        className: `${row.classes?.grade ?? ""}${row.classes?.section ?? ""}`,
        gradeLevel: row.classes?.grade,
        subjectName: row.subjects?.name ?? "Untitled subject",
        studentCount: countByClass.get(row.class_id) ?? 0,
        structureStatus: (row.course_grade_submissions?.[0]?.status ??
          "not_started") as StructureStatus,
      }));
    },
  });
}
