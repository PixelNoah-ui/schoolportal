import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPaymentOption,
  deletePaymentOption,
  fetchPaymentOptions,
  updatePaymentOption,
} from "@/lib/api/payment-options";

export const paymentOptionsKey = ["payment-options"] as const;

export function useAdminPaymentOptions() {
  return useQuery({
    queryKey: paymentOptionsKey,
    queryFn: () => fetchPaymentOptions(true),
  });
}

export function useCreatePaymentOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, string>) =>
      createPaymentOption(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: paymentOptionsKey }),
  });
}

export function useUpdatePaymentOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, string>;
    }) => updatePaymentOption(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: paymentOptionsKey }),
  });
}

export function useDeletePaymentOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePaymentOption(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: paymentOptionsKey }),
  });
}
