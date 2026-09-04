import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  activateAcademicYear,
  completeAcademicYear,
  deleteAcademicYear,
} from "@/lib/api/academic-years";

export const academicYearsKey = ["academic-years"] as const;

export function useAcademicYears() {
  return useQuery({
    queryKey: academicYearsKey,
    queryFn: fetchAcademicYears,
  });
}

export function useCreateAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, string>) =>
      createAcademicYear(payload),
    retry: false,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: academicYearsKey }),
  });
}

export function useUpdateAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, string>;
    }) => updateAcademicYear(id, payload),
    retry: false,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: academicYearsKey }),
  });
}

export function useActivateAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateAcademicYear(id),
    retry: false,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: academicYearsKey }),
  });
}

export function useCompleteAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => completeAcademicYear(id),
    retry: false,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: academicYearsKey }),
  });
}

export function useDeleteAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAcademicYear(id),
    retry: false,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: academicYearsKey }),
  });
}
