import type { AllStudentRow, Profile } from "@/lib/mock-data";
import { createClient } from "@/utils/supabase/client";

type StudentRecord = {
  id: string;
  profile_id: string;
  phone: string | null;
  gender: "male" | "female" | null;
  date_of_birth: string | null;
  created_at: string;
  profiles: Profile | Profile[] | null;
};

function mapStudent(student: StudentRecord): AllStudentRow {
  const profileData = Array.isArray(student.profiles)
    ? (student.profiles[0] ?? null)
    : (student.profiles ?? null);

  const profile: Profile = profileData ?? {
    id: student.profile_id,
    full_name: "Student",
    username: "-",
    email: "-",
    role: "student",
  };

  return {
    id: student.id,
    student_number: student.id.slice(0, 8).toUpperCase(),
    profile,
    className: "Unassigned",
    avgScore: 0,
    joined: new Date(student.created_at).toLocaleDateString(),
    phone: student.phone ?? "Not provided",
    gender: student.gender,
    dob: student.date_of_birth ?? "",
    classId: "",
  } as AllStudentRow & { gradeId: string };
}

export interface StudentListParams {
  search?: string;
  classId?: string;
  academicYearId?: string;
  page?: number;
  pageSize?: number;
}

export interface StudentListResult {
  students: AllStudentRow[];
  totalPages: number;
}

export async function fetchStudents({
  search = "",
  page = 1,
  pageSize = 10,
}: StudentListParams = {}): Promise<StudentListResult> {
  const supabase = createClient();
  const from = Math.max(0, page - 1) * pageSize;
  const to = from + pageSize - 1;

  let request = supabase
    .from("students")
    .select(
      "id, profile_id, phone, gender, date_of_birth, created_at, profiles!students_profile_id_fkey(id, full_name, username, email, role)",
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
    students: (data as StudentRecord[]).map((student) => mapStudent(student)),
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
    .update({
      phone: payload.phone,
      gender: payload.gender || null,
      date_of_birth: payload.dob,
    })
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
