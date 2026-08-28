// hooks/use-teachers.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  type TeacherListParams,
} from "@/lib/api/teachers";

export const teachersKey = ["teachers"] as const;

export function useTeachers(params: TeacherListParams = {}) {
  return useQuery({
    queryKey: [...teachersKey, params],
    queryFn: () => fetchTeachers(params),
  });
}

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, string>) => createTeacher(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: teachersKey }),
  });
}

export function useUpdateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, string>;
    }) => updateTeacher(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: teachersKey }),
  });
}

export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTeacher(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: teachersKey }),
  });
}
