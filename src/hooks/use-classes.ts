import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchClasses,
  fetchClassOptions,
  createClass,
  updateClass,
  deleteClass,
  type ClassListParams,
} from "@/lib/api/classes";

export const classesKey = ["classes"] as const;

export function useClasses(params: ClassListParams = {}) {
  return useQuery({
    queryKey: [...classesKey, params],
    queryFn: () => fetchClasses(params),
  });
}

export function useClassOptions(params: { academicYearId?: string } = {}) {
  return useQuery({
    queryKey: [...classesKey, "options", params],
    queryFn: () => fetchClassOptions(params),
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, string>) => createClass(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classesKey }),
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, string>;
    }) => updateClass(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: classesKey });
      queryClient.invalidateQueries({ queryKey: ["class-subjects"] });
      queryClient.invalidateQueries({ queryKey: ["class-subjects", id] });
      queryClient.invalidateQueries({ queryKey: ["available-teachers"] });
      queryClient.refetchQueries({ queryKey: classesKey });
      queryClient.refetchQueries({ queryKey: ["available-teachers"] });
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteClass(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classesKey }),
  });
}
