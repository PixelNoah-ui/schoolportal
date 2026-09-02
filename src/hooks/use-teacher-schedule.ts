import { useQuery } from "@tanstack/react-query";
import { fetchTeacherSchedule } from "@/lib/api/teacher-schedule";

export const teacherScheduleKey = ["teacher-schedule"] as const;

export function useTeacherSchedule() {
  return useQuery({
    queryKey: teacherScheduleKey,
    queryFn: fetchTeacherSchedule,
  });
}
