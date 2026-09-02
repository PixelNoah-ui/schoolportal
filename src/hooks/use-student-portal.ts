import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchStudentFilterOptions,
  fetchStudentPayments,
  fetchStudentResults,
  submitStudentPayment,
} from "@/lib/api/student-portal";

export function useStudentResults(filters: {
  academicYearId?: string;
  semesterId?: string;
}) {
  return useQuery({
    queryKey: ["student-results", filters],
    queryFn: () => fetchStudentResults(filters),
  });
}

export function useStudentFilterOptions() {
  return useQuery({
    queryKey: ["student-filter-options"],
    queryFn: fetchStudentFilterOptions,
  });
}

export function useStudentPayments() {
  return useQuery({
    queryKey: ["student-payments"],
    queryFn: fetchStudentPayments,
  });
}

export function useSubmitStudentPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitStudentPayment,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["student-payments"] }),
  });
}
