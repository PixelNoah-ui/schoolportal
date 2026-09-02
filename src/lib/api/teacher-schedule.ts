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
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string | null;
  class_subjects: {
    subjects: { id: string; name: string }[];
    classes: { id: string; name: string }[];
  }[];
};

function mapSchedule(schedule: ScheduleRecord): TeacherScheduleRow {
  return {
    id: schedule.id,
    subject: schedule.class_subjects[0]?.subjects[0]?.name ?? "Unknown",
    className: schedule.class_subjects[0]?.classes[0]?.name ?? "Unknown",
    dayOfWeek: schedule.day_of_week,
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

  // Fetch schedule for all classes taught by this teacher
  const { data, error } = await supabase
    .from("schedules")
    .select(
      "id, class_subject_id, day_of_week, start_time, end_time, room, class_subjects(subjects(id, name), classes(id, name))",
    )
    .eq("class_subjects.teacher_id", teacherData.id)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw new Error(error.message);

  const scheduleData = (data || []) as ScheduleRecord[];

  return {
    schedule: scheduleData
      .filter((s) => s.class_subjects && s.class_subjects.length > 0)
      .map(mapSchedule),
  };
}
