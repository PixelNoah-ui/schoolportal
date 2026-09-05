import type { Profile, TeacherRow } from "@/lib/mock-data";
import { createClient } from "@/utils/supabase/client";

export interface TeacherListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface TeacherListResult {
  teachers: TeacherRow[];
  totalPages: number;
}

type TeacherRecord = {
  id: string;
  profile_id: string;
  phone: string | null;
  temporary_password: string | null;
  created_at: string;
  gender: "male" | "female" | null;
  profiles: Profile | Profile[] | null;
  class_subjects: {
    class_id: string;
    subject_id: string;
    subjects:
      | { id: string; name: string }
      | { id: string; name: string }[]
      | null;
    classes:
      | {
          name: string;
          section: string | null;
          grade_levels:
            | { level_number: number }
            | { level_number: number }[]
            | null;
        }
      | {
          name: string;
          section: string | null;
          grade_levels:
            | { level_number: number }
            | { level_number: number }[]
            | null;
        }[]
      | null;
  }[];
};

function mapTeacher(teacher: TeacherRecord): TeacherRow {
  const profile = Array.isArray(teacher.profiles)
    ? teacher.profiles[0]
    : teacher.profiles;
  const normalizedProfile: Profile = profile ?? {
    id: teacher.profile_id,
    full_name: "Unknown teacher",
    username: "-",
    email: "-",
    role: "teacher",
  };
  const subjects = teacher.class_subjects.flatMap((assignment) =>
    (Array.isArray(assignment.subjects)
      ? assignment.subjects
      : assignment.subjects
        ? [assignment.subjects]
        : []
    ).map((subject) => subject.name),
  );
  const classIds = [
    ...new Set(
      teacher.class_subjects
        .map((assignment) => assignment.class_id)
        .filter(Boolean),
    ),
  ];
  const classNames = teacher.class_subjects.map((assignment) => {
    const classData = Array.isArray(assignment.classes)
      ? assignment.classes[0]
      : assignment.classes;
    if (!classData) return "";
    const gradeLevels = Array.isArray(classData.grade_levels)
      ? classData.grade_levels[0]
      : classData.grade_levels;
    return `Grade ${gradeLevels?.level_number ?? "-"} - ${classData.section || classData.name}`;
  });
  const assignments = teacher.class_subjects.map((assignment) => ({
    subjectId: assignment.subject_id,
    classId: assignment.class_id,
  }));

  return {
    id: teacher.id,
    teacher_number: "",
    profile: normalizedProfile,
    subjects: [...new Set(subjects)],
    classes: [...new Set(classNames.filter(Boolean))],
    assignments,
    classCount: classIds.length,
    phone: teacher.phone ?? "",
    gender: teacher.gender,
    temporaryPassword: teacher.temporary_password ?? undefined,
  };
}

export async function fetchTeachers({
  search = "",
  page = 1,
  pageSize = 6,
}: TeacherListParams = {}): Promise<TeacherListResult> {
  const supabase = createClient();
  const from = Math.max(0, page - 1) * pageSize;
  const to = from + pageSize - 1;
  let request = supabase
    .from("teachers")
    .select(
      "id, profile_id, phone, gender, temporary_password, created_at, profiles!teachers_profile_id_fkey(id, full_name, username, email, role), class_subjects(class_id, subject_id, subjects(id, name), classes(name, section, grade_levels!classes_grade_level_id_fkey(level_number)))",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search.trim()) {
    request = request.or(
      `full_name.ilike.%${search.trim()}%,username.ilike.%${search.trim()}%`,
      { foreignTable: "profiles" },
    );
  }

  const { data, error, count } = await request;
  if (error) throw new Error(error.message);
  return {
    teachers: (data as TeacherRecord[]).map(mapTeacher),
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}

export async function createTeacher(payload: Record<string, unknown>) {
  const response = await fetch("/api/teachers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Could not create teacher");
  return result as TeacherRow;
}

export async function updateTeacher(
  id: string,
  payload: Record<string, unknown>,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("teachers")
    .update({ phone: payload.phone })
    .eq("id", id);
  if (error) throw new Error(error.message);
  const { data: teacher } = await supabase
    .from("teachers")
    .select("profile_id")
    .eq("id", id)
    .single();
  if (!teacher) throw new Error("Teacher not found");
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: payload.full_name, email: payload.email })
    .eq("id", teacher.profile_id);
  if (profileError) throw new Error(profileError.message);
  if (Array.isArray(payload.assignments)) {
    const assignments = payload.assignments as Array<{
      subjectId: string;
      classId: string;
    }>;
    const classIds = [
      ...new Set(assignments.map((assignment) => assignment.classId)),
    ];
    const { data: classRows, error: classError } = await supabase
      .from("classes")
      .select("id, academic_year_id")
      .in("id", classIds);
    if (classError) throw new Error(classError.message);
    const yearIds = [
      ...new Set((classRows ?? []).map((row) => row.academic_year_id)),
    ];
    const { data: semesters, error: semesterError } = await supabase
      .from("semesters")
      .select("id, academic_year_id")
      .in("academic_year_id", yearIds)
      .order("ordinal", { ascending: true });
    if (semesterError) throw new Error(semesterError.message);
    const semesterByYear = new Map<string, string>();
    for (const semester of semesters ?? []) {
      if (!semesterByYear.has(semester.academic_year_id)) {
        semesterByYear.set(semester.academic_year_id, semester.id);
      }
    }
    const yearByClass = new Map(
      (classRows ?? []).map((row) => [row.id, row.academic_year_id]),
    );
    const rows = assignments.map((assignment) => ({
      class_id: assignment.classId,
      subject_id: assignment.subjectId,
      teacher_id: id,
      semester_id: semesterByYear.get(
        yearByClass.get(assignment.classId) ?? "",
      ),
    }));
    if (rows.some((row) => !row.semester_id)) {
      throw new Error(
        "Could not find a semester for one of the selected classes",
      );
    }
    const { error: deleteError } = await supabase
      .from("class_subjects")
      .delete()
      .eq("teacher_id", id);
    if (deleteError) throw new Error(deleteError.message);
    if (rows.length) {
      const { error: assignmentError } = await supabase
        .from("class_subjects")
        .upsert(rows, { onConflict: "class_id,subject_id,semester_id" });
      if (assignmentError) throw new Error(assignmentError.message);
    }
  }
  return { id, ...payload };
}

export async function deleteTeacher(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("teachers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { id };
}
