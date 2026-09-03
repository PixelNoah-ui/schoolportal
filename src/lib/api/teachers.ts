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
  profiles: Profile | Profile[] | null;
  class_subjects: {
    class_id: string;
    subjects: { name: string } | { name: string }[] | null;
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

  return {
    id: teacher.id,
    teacher_number: "",
    profile: normalizedProfile,
    subjects: [...new Set(subjects)],
    classCount: classIds.length,
    phone: teacher.phone ?? "",
    temporaryPassword: teacher.temporary_password ?? undefined,
  };
}

export async function fetchTeachers({
  search = "",
  page = 1,
  pageSize = 10,
}: TeacherListParams = {}): Promise<TeacherListResult> {
  const supabase = createClient();
  const from = Math.max(0, page - 1) * pageSize;
  const to = from + pageSize - 1;
  let request = supabase
    .from("teachers")
    .select(
      "id, profile_id, phone, temporary_password, created_at, profiles!teachers_profile_id_fkey(id, full_name, username, email, role), class_subjects(class_id, subjects(name))",
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
  return { id, ...payload };
}

export async function deleteTeacher(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("teachers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { id };
}
