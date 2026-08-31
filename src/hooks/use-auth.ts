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

function getFriendlyAuthMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials") ||
    normalized.includes("email or password") ||
    normalized.includes("user not found")
  ) {
    return "We couldn’t sign you in. Please check your email and password and try again.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }

  if (
    normalized.includes("too many requests") ||
    normalized.includes("rate limit")
  ) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (normalized.includes("reset") || normalized.includes("email")) {
    return "We couldn’t send the reset link right now. Please try again in a moment.";
  }

  if (normalized.includes("password") || normalized.includes("new password")) {
    return "We couldn’t update your password. Please try again.";
  }

  return "Something went wrong. Please try again.";
}

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
          ? new Error(getFriendlyAuthMessage(requestError.message))
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
