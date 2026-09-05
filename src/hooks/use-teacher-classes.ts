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
  isHomeroom?: boolean;
  structureStatus: StructureStatus;
}

type TeacherAssignmentRow = {
  id: string;
  class_id: string;
  subject_id: string;
};

export function useTeacherClasses() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["teacher-classes"],
    queryFn: async (): Promise<TeacherClassRow[]> => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw userError ?? new Error("Not authenticated");

      const { data: teacher, error: teacherError } = await supabase
        .from("teachers")
        .select("id")
        .eq("profile_id", user.id)
        .single();
      if (teacherError) throw teacherError;

      const { data: assignments, error: assignmentsError } = await supabase
        .from("class_subjects")
        .select(
          `
          id,
          class_id,
          subject_id
        `,
        )
        .eq("teacher_id", teacher.id);
      if (assignmentsError) throw assignmentsError;

      const assignmentRows = (assignments ?? []) as TeacherAssignmentRow[];
      const classIds = Array.from(
        new Set(assignmentRows.map((row) => row.class_id)),
      );
      const subjectIds = Array.from(
        new Set(assignmentRows.map((row) => row.subject_id)),
      );
      if (assignmentRows.length === 0) return [];

      const [
        { data: classRows, error: classesError },
        { data: subjectRows, error: subjectsError },
      ] = await Promise.all([
        supabase
          .from("classes")
          .select(
            "id, name, section, homeroom_teacher_id, grade_levels!classes_grade_level_id_fkey(level_number)",
          )
          .in("id", classIds),
        supabase.from("subjects").select("id, name").in("id", subjectIds),
      ]);
      if (classesError) throw classesError;
      if (subjectsError) throw subjectsError;

      const classesById = new Map(
        (classRows ?? []).map((classRow) => {
          const gradeLevels = Array.isArray(classRow.grade_levels)
            ? classRow.grade_levels[0]
            : classRow.grade_levels;
          return [
            classRow.id,
            {
              name: classRow.name,
              section: classRow.section,
              grade: gradeLevels?.level_number ?? 0,
              isHomeroom: classRow.homeroom_teacher_id === teacher.id,
            },
          ];
        }),
      );
      const subjectsById = new Map(
        (subjectRows ?? []).map((subject) => [subject.id, subject.name]),
      );

      const countByClass = new Map<string, number>();
      if (classIds.length > 0) {
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from("student_enrollments")
          .select("class_id, student_id")
          .in("class_id", classIds)
          .eq("status", "active");
        if (enrollmentsError) throw enrollmentsError;

        const studentsByClass = new Map<string, Set<string>>();
        for (const row of enrollments ?? []) {
          const studentIds = studentsByClass.get(row.class_id) ?? new Set();
          studentIds.add(row.student_id);
          studentsByClass.set(row.class_id, studentIds);
        }
        for (const [classId, studentIds] of studentsByClass) {
          countByClass.set(classId, studentIds.size);
        }
      }

      return assignmentRows.map((row) => {
        const classRow = classesById.get(row.class_id);
        return {
          id: row.id,
          classId: row.class_id,
          className: `${classRow?.grade ?? ""}${classRow?.section ?? ""}`,
          gradeLevel: classRow?.grade ?? 0,
          subjectName: subjectsById.get(row.subject_id) ?? "Untitled subject",
          studentCount: countByClass.get(row.class_id) ?? 0,
          isHomeroom: classRow?.isHomeroom ?? false,
          structureStatus: "not_started",
        };
      });
    },
  });
}
