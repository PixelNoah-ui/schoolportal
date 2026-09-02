import type { AllStudentRow, Profile } from "@/lib/mock-data";
import { createClient } from "@/utils/supabase/client";

type StudentRecord = {
  id: string;
  profile_id: string;
  class_id: string | null;
  grade_id: string | null;
  phone: string | null;
  gender: "male" | "female" | null;
  date_of_birth: string | null;
  temporary_password: string | null;
  created_at: string;
  profiles: Profile | Profile[] | null;
  grade_levels?: { id: string; name: string }[];
};

async function getCurrentAcademicYearId(
  supabase: ReturnType<typeof createClient>,
) {
  const { data, error } = await supabase
    .from("academic_years")
    .select("id")
    .eq("is_current", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

function mapStudent(
  student: StudentRecord,
  classMap: Record<string, { grade: number; section: string | null }>,
): AllStudentRow {
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

  const classRow = student.class_id ? classMap[student.class_id] : undefined;
  const gradeName =
    student.grade_levels?.[0]?.name ??
    (classRow
      ? `Grade ${classRow.grade} - ${classRow.section ?? ""}`
      : "Unassigned");

  return {
    id: student.id,
    student_number: student.id.slice(0, 8).toUpperCase(),
    profile,
    className: gradeName,
    avgScore: 0,
    joined: new Date(student.created_at).toLocaleDateString(),
    phone: student.phone ?? "Not provided",
    gender: student.gender,
    dob: student.date_of_birth ?? "",
    classId: student.class_id ?? "",
    gradeId: student.grade_id ?? "",
    temporaryPassword: student.temporary_password ?? undefined,
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
  classId = "all",
  academicYearId,
  page = 1,
  pageSize = 10,
}: StudentListParams = {}): Promise<StudentListResult> {
  const supabase = createClient();
  const from = Math.max(0, page - 1) * pageSize;
  const to = from + pageSize - 1;

  let resolvedAcademicYearId =
    academicYearId && academicYearId !== "all" ? academicYearId : null;

  if (!resolvedAcademicYearId) {
    resolvedAcademicYearId = await getCurrentAcademicYearId(supabase);
  }

  let request = supabase
    .from("students")
    .select(
      "id, profile_id, class_id, grade_id, phone, gender, date_of_birth, temporary_password, created_at, profiles!students_profile_id_fkey(id, full_name, username, email, role), grade_levels(id, name)",
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

  if (resolvedAcademicYearId) {
    const { data: yearClasses, error: yearClassesError } = await supabase
      .from("classes")
      .select("id")
      .eq("academic_year_id", resolvedAcademicYearId);

    if (yearClassesError) throw new Error(yearClassesError.message);

    const yearClassIds = (yearClasses ?? []).map((item) => item.id);

    if (yearClassIds.length > 0) {
      request = request.or(
        `class_id.is.null,class_id.in.(${yearClassIds.join(",")})`,
      );
    } else {
      request = request.is("class_id", null);
    }
  }

  if (classId !== "all") request = request.eq("class_id", classId);

  const { data, error, count } = await request;
  if (error) throw new Error(error.message);

  const classIds = Array.from(
    new Set(
      (data ?? [])
        .map((student) => student.class_id)
        .filter((classId): classId is string => Boolean(classId)),
    ),
  );

  let classMap: Record<string, { grade: number; section: string | null }> = {};
  if (classIds.length > 0) {
    const { data: classRows, error: classError } = await supabase
      .from("classes")
      .select("id, grade, section")
      .in("id", classIds);

    if (classError) throw new Error(classError.message);

    classMap = Object.fromEntries(
      (classRows ?? []).map((classRow) => [
        classRow.id,
        { grade: classRow.grade, section: classRow.section ?? null },
      ]),
    );
  }

  return {
    students: (data as StudentRecord[]).map((student) =>
      mapStudent(student, classMap),
    ),
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
      grade_id: payload.grade_id || null,
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
