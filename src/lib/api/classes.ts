import { createClient } from "@/utils/supabase/client";

export interface ClassRow {
  id: string;
  academicYearId?: string | null;
  academicYearName?: string;
  name: string;
  grade: number;
  section: string;
  studentCount: number;
  teacher: string;
  subjects: { classSubjectId: string; id: string; name: string }[];
}

export interface ClassListParams {
  search?: string;
  academicYearId?: string;
  page?: number;
  pageSize?: number;
}

export interface ClassListResult {
  classes: ClassRow[];
  totalPages: number;
}

export type ClassOption = Pick<ClassRow, "id" | "name" | "grade" | "section">;

type ClassRecord = {
  id: string;
  academic_year_id: string | null;
  academic_years?: { id: string; name: string }[];
  name: string;
  grade_levels: { level_number: number }[] | { level_number: number } | null;
  section: string | null;
  homeroom_teacher_id?: string | null;
  created_at: string;
  student_enrollments: { id: string }[];
  class_subjects: {
    id: string;
    subject_id: string;
    subjects:
      | { id: string; name: string }[]
      | { id: string; name: string }
      | null;
    teachers:
      | { profiles: { full_name: string }[] }[]
      | { profiles: { full_name: string }[] }
      | null;
  }[];
  homeroom_teacher: { profiles: { full_name: string }[] }[];
};

function asArray<T>(value: T | T[] | null | undefined): T[] {
  return value == null ? [] : Array.isArray(value) ? value : [value];
}

function mapClass(classRow: ClassRecord): ClassRow {
  const assignments = asArray(classRow.class_subjects);
  const teacherNames = [
    ...new Set(
      assignments
        .flatMap((assignment) =>
          asArray(assignment.teachers).flatMap((teacherRow) =>
            asArray(teacherRow.profiles).map((profile) => profile.full_name),
          ),
        )
        .filter(Boolean),
    ),
  ];
  const homeroomTeacher =
    classRow.homeroom_teacher?.[0]?.profiles?.[0]?.full_name;

  return {
    id: classRow.id,
    academicYearId: classRow.academic_year_id,
    academicYearName: classRow.academic_years?.[0]?.name ?? undefined,
    name: classRow.name,
    grade: asArray(classRow.grade_levels)[0]?.level_number ?? 0,
    section: classRow.section ?? "",
    studentCount: (classRow.student_enrollments ?? []).length,
    subjects: assignments.flatMap((assignment) =>
      asArray(assignment.subjects).map((subject) => ({
        classSubjectId: assignment.id,
        id: assignment.subject_id,
        name: subject.name,
      })),
    ),
    teacher:
      homeroomTeacher ??
      (teacherNames.length ? teacherNames.join(", ") : "Unassigned"),
  };
}

export async function fetchClasses({
  search = "",
  academicYearId,
  page = 1,
  pageSize = 10,
}: ClassListParams = {}): Promise<ClassListResult> {
  const supabase = createClient();
  const from = Math.max(0, page - 1) * pageSize;
  const to = from + pageSize - 1;
  let request = supabase
    .from("classes")
    .select(
      "id, academic_year_id, academic_years!classes_academic_year_id_fkey(id, name), name, section, grade_levels!classes_grade_level_id_fkey(level_number), homeroom_teacher:teachers!classes_homeroom_teacher_id_fkey(profiles(full_name)), created_at, student_enrollments(id), class_subjects(id, subject_id, subjects(id, name), teachers(profiles(full_name)))",
      { count: "exact" },
    )
    .order("level_number", { foreignTable: "grade_levels", ascending: true })
    .order("section", { ascending: true })
    .range(from, to);

  if (academicYearId && academicYearId !== "all") {
    request = request.eq("academic_year_id", academicYearId);
  }

  if (search.trim()) {
    const term = search.trim();
    request = request.or(`name.ilike.%${term}%,section.ilike.%${term}%`);
  }

  const { data, error, count } = await request;
  if (error) throw new Error(error.message);
  return {
    classes: (data as ClassRecord[]).map(mapClass),
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}

export async function fetchClassOptions({
  academicYearId,
}: { academicYearId?: string } = {}): Promise<ClassOption[]> {
  const supabase = createClient();
  let request = supabase
    .from("classes")
    .select(
      "id, academic_year_id, name, section, grade_levels!classes_grade_level_id_fkey(level_number)",
    )
    .order("level_number", { foreignTable: "grade_levels", ascending: true })
    .order("section", { ascending: true });

  if (academicYearId && academicYearId !== "all") {
    request = request.eq("academic_year_id", academicYearId);
  }

  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return (data ?? []).map((classRow) => ({
    id: classRow.id,
    name: classRow.name,
    grade: asArray(classRow.grade_levels)[0]?.level_number ?? 0,
    section: classRow.section ?? "",
  }));
}

function buildClassName(grade: number | string, section?: string | null) {
  const cleanSection = section?.trim();
  return cleanSection ? `Grade ${grade} - ${cleanSection}` : `Grade ${grade}`;
}

async function ensureGradeLevel(
  supabase: ReturnType<typeof createClient>,
  levelNumber: number,
) {
  const { data, error } = await supabase
    .from("grade_levels")
    .upsert(
      { name: `Grade ${levelNumber}`, level_number: levelNumber },
      { onConflict: "level_number" },
    )
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function createClass(payload: Record<string, string>) {
  const supabase = createClient();
  const grade = Number(payload.grade ?? 0);
  const section = (payload.section ?? "").trim() || "General";
  const className = payload.name?.trim() || buildClassName(grade, section);
  const gradeLevelId = await ensureGradeLevel(supabase, grade);

  const { data, error } = await supabase
    .from("classes")
    .insert({
      academic_year_id: payload.academic_year_id || null,
      grade_level_id: gradeLevelId,
      name: className,
      section,
      homeroom_teacher_id: payload.homeroom_teacher || null,
    })
    .select(
      "id, academic_year_id, academic_years!classes_academic_year_id_fkey(id, name), name, section, grade_levels!classes_grade_level_id_fkey(level_number), homeroom_teacher:teachers!classes_homeroom_teacher_id_fkey(profiles(full_name)), created_at, student_enrollments(id), class_subjects(teachers(profiles(full_name)))",
    )
    .single();
  if (error) throw new Error(error.message);
  return mapClass(data as ClassRecord);
}

export async function updateClass(id: string, payload: Record<string, string>) {
  const supabase = createClient();
  const grade = Number(payload.grade ?? 0);
  const section = (payload.section ?? "").trim() || "General";
  const className = payload.name?.trim() || buildClassName(grade, section);
  const gradeLevelId = await ensureGradeLevel(supabase, grade);

  const { error } = await supabase
    .from("classes")
    .update({
      academic_year_id: payload.academic_year_id || null,
      grade_level_id: gradeLevelId,
      name: className,
      section,
      homeroom_teacher_id: payload.homeroom_teacher || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { id, ...payload, name: className };
}

export async function deleteClass(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("classes").delete().eq("id", id);
  if (error) {
    if (
      error.code === "23503" &&
      error.message.includes("class_subjects_class_id_fkey")
    ) {
      throw new Error(
        "This class has subject assignments. Remove those assignments before deleting the class.",
      );
    }

    throw new Error(error.message);
  }
  return { id };
}
