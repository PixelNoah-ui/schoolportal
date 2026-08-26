"use client";

import { useState } from "react";
import {
  sendPasswordResetEmail,
  signIn,
  updatePassword,
  type LoginInput,
  type ResetEmailInput,
  type UpdatePasswordInput,
} from "@/lib/api/auth";

type RequestOptions<TData> = {
  onSuccess?: (data: TData) => void;
};

function useRequest<TInput, TData>(
  request: (input: TInput) => Promise<TData>,
  options?: RequestOptions<TData>,
) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<Error | null>(null);

  async function mutate(input: TInput) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await request(input);
      setData(result);
      options?.onSuccess?.(result);
      return result;
    } catch (requestError) {
      const normalizedError =
        requestError instanceof Error
          ? requestError
          : new Error("Something went wrong. Please try again.");
      setError(normalizedError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { mutate, data, error, isLoading };
}

export function useLogin(
  options?: RequestOptions<Awaited<ReturnType<typeof signIn>>>,
) {
  return useRequest<LoginInput, Awaited<ReturnType<typeof signIn>>>(
    signIn,
    options,
  );
}

export function useForgotPassword(
  options?: RequestOptions<Awaited<ReturnType<typeof sendPasswordResetEmail>>>,
) {
  return useRequest<
    ResetEmailInput,
    Awaited<ReturnType<typeof sendPasswordResetEmail>>
  >(sendPasswordResetEmail, options);
}

export function useUpdatePassword(
  options?: RequestOptions<Awaited<ReturnType<typeof updatePassword>>>,
) {
  return useRequest<
    UpdatePasswordInput,
    Awaited<ReturnType<typeof updatePassword>>
  >(updatePassword, options);
}
