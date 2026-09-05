import { createClient } from "@/utils/supabase/client";

export interface ClassSubjectRow {
  id: string;
  classId: string;
  subjectId: string;
  className: string;
  subjectName: string;
  teacherId: string | null;
  teacherName: string | null;
}

export interface ClassSubjectListResult {
  classId: string;
  academicYearId: string | null;
  className: string;
  grade: number | null;
  section: string | null;
  homeroomTeacherId: string | null;
  homeroomTeacherName: string | null;
  classSubjects: ClassSubjectRow[];
}

export interface AvailableTeacherOption {
  id: string;
  name: string;
}

export interface AvailableSubjectOption {
  id: string;
  name: string;
}

type ClassSubjectRecord = {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string | null;
  classes:
    | {
        id: string;
        name: string;
        grade_levels:
          | { level_number: number }[]
          | { level_number: number }
          | null;
        section: string | null;
        homeroom_teacher?:
          | { id: string; profiles: { full_name: string }[] }[]
          | { id: string; profiles: { full_name: string }[] }
          | null;
      }[]
    | {
        id: string;
        name: string;
        grade_levels:
          | { level_number: number }[]
          | { level_number: number }
          | null;
        section: string | null;
        homeroom_teacher?:
          | { id: string; profiles: { full_name: string }[] }[]
          | { id: string; profiles: { full_name: string }[] }
          | null;
      }
    | null;
  subjects:
    | { id: string; name: string }[]
    | { id: string; name: string }
    | null;
  teachers:
    | { id: string; profiles: { full_name: string }[] }[]
    | { id: string; profiles: { full_name: string }[] }
    | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return value == null
    ? null
    : Array.isArray(value)
      ? (value[0] ?? null)
      : value;
}

function mapClassSubject(record: ClassSubjectRecord): ClassSubjectRow {
  const classRow = firstRelation(record.classes);
  const subjectRow = firstRelation(record.subjects);
  const teacherRow = firstRelation(record.teachers);
  const teacherName = firstRelation(teacherRow?.profiles)?.full_name ?? null;
  const grade = firstRelation(classRow?.grade_levels)?.level_number;

  return {
    id: record.id,
    classId: record.class_id,
    subjectId: record.subject_id,
    className: classRow
      ? `Grade ${grade ?? ""} - ${classRow.section ?? ""}`.trim()
      : "Class",
    subjectName: subjectRow?.name ?? "Unnamed subject",
    teacherId: record.teacher_id,
    teacherName,
  };
}

export async function fetchClassSubjects({
  classId,
}: {
  classId: string;
}): Promise<ClassSubjectListResult> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("class_subjects")
    .select(
      "id, class_id, subject_id, teacher_id, classes(id, name, grade_levels!classes_grade_level_id_fkey(level_number), section, homeroom_teacher:teachers!classes_homeroom_teacher_id_fkey(id, profiles(full_name))), subjects(id, name), teachers(id, profiles(full_name))",
    )
    .eq("class_id", classId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const { data: standaloneClass, error: classError } = await supabase
    .from("classes")
    .select(
      "id, academic_year_id, name, grade_levels!classes_grade_level_id_fkey(level_number), section, homeroom_teacher:teachers!classes_homeroom_teacher_id_fkey(id, profiles(full_name))",
    )
    .eq("id", classId)
    .single();

  if (classError) throw new Error(classError.message);
  const classInfo = standaloneClass as unknown as {
    id: string;
    name: string;
    grade_levels: { level_number: number }[] | { level_number: number } | null;
    section: string | null;
    homeroom_teacher:
      | { id: string; profiles: { full_name: string }[] }[]
      | { id: string; profiles: { full_name: string }[] }
      | null;
  };

  const homeroomTeacher = firstRelation(classInfo?.homeroom_teacher);

  return {
    classId,
    academicYearId: classInfo
      ? ((classInfo as { academic_year_id?: string | null }).academic_year_id ??
        null)
      : null,
    className: classInfo
      ? `Grade ${firstRelation(classInfo.grade_levels)?.level_number ?? ""} - ${classInfo.section ?? ""}`.trim()
      : "Class",
    grade: firstRelation(classInfo?.grade_levels)?.level_number ?? null,
    section: classInfo?.section ?? null,
    homeroomTeacherId: homeroomTeacher?.id ?? null,
    homeroomTeacherName:
      firstRelation(homeroomTeacher?.profiles)?.full_name ?? null,
    classSubjects: (data ?? []).map((record) =>
      mapClassSubject(record as ClassSubjectRecord),
    ),
  };
}

