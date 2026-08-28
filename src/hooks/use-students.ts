// hooks/use-students.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  type StudentListParams,
} from "@/lib/api/students";

export const studentsKey = ["students"] as const;

export function useStudents(params: StudentListParams = {}) {
  return useQuery({
    queryKey: [...studentsKey, params],
    queryFn: () => fetchStudents(params),
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, string>) => createStudent(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: studentsKey }),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, string>;
    }) => updateStudent(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: studentsKey }),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: studentsKey }),
  });
}
