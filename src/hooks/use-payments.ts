import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchPaymentStudents,
  fetchPayments,
  type PaymentListParams,
  updatePaymentStatus,
} from "@/lib/api/payments";

export const paymentsKey = ["payments"] as const;

export function usePayments(params: PaymentListParams = {}) {
  return useQuery({
    queryKey: [...paymentsKey, params],
    queryFn: () => fetchPayments(params),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function usePaymentStudents() {
  return useQuery({
    queryKey: [...paymentsKey, "students"],
    queryFn: fetchPaymentStudents,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      rejectionReason,
    }: {
      id: string;
      status: "approved" | "rejected";
      rejectionReason?: string;
    }) => updatePaymentStatus(id, status, rejectionReason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: paymentsKey }),
  });
}