export async function fetchAvailableSubjects({
  classId,
}: {
  classId: string;
}): Promise<{ subjects: AvailableSubjectOption[] }> {
  const supabase = createClient();
  const { data: assignedData, error: assignedError } = await supabase
    .from("class_subjects")
    .select("subject_id")
    .eq("class_id", classId);

  if (assignedError) throw new Error(assignedError.message);

  const assignedIds = new Set(
    (assignedData ?? []).map((row) => row.subject_id).filter(Boolean),
  );

  const { data, error } = await supabase
    .from("subjects")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  return {
    subjects: (data ?? [])
      .filter((subject) => !assignedIds.has(subject.id))
      .map((subject) => ({
        id: subject.id,
        name: subject.name,
      })),
  };
}

export async function fetchAvailableTeachers(): Promise<{
  teachers: AvailableTeacherOption[];
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("teachers")
    .select("id, profiles!teachers_profile_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return {
    teachers: (data ?? []).map((teacher) => {
      const profile = Array.isArray(teacher.profiles)
        ? teacher.profiles[0]
        : teacher.profiles;

      return {
        id: teacher.id,
        name: profile?.full_name ?? "Unnamed teacher",
      };
    }),
  };
}

export async function addClassSubject({
  classId,
  subjectId,
  teacherId = null,
  semesterId,
}: {
  classId: string;
  subjectId: string;
  teacherId?: string | null;
  semesterId?: string;
}) {
  const supabase = createClient();
  let resolvedSemesterId = semesterId;

  if (!resolvedSemesterId) {
    const { data: classRow, error: classError } = await supabase
      .from("classes")
      .select("academic_year_id")
      .eq("id", classId)
      .single();
    if (classError) throw new Error(classError.message);

    const { data: semester, error: semesterError } = await supabase
      .from("semesters")
      .select("id")
      .eq("academic_year_id", classRow.academic_year_id)
      .order("ordinal", { ascending: true })
      .limit(1)
      .single();
    if (semesterError) throw new Error(semesterError.message);
    resolvedSemesterId = semester.id;
  }

  const { data, error } = await supabase
    .from("class_subjects")
    .insert({
      class_id: classId,
      subject_id: subjectId,
      teacher_id: teacherId ?? null,
      semester_id: resolvedSemesterId,
    })
    .select(
      "id, class_id, subject_id, teacher_id, classes(id, name, grade_levels!classes_grade_level_id_fkey(level_number), section, homeroom_teacher:teachers!classes_homeroom_teacher_id_fkey(id, profiles(full_name))), subjects(id, name), teachers(id, profiles(full_name))",
    )
    .single();

  if (error) throw new Error(error.message);
  return mapClassSubject(data as ClassSubjectRecord);
}

export async function updateClassSubjectTeacher({
  classSubjectId,
  classId,
  subjectId,
  teacherId,
}: {
  classSubjectId?: string;
  classId?: string;
  subjectId?: string;
  teacherId: string | null;
}) {
  const supabase = createClient();

  let request = supabase.from("class_subjects").update({
    teacher_id: teacherId ?? null,
  });

  if (classSubjectId) {
    request = request.eq("id", classSubjectId);
  } else if (classId && subjectId) {
    request = request.eq("class_id", classId).eq("subject_id", subjectId);
  } else {
    throw new Error("A class subject reference is required.");
  }

  const { data, error } = await request
    .select(
      "id, class_id, subject_id, teacher_id, classes(id, name, grade_levels!classes_grade_level_id_fkey(level_number), section, homeroom_teacher:teachers!classes_homeroom_teacher_id_fkey(id, profiles(full_name))), subjects(id, name), teachers(id, profiles(full_name))",
    )
    .single();

  if (error) throw new Error(error.message);
  return mapClassSubject(data as ClassSubjectRecord);
}

export async function removeClassSubject({
  classSubjectId,
  classId,
  subjectId,
}: {
  classSubjectId?: string;
  classId?: string;
  subjectId?: string;
}) {
  const supabase = createClient();

  let request = supabase.from("class_subjects").delete();

  if (classSubjectId) {
    request = request.eq("id", classSubjectId);
  } else if (classId && subjectId) {
    request = request.eq("class_id", classId).eq("subject_id", subjectId);
  } else {
    throw new Error("A class subject reference is required.");
  }

  const { error } = await request;
  if (error) {
    const message = error.message ?? "";
    if (
      error.code === "23503" ||
      message.toLowerCase().includes("grades") ||
      message.toLowerCase().includes("foreign key")
    ) {
      throw new Error(
        "Can't remove — this assignment already has grades recorded. Reassign the teacher instead of deleting.",
      );
    }
    throw new Error(message || "Could not remove the class assignment.");
  }

  return { success: true };
}
