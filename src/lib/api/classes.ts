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
  grade: number;
  section: string | null;
  created_at: string;
  students: { id: string }[];
  class_subjects: {
    teachers: { profiles: { full_name: string }[] }[];
  }[];
};

function mapClass(classRow: ClassRecord): ClassRow {
  const teacherNames = [
    ...new Set(
      classRow.class_subjects
        .flatMap((assignment) =>
          assignment.teachers.flatMap((teacherRow) =>
            teacherRow.profiles.map((profile) => profile.full_name),
          ),
        )
        .filter(Boolean),
    ),
  ];

  return {
    id: classRow.id,
    academicYearId: classRow.academic_year_id,
    academicYearName: classRow.academic_years?.[0]?.name ?? undefined,
    name: classRow.name,
    grade: classRow.grade,
    section: classRow.section ?? "",
    studentCount: classRow.students.length,
    teacher: teacherNames.length ? teacherNames.join(", ") : "Unassigned",
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
      "id, academic_year_id, academic_years!classes_academic_year_id_fkey(id, name), name, grade, section, created_at, students(id), class_subjects(teachers(profiles(full_name)))",
      { count: "exact" },
    )
    .order("grade", { ascending: true })
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

export async function fetchClassOptions(): Promise<ClassOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("classes")
    .select("id, academic_year_id, name, grade, section")
    .order("grade", { ascending: true })
    .order("section", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((classRow) => ({
    id: classRow.id,
    name: classRow.name,
    grade: classRow.grade,
    section: classRow.section ?? "",
  }));
}

export async function createClass(payload: Record<string, string>) {
  const supabase = createClient();
  const section = payload.section.trim();
  const { data, error } = await supabase
    .from("classes")
    .insert({
      academic_year_id: payload.academic_year_id || null,
      name: payload.name?.trim() || `Class ${section}`,
      grade: Number(payload.grade),
      section: section || null,
    })
    .select(
      "id, academic_year_id, academic_years!classes_academic_year_id_fkey(id, name), name, grade, section, created_at, students(id), class_subjects(teachers(profiles(full_name)))",
    )
    .single();
  if (error) throw new Error(error.message);
  return mapClass(data as ClassRecord);
}

export async function updateClass(id: string, payload: Record<string, string>) {
  const supabase = createClient();
  const section = payload.section.trim();
  const { error } = await supabase
    .from("classes")
    .update({
      academic_year_id: payload.academic_year_id || null,
      name: payload.name?.trim() || `Class ${section}`,
      grade: Number(payload.grade),
      section: section || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { id, ...payload };
}

export async function deleteClass(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("classes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { id };
}
