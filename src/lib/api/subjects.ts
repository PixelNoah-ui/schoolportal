import { createClient } from "@/utils/supabase/client";

export interface SubjectRow {
  id: string;
  name: string;
}

export interface SubjectListParams {
  search?: string;
  classId?: string;
  page?: number;
  pageSize?: number;
}

export interface SubjectListResult {
  subjects: SubjectRow[];
  totalPages: number;
}

type SubjectRecord = {
  id: string;
  name: string;
};

function mapSubject(subject: SubjectRecord): SubjectRow {
  return {
    id: subject.id,
    name: subject.name,
  };
}

export async function fetchSubjects({
  search = "",
  classId = "all",
  page = 1,
  pageSize = 6,
}: SubjectListParams = {}): Promise<SubjectListResult> {
  const supabase = createClient();
  const from = Math.max(0, page - 1) * pageSize;
  const to = from + pageSize - 1;
  let request = supabase
    .from("subjects")
    .select("id, name", { count: "exact" })
    .order("name")
    .range(from, to);

  if (search.trim()) request = request.ilike("name", `%${search.trim()}%`);
  if (classId !== "all") {
    request = request.eq("class_subjects.class_id", classId);
  }

  const { data, error, count } = await request;
  if (error) throw new Error(error.message);
  return {
    subjects: (data as SubjectRecord[]).map(mapSubject),
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}

export async function createSubject(payload: Record<string, string>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("subjects")
    .insert({
      name: payload.name.trim(),
    })
    .select("id, name")
    .single();
  if (error) throw new Error(error.message);
  return mapSubject(data as SubjectRecord);
}

export async function updateSubject(
  id: string,
  payload: Record<string, string>,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("subjects")
    .update({
      name: payload.name.trim(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return {
    id,
    name: payload.name,
  };
}

export async function deleteSubject(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { id };
}
