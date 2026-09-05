import { createClient } from "@/utils/supabase/client";

export interface TeacherStudentRow {
  id: string;
  studentNumber: string;
  fullName: string;
  email: string;
  className: string;
  classGrade: number;
  phone?: string;
  joinDate: string;
}

export interface TeacherStudentListParams {
  search?: string;
  classId?: string;
  page?: number;
  pageSize?: number;
}

export interface TeacherStudentListResult {
  students: TeacherStudentRow[];
  totalPages: number;
}

type StudentRecord = {
  id: string;
  phone: string | null;
  created_at: string;
  profiles: { full_name: string; email: string }[];
  class_id: string;
  classes?: { id: string; name: string; grade: number }[];
};

function mapStudent(student: StudentRecord): TeacherStudentRow {
  return {
    id: student.id,
    studentNumber: student.id.slice(0, 8).toUpperCase(),
    fullName: student.profiles[0]?.full_name ?? "Unknown Student",
    email: student.profiles[0]?.email ?? "",
    className: student.classes?.[0]?.name ?? "Unassigned",
    classGrade: student.classes?.[0]?.grade ?? 0,
    phone: student.phone ?? undefined,
    joinDate: new Date(student.created_at).toLocaleDateString(),
  };
}

/**
 * Fetch all students from classes taught by current teacher
 */
export async function fetchTeacherStudents({
  search = "",
  classId,
  page = 1,
  pageSize = 6,
}: TeacherStudentListParams = {}): Promise<TeacherStudentListResult> {
  const supabase = createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const from = Math.max(0, page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Fetch teacher ID
  const { data: teacherData, error: teacherError } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (teacherError || !teacherData) throw new Error("Teacher not found");

  // Get all class_subjects for this teacher
  const { data: classSubjects, error: csError } = await supabase
    .from("class_subjects")
    .select("class_id")
    .eq("teacher_id", teacherData.id);

  if (csError) throw new Error(csError.message);

  const classIds = [
    ...new Set((classSubjects || []).map((cs) => cs.class_id).filter(Boolean)),
  ];

  if (classIds.length === 0) {
    return {
      students: [],
      totalPages: 1,
    };
  }

  // Fetch students in these classes
  let request = supabase
    .from("students")
    .select(
      "id, phone, created_at, profiles(full_name, email), class_id, classes(id, name, grade)",
      { count: "exact" },
    )
    .in("class_id", classIds)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (classId) {
    request = request.eq("class_id", classId);
  }

  if (search.trim()) {
    request = request.or(
      `full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`,
      { foreignTable: "profiles" },
    );
  }

  const { data, error, count } = await request;
  if (error) throw new Error(error.message);

  return {
    students: (data as StudentRecord[]).map(mapStudent),
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}
