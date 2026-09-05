import { createClient } from "@/utils/supabase/client";

export interface GradeRow {
  id: string;
  name: string;
  levelNumber: number;
  studentCount: number;
}

export interface GradeListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface GradeListResult {
  grades: GradeRow[];
  totalPages: number;
}

export type GradeOption = Pick<GradeRow, "id" | "name" | "levelNumber">;

type GradeRecord = {
  id: string;
  name: string;
  level_number: number;
  created_at: string;
  students: { id: string }[];
};

function mapGrade(grade: GradeRecord): GradeRow {
  return {
    id: grade.id,
    name: grade.name,
    levelNumber: grade.level_number,
    studentCount: grade.students.length,
  };
}

export async function fetchGrades({
  search = "",
  page = 1,
  pageSize = 6,
}: GradeListParams = {}): Promise<GradeListResult> {
  const supabase = createClient();
  const from = Math.max(0, page - 1) * pageSize;
  const to = from + pageSize - 1;

  let request = supabase
    .from("grade_levels")
    .select("id, name, level_number, created_at, students(id)", {
      count: "exact",
    })
    .order("level_number", { ascending: true })
    .range(from, to);

  if (search.trim()) {
    request = request.ilike("name", `%${search.trim()}%`);
  }

  const { data, error, count } = await request;
  if (error) throw new Error(error.message);

  return {
    grades: (data as GradeRecord[]).map(mapGrade),
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}

export async function fetchGradeOptions(): Promise<GradeOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("grade_levels")
    .select("id, name, level_number")
    .order("level_number", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((grade) => ({
    id: grade.id,
    name: grade.name,
    levelNumber: grade.level_number,
  }));
}

export async function createGrade(payload: Record<string, string>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("grade_levels")
    .insert({
      name: payload.name?.trim(),
      level_number: Number(payload.level_number),
    })
    .select("id, name, level_number, created_at, students(id)")
    .single();

  if (error) throw new Error(error.message);
  return mapGrade(data as GradeRecord);
}

export async function updateGrade(id: string, payload: Record<string, string>) {
  const supabase = createClient();
  const { error } = await supabase
    .from("grade_levels")
    .update({
      name: payload.name?.trim(),
      level_number: Number(payload.level_number),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  return { id, ...payload };
}

export async function deleteGrade(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("grade_levels").delete().eq("id", id);

  if (error) throw new Error(error.message);
  return { id };
}
