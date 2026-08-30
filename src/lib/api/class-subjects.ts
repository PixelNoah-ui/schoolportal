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
  className: string;
  grade: number | null;
  section: string | null;
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
  classes: {
    id: string;
    name: string;
    grade: number;
    section: string | null;
  }[];
  subjects: { id: string; name: string }[];
  teachers: { id: string; profiles: { full_name: string }[] }[];
};

function mapClassSubject(record: ClassSubjectRecord): ClassSubjectRow {
  const classRow = record.classes[0];
  const subjectRow = record.subjects[0];
  const teacherRow = record.teachers[0];
  const teacherName = teacherRow?.profiles?.[0]?.full_name ?? null;

  return {
    id: record.id,
    classId: record.class_id,
    subjectId: record.subject_id,
    className: classRow
      ? `Grade ${classRow.grade} - ${classRow.section ?? ""}`.trim()
      : "Class",
    subjectName: subjectRow?.name ?? "Unknown subject",
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
      "id, class_id, subject_id, teacher_id, classes(id, name, grade, section), subjects(id, name), teachers(id, profiles(full_name))",
    )
    .eq("class_id", classId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const classInfo = data?.[0]?.classes?.[0] ?? null;

  return {
    classId,
    className: classInfo
      ? `Grade ${classInfo.grade} - ${classInfo.section ?? ""}`.trim()
      : "Class",
    grade: classInfo?.grade ?? null,
    section: classInfo?.section ?? null,
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
    teachers: (data ?? []).map((teacher) => ({
      id: teacher.id,
      name: teacher.profiles?.[0]?.full_name ?? "Unnamed teacher",
    })),
  };
}

export async function addClassSubject({
  classId,
  subjectId,
  teacherId = null,
}: {
  classId: string;
  subjectId: string;
  teacherId?: string | null;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("class_subjects")
    .insert({
      class_id: classId,
      subject_id: subjectId,
      teacher_id: teacherId ?? null,
    })
    .select(
      "id, class_id, subject_id, teacher_id, classes(id, name, grade, section), subjects(id, name), teachers(id, profiles(full_name))",
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
      "id, class_id, subject_id, teacher_id, classes(id, name, grade, section), subjects(id, name), teachers(id, profiles(full_name))",
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
