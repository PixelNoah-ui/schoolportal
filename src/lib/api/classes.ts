import { createClient } from "@/utils/supabase/client";

export interface ClassRow {
  id: string;
  name: string;
  grade: number;
  section: string;
  studentCount: number;
  teacher: string;
}

export interface ClassListParams {
  search?: string;
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
  const teacher = classRow.class_subjects
    .flatMap((assignment) =>
      assignment.teachers.flatMap((teacherRow) =>
        teacherRow.profiles.map((profile) => profile.full_name),
      ),
    )
    .find(Boolean);

  return {
    id: classRow.id,
    name: classRow.name,
    grade: classRow.grade,
    section: classRow.section ?? "",
    studentCount: classRow.students.length,
    teacher: teacher ?? "Unassigned",
  };
}

export async function fetchClasses({
  search = "",
  page = 1,
  pageSize = 10,
}: ClassListParams = {}): Promise<ClassListResult> {
  const supabase = createClient();
  const from = Math.max(0, page - 1) * pageSize;
  const to = from + pageSize - 1;
  let request = supabase
    .from("classes")
    .select(
      "id, name, grade, section, created_at, students(id), class_subjects(teachers(profiles(full_name)))",
      { count: "exact" },
    )
    .order("grade", { ascending: true })
    .order("section", { ascending: true })
    .range(from, to);

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
    .select("id, name, grade, section")
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
      name: payload.name?.trim() || `Class ${section}`,
      grade: Number(payload.grade),
      section: section || null,
    })
    .select(
      "id, name, grade, section, created_at, students(id), class_subjects(teachers(profiles(full_name)))",
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
