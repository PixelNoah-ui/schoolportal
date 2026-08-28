import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  type SubjectListParams,
} from "@/lib/api/subjects";

export const subjectsKey = ["subjects"] as const;

export function useSubjects(params: SubjectListParams = {}) {
  return useQuery({
    queryKey: [...subjectsKey, params],
    queryFn: () => fetchSubjects(params),
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, string>) => createSubject(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subjectsKey }),
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, string>;
    }) => updateSubject(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subjectsKey }),
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSubject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subjectsKey }),
  });
}
