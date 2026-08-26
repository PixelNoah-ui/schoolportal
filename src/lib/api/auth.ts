import { createClient } from "@/utils/supabase/client";

export type LoginInput = {
  email: string;
  password: string;
};

export type ResetEmailInput = {
  email: string;
  redirectTo: string;
};

export type UpdatePasswordInput = {
  password: string;
};

export async function signIn(input: LoginInput) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword(input);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function sendPasswordResetEmail(input: ResetEmailInput) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(
    input.email,
    { redirectTo: input.redirectTo },
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updatePassword(input: UpdatePasswordInput) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.updateUser({
    password: input.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
