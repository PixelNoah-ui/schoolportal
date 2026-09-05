import { createClient } from "@/utils/supabase/client";

export interface TeacherScheduleRow {
  id: string;
  subject: string;
  className: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
}

export interface TeacherScheduleResult {
  schedule: TeacherScheduleRow[];
}

type ScheduleRecord = {
  id: string;
  class_subject_id: string;
  day_of_week: string | number;
  start_time: string;
  end_time: string;
  room: string | null;
  class_subjects:
    | {
        subjects: { id: string; name: string }[];
        classes: {
          id: string;
          name: string;
          section: string | null;
          grade_levels: { level_number: number }[];
        }[];
      }[]
    | {
        subjects: { id: string; name: string }[];
        classes: {
          id: string;
          name: string;
          section: string | null;
          grade_levels: { level_number: number }[];
        }[];
      }
    | null;
};

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function dayName(value: string | number) {
  const numericValue = Number(value);
  return Number.isInteger(numericValue)
    ? (DAY_NAMES[numericValue] ?? String(value))
    : String(value);
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : (value ?? null);
}

function mapSchedule(schedule: ScheduleRecord): TeacherScheduleRow {
  const classSubject = firstRelation(schedule.class_subjects);
  const subject = firstRelation(classSubject?.subjects);
  return {
    id: schedule.id,
    subject: subject?.name ?? "Unknown subject",
    className: (() => {
      const classRow = firstRelation(classSubject?.classes);
      const grade = classRow?.grade_levels?.[0]?.level_number;
      return classRow
        ? `Grade ${grade ?? "-"}${classRow.section ? ` - ${classRow.section}` : ""}`
        : "Unknown class";
    })(),
    dayOfWeek: dayName(schedule.day_of_week),
    startTime: schedule.start_time,
    endTime: schedule.end_time,
    room: schedule.room ?? undefined,
  };
}

/**
 * Fetch teacher's teaching schedule
 */
export async function fetchTeacherSchedule(): Promise<TeacherScheduleResult> {
  const supabase = createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // Fetch teacher ID
  const { data: teacherData, error: teacherError } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (teacherError || !teacherData) throw new Error("Teacher not found");

  // Resolve the teacher's class subjects first, then fetch schedules by IDs.
  // This avoids relying on a nested relation filter, which can return no rows
  // even when the schedules and assignments exist.
  const { data: assignments, error: assignmentsError } = await supabase
    .from("class_subjects")
    .select("id")
    .eq("teacher_id", teacherData.id);

  if (assignmentsError) throw new Error(assignmentsError.message);

  const classSubjectIds = (assignments ?? []).map(
    (assignment) => assignment.id,
  );
  if (classSubjectIds.length === 0) return { schedule: [] };

  const { data, error } = await supabase
    .from("schedules")
    .select(
      "id, class_subject_id, day_of_week, start_time, end_time, room, class_subjects(subjects(id, name), classes(id, name, section, grade_levels!classes_grade_level_id_fkey(level_number)))",
    )
    .in("class_subject_id", classSubjectIds)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw new Error(error.message);

  const scheduleData = (data || []) as ScheduleRecord[];

  return {
    schedule: scheduleData.map(mapSchedule),
  };
}
