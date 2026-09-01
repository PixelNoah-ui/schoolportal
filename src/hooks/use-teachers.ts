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

type TeacherMutationPayload = {
  full_name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  assignments?: Array<{ subjectId: string; classId: string }>;
  [key: string]: unknown;
};

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TeacherMutationPayload) => createTeacher(payload),
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
      payload: TeacherMutationPayload;
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
