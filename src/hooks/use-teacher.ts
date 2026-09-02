import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCurrentTeacher,
  updateCurrentTeacherProfile,
  type TeacherProfile,
} from "@/lib/api/teacher";

export const currentTeacherKey = ["current-teacher"] as const;

export function useCurrentTeacher() {
  return useQuery({
    queryKey: currentTeacherKey,
    queryFn: fetchCurrentTeacher,
    staleTime: 60_000,
  });
}

export function useUpdateTeacherProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<TeacherProfile>) =>
      updateCurrentTeacherProfile(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: currentTeacherKey }),
  });
}
