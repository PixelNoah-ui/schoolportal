import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSchedule,
  deleteSchedule,
  fetchScheduleCourses,
  fetchScheduleRooms,
  fetchSchedules,
  updateSchedule,
  type ScheduleCreateRow,
  type ScheduleUpdatePayload,
} from "@/lib/api/schedules";

export const scheduleCoursesKey = ["schedule-courses"] as const;
export const schedulesKey = ["schedules"] as const;
export const scheduleRoomsKey = ["schedule-rooms"] as const;

export function useScheduleCourses() {
  return useQuery({
    queryKey: scheduleCoursesKey,
    queryFn: fetchScheduleCourses,
  });
}

export function useScheduleRooms() {
  return useQuery({
    queryKey: scheduleRoomsKey,
    queryFn: fetchScheduleRooms,
  });
}

export function useSchedules() {
  return useQuery({
    queryKey: schedulesKey,
    queryFn: fetchSchedules,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rows: ScheduleCreateRow[]) => createSchedule(rows),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulesKey });
      queryClient.invalidateQueries({ queryKey: scheduleCoursesKey });
      queryClient.invalidateQueries({ queryKey: scheduleRoomsKey });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ScheduleUpdatePayload;
    }) => updateSchedule({ id, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulesKey });
      queryClient.invalidateQueries({ queryKey: scheduleCoursesKey });
      queryClient.invalidateQueries({ queryKey: scheduleRoomsKey });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulesKey });
      queryClient.invalidateQueries({ queryKey: scheduleCoursesKey });
      queryClient.invalidateQueries({ queryKey: scheduleRoomsKey });
    },
  });
}
