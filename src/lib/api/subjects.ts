import { createClient } from "@/utils/supabase/client";

export interface SubjectRow {
  id: string;
  name: string;
  grade: number | null;
  className: string;
  classId: string;
  teacher: string;
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
  grade: number | null;
  class_subjects: {
    class_id: string;
    classes: { id: string; grade: number; section: string | null }[];
    teachers: { profiles: { full_name: string }[] }[];
    grades: { score: number }[];
  }[];
};

function mapSubject(subject: SubjectRecord): SubjectRow {
  const teacherNames = [
    ...new Set(
      subject.class_subjects
        .flatMap((row) =>
          row.teachers.flatMap((teacherRow) =>
            teacherRow.profiles.map((profile) => profile.full_name),
          ),
        )
        .filter(Boolean),
    ),
  ];

  return {
    id: subject.id,
    name: subject.name,
    grade: subject.grade ?? null,
    classId: subject.class_subjects[0]?.class_id ?? "",
    className: subject.grade ? `Grade ${subject.grade}` : "Unassigned grade",
    teacher: teacherNames.length ? teacherNames.join(", ") : "Unassigned",
  };
}

export async function fetchSubjects({
  search = "",
  classId = "all",
  page = 1,
  pageSize = 10,
}: SubjectListParams = {}): Promise<SubjectListResult> {
  const supabase = createClient();
  const from = Math.max(0, page - 1) * pageSize;
  const to = from + pageSize - 1;
  let request = supabase
    .from("subjects")
    .select(
      "id, name, grade, class_subjects(class_id, classes(id, grade, section), teachers(profiles(full_name)), grades(score))",
      { count: "exact" },
    )
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
      grade: payload.grade ? Number(payload.grade) : null,
    })
    .select(
      "id, name, grade, class_subjects(class_id, classes(id, grade, section), teachers(profiles(full_name)), grades(score))",
    )
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
      grade: payload.grade ? Number(payload.grade) : null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return {
    id,
    name: payload.name,
    grade: payload.grade ? Number(payload.grade) : null,
  };
}

export async function deleteSubject(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { id };
}
