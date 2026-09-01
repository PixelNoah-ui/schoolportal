import { createClient } from "@/utils/supabase/client";

export type ScheduleCourseOption = {
  id: string;
  grade: number;
  section: string | null;
  gradeLabel: string;
  subjectName: string;
  teacherName: string;
};

export type ScheduleRow = {
  id: string;
  class_subject_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string | null;
  class_subjects?: {
    classes?: { name: string; grade: number; section: string | null }[];
    subjects?: { name: string }[];
    teachers?: { profiles?: { full_name: string }[] }[];
  }[];
};

export type ScheduleCreateRow = {
  class_subject_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room?: string | null;
};

export type ScheduleUpdatePayload = {
  class_subject_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room?: string | null;
};

function gradeLabelFor(grade: number, section: string | null) {
  return section ? `Grade ${grade} - ${section}` : `Grade ${grade}`;
}

function mapCourseRow(row: any): ScheduleCourseOption {
  const classRow = row.classes?.[0];
  const subjectName = row.subjects?.[0]?.name ?? "Subject";
  const teacherName =
    row.teachers?.[0]?.profiles?.[0]?.full_name ?? "Unassigned";

  return {
    id: row.id,
    grade: classRow?.grade ?? 0,
    section: classRow?.section ?? null,
    gradeLabel: classRow
      ? gradeLabelFor(classRow.grade, classRow.section)
      : "Unassigned class",
    subjectName,
    teacherName,
  };
}

export async function fetchScheduleCourses(): Promise<ScheduleCourseOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("class_subjects")
    .select(
      "id, classes(name, grade, section), subjects(name), teachers(profiles(full_name))",
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCourseRow);
}

export async function fetchScheduleRooms(): Promise<string[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("schedules")
    .select("room")
    .not("room", "is", null)
    .order("room", { ascending: true });

  if (error) throw new Error(error.message);

  const rooms = (data ?? [])
    .map((row) => String(row.room ?? "").trim())
    .filter(Boolean);

  return Array.from(new Set(rooms));
}

export async function fetchSchedules(): Promise<ScheduleRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("schedules")
    .select(
      "id, class_subject_id, day_of_week, start_time, end_time, room, class_subjects(classes(name, grade, section), subjects(name), teachers(profiles(full_name)))",
    )
    .order("day_of_week")
    .order("start_time");

  if (error) throw new Error(error.message);
  return (data ?? []) as ScheduleRow[];
}

export async function createSchedule(rows: ScheduleCreateRow[]) {
  const supabase = createClient();
  const { error } = await supabase.from("schedules").insert(rows);
  if (error) throw new Error(error.message);
  return rows;
}

export async function updateSchedule({
  id,
  payload,
}: {
  id: string;
  payload: ScheduleUpdatePayload;
}) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("schedules")
    .update({
      class_subject_id: payload.class_subject_id,
      day_of_week: payload.day_of_week,
      start_time: payload.start_time,
      end_time: payload.end_time,
      room: payload.room ?? null,
    })
    .eq("id", id)
    .select(
      "id, class_subject_id, day_of_week, start_time, end_time, room, class_subjects(classes(name, grade, section), subjects(name), teachers(profiles(full_name)))",
    )
    .single();

  if (error) throw new Error(error.message);
  return data as ScheduleRow;
}

export async function deleteSchedule(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("schedules").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { id };
}
