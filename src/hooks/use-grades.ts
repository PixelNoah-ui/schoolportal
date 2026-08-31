import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchGrades,
  fetchGradeOptions,
  createGrade,
  updateGrade,
  deleteGrade,
  type GradeListParams,
} from "@/lib/api/grades";

export const gradesKey = ["grades"] as const;

export function useGrades(params: GradeListParams = {}) {
  return useQuery({
    queryKey: [...gradesKey, params],
    queryFn: () => fetchGrades(params),
  });
}

export function useGradeOptions() {
  return useQuery({
    queryKey: [...gradesKey, "options"],
    queryFn: () => fetchGradeOptions(),
  });
}

export function useCreateGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, string>) => createGrade(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gradesKey }),
  });
}

export function useUpdateGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, string>;
    }) => updateGrade(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gradesKey }),
  });
}

export function useDeleteGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGrade(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gradesKey }),
  });
}
