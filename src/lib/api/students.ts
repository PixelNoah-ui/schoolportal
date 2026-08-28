import type { AllStudentRow, Profile } from "@/lib/mock-data";
import { createClient } from "@/utils/supabase/client";

type StudentRecord = {
  id: string;
  profile_id: string;
  class_id: string | null;
  phone: string | null;
  date_of_birth: string | null;
  temporary_password: string | null;
  created_at: string;
  profiles: Profile[];
  classes: { id: string; grade: number; section: string | null }[];
};

function mapStudent(student: StudentRecord): AllStudentRow {
  const profile = student.profiles[0];
  const classRow = student.classes[0];
  return {
    id: student.id,
    student_number: "",
    profile,
    className: classRow
      ? `Grade ${classRow.grade} - ${classRow.section ?? ""}`
      : "Unassigned",
    avgScore: 0,
    joined: new Date(student.created_at).toLocaleDateString(),
    phone: student.phone ?? "",
    dob: student.date_of_birth ?? "",
    classId: student.class_id ?? "",
    temporaryPassword: student.temporary_password ?? undefined,
  };
}

export interface StudentListParams {
  search?: string;
  classId?: string;
  page?: number;
  pageSize?: number;
}

export interface StudentListResult {
  students: AllStudentRow[];
  totalPages: number;
}

export async function fetchStudents({
  search = "",
  classId = "all",
  page = 1,
  pageSize = 10,
}: StudentListParams = {}): Promise<StudentListResult> {
  const supabase = createClient();
  const from = Math.max(0, page - 1) * pageSize;
  const to = from + pageSize - 1;
  let request = supabase
    .from("students")
    .select(
      "id, profile_id, class_id, phone, date_of_birth, temporary_password, created_at, profiles!students_profile_id_fkey(id, full_name, username, email, role), classes(id, grade, section)",
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
  if (classId !== "all") request = request.eq("class_id", classId);

  const { data, error, count } = await request;
  if (error) throw new Error(error.message);
  return {
    students: (data as StudentRecord[]).map(mapStudent),
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}

export async function createStudent(payload: Record<string, string>) {
  const response = await fetch("/api/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Could not create student");
  return result as AllStudentRow;
}

export async function updateStudent(
  id: string,
  payload: Record<string, string>,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("students")
    .update({ phone: payload.phone, date_of_birth: payload.dob })
    .eq("id", id);
  if (error) throw new Error(error.message);
  const { data: student } = await supabase
    .from("students")
    .select("profile_id")
    .eq("id", id)
    .single();
  if (!student) throw new Error("Student not found");
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: payload.full_name, email: payload.email })
    .eq("id", student.profile_id);
  if (profileError) throw new Error(profileError.message);
  return { id, ...payload };
}

export async function deleteStudent(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { id };
}
