import { createClient } from "@/utils/supabase/client";

export interface TeacherClassRow {
  id: string;
  subjectName: string;
  className: string;
  classGrade: number;
  classSection: string;
  studentCount: number;
  semester: string;
  semesterId: string;
}

export interface TeacherClassDetail extends TeacherClassRow {
  academicYear: string;
  students: {
    id: string;
    studentNumber: string;
    fullName: string;
    email: string;
  }[];
}

type ClassSubjectRecord = {
  id: string;
  class_subjects: {
    id: string;
    subject_id: string;
    subjects: { id: string; name: string }[];
    semesters: { id: string; name: string }[];
  }[];
  name: string;
  grade: number;
  section: string | null;
  academic_years: { id: string; name: string }[];
  students: {
    id: string;
    profiles: { full_name: string; email: string }[];
  }[];
};

export interface TeacherClassesListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface TeacherClassesListResult {
  classes: TeacherClassRow[];
  totalPages: number;
}

function mapTeacherClass(
  classSubject: ClassSubjectRecord,
  classSubjectDetail: ClassSubjectRecord["class_subjects"][0],
): TeacherClassRow {
  return {
    id: classSubjectDetail.id,
    subjectName: classSubjectDetail.subjects[0]?.name ?? "Unknown Subject",
    className: classSubject.name,
    classGrade: classSubject.grade,
    classSection: classSubject.section ?? "",
    studentCount: classSubject.students.length,
    semester: classSubjectDetail.semesters[0]?.name ?? "Unknown Semester",
    semesterId: classSubjectDetail.semesters[0]?.id ?? "",
  };
}

function mapTeacherClassDetail(
  classSubject: ClassSubjectRecord,
  classSubjectDetail: ClassSubjectRecord["class_subjects"][0],
): TeacherClassDetail {
  return {
    id: classSubjectDetail.id,
    subjectName: classSubjectDetail.subjects[0]?.name ?? "Unknown Subject",
    className: classSubject.name,
    classGrade: classSubject.grade,
    classSection: classSubject.section ?? "",
    studentCount: classSubject.students.length,
    semester: classSubjectDetail.semesters[0]?.name ?? "Unknown Semester",
    semesterId: classSubjectDetail.semesters[0]?.id ?? "",
    academicYear: classSubject.academic_years[0]?.name ?? "Unknown Year",
    students: classSubject.students.map((student) => ({
      id: student.id,
      studentNumber: student.id.slice(0, 8).toUpperCase(),
      fullName: student.profiles[0]?.full_name ?? "Unknown Student",
      email: student.profiles[0]?.email ?? "",
    })),
  };
}

/**
 * Fetch all classes assigned to the current teacher
 */
export async function fetchTeacherClasses({
  search = "",
  page = 1,
  pageSize = 10,
}: TeacherClassesListParams = {}): Promise<TeacherClassesListResult> {
  const supabase = createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const from = Math.max(0, page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Fetch teacher record to get teacher ID
  const { data: teacherData, error: teacherError } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (teacherError || !teacherData) throw new Error("Teacher not found");

  // Fetch classes assigned to this teacher through class_subjects
  let request = supabase
    .from("classes")
    .select(
      "id, name, grade, section, academic_years!classes_academic_year_id_fkey(id, name), students(id, profiles(full_name, email)), class_subjects(id, subject_id, subjects(id, name), semesters(id, name))",
      { count: "exact" },
    )
    .eq("class_subjects.teacher_id", teacherData.id)
    .order("grade", { ascending: true })
    .order("section", { ascending: true })
    .range(from, to);

  if (search.trim()) {
    const term = search.trim().toLowerCase();
    request = request.or(`name.ilike.%${term}%,subjects.name.ilike.%${term}%`);
  }

  const { data, error, count } = await request;
  if (error) throw new Error(error.message);

  const classes: TeacherClassRow[] = [];
  for (const classRecord of (data as ClassSubjectRecord[]) || []) {
    for (const classSubject of classRecord.class_subjects) {
      classes.push(mapTeacherClass(classRecord, classSubject));
    }
  }

  return {
    classes,
    totalPages: Math.max(
      1,
      Math.ceil((classes.length / (count ?? 0) || 0) / pageSize),
    ),
  };
}

/**
 * Fetch details for a specific class (students, grades, etc.)
 */
export async function fetchTeacherClassDetail(
  classSubjectId: string,
): Promise<TeacherClassDetail> {
  const supabase = createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // Fetch the class_subject record to verify teacher owns it
  const { data: classSubject, error: csError } = await supabase
    .from("class_subjects")
    .select("id, class_id, teacher_id")
    .eq("id", classSubjectId)
    .single();

  if (csError || !classSubject) throw new Error("Class not found");

  // Verify teacher owns this class
  const { data: teacher, error: teacherError } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (teacherError || !teacher) throw new Error("Teacher profile not found");

  if (classSubject.teacher_id !== teacher.id) {
    throw new Error("Unauthorized: You do not teach this class");
  }

  // Fetch full class details
  const { data, error } = await supabase
    .from("classes")
    .select(
      "id, name, grade, section, academic_years!classes_academic_year_id_fkey(id, name), students(id, profiles(full_name, email)), class_subjects(id, subject_id, subjects(id, name), semesters(id, name))",
    )
    .eq("id", classSubject.class_id)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Class not found");

  const classRecord = data as ClassSubjectRecord;
  const classSubjectDetail = classRecord.class_subjects.find(
    (cs) => cs.id === classSubjectId,
  );

  if (!classSubjectDetail) throw new Error("Class subject not found");

  return mapTeacherClassDetail(classRecord, classSubjectDetail);
}
