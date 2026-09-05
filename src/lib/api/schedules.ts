import { createClient } from "@/utils/supabase/client";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

function dayToNumber(day: string | number) {
  if (typeof day === "number") return day;
  const value = Number(day);
  if (Number.isInteger(value)) return value;
  const index = DAY_NAMES.indexOf(day as (typeof DAY_NAMES)[number]);
  if (index < 0) throw new Error(`Invalid schedule day: ${day}`);
  return index;
}

function dayToName(day: string | number) {
  const value = dayToNumber(day);
  return DAY_NAMES[value] ?? String(value);
}

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

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return value == null
    ? null
    : Array.isArray(value)
      ? (value[0] ?? null)
      : value;
}

export type ScheduleCreateRow = {
  class_subject_id: string;
  day_of_week: string | number;
  start_time: string;
  end_time: string;
  room?: string | null;
};

export type ScheduleUpdatePayload = {
  class_subject_id: string;
  day_of_week: string | number;
  start_time: string;
  end_time: string;
  room?: string | null;
};

function gradeLabelFor(grade: number, section: string | null) {
  return section ? `Grade ${grade} - ${section}` : `Grade ${grade}`;
}

function mapCourseRow(row: any): ScheduleCourseOption {
  const classRow = firstRelation(row.classes);
  const gradeLevel = firstRelation(classRow?.grade_levels);
  const subjectName = firstRelation(row.subjects)?.name ?? "Subject";
  const teacher = firstRelation(row.teachers);
  const teacherName =
    firstRelation(teacher?.profiles)?.full_name ?? "Unassigned";

  return {
    id: row.id,
    grade: gradeLevel?.level_number ?? 0,
    section: classRow?.section ?? null,
    gradeLabel:
      classRow && gradeLevel
        ? gradeLabelFor(gradeLevel.level_number, classRow.section)
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
      "id, classes(name, section, grade_levels!classes_grade_level_id_fkey(level_number)), subjects(name), teachers(profiles(full_name))",
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
      "id, class_subject_id, day_of_week, start_time, end_time, room, class_subjects(classes(name, section, grade_levels!classes_grade_level_id_fkey(level_number)), subjects(name), teachers(profiles(full_name)))",
    )
    .order("day_of_week")
    .order("start_time");

  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => {
    const classSubject = firstRelation(row.class_subjects);
    const classRow = firstRelation(classSubject?.classes);
    const gradeLevel = firstRelation(classRow?.grade_levels);
    const subject = firstRelation(classSubject?.subjects);
    const teacher = firstRelation(classSubject?.teachers);

    return {
      ...row,
      day_of_week: dayToName(row.day_of_week),
      class_subjects: classSubject
        ? [
            {
              ...classSubject,
              classes: classRow
                ? [{ ...classRow, grade: gradeLevel?.level_number ?? 0 }]
                : [],
              subjects: subject ? [subject] : [],
              teachers: teacher ? [teacher] : [],
            },
          ]
        : [],
    } as ScheduleRow;
  });
}

export async function createSchedule(rows: ScheduleCreateRow[]) {
  const supabase = createClient();
  const { error } = await supabase
    .from("schedules")
    .insert(
      rows.map((row) => ({
        ...row,
        day_of_week: dayToNumber(row.day_of_week),
      })),
    );
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
      day_of_week: dayToNumber(payload.day_of_week),
      start_time: payload.start_time,
      end_time: payload.end_time,
      room: payload.room ?? null,
    })
    .eq("id", id)
    .select(
      "id, class_subject_id, day_of_week, start_time, end_time, room, class_subjects(classes(name, section, grade_levels!classes_grade_level_id_fkey(level_number)), subjects(name), teachers(profiles(full_name)))",
    )
    .single();

  if (error) throw new Error(error.message);
  return { ...data, day_of_week: dayToName(data.day_of_week) } as ScheduleRow;
}

export async function deleteSchedule(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("schedules").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { id };
}
