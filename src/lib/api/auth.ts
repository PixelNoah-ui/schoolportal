import { createClient } from "@/utils/supabase/client";
import { toUserRole } from "../roles";

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
  currentPassword?: string;
};

export async function signIn(input: LoginInput) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword(input);

  if (error) {
    throw new Error(error.message);
  }

  const metadataRole = toUserRole(data.user.user_metadata?.role);
  if (metadataRole) {
    return { ...data, role: metadataRole };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  const profileRole = toUserRole(profile?.role);

  if (profileError || !profileRole) {
    throw new Error(
      "Your account has no valid role. Add admin, teacher, or student to your profiles.role or user metadata.",
    );
  }

  return { ...data, role: profileRole };
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
  if (input.currentPassword) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user?.email) throw new Error("Your session has expired.");

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: input.currentPassword,
    });
    if (verifyError) throw new Error("The current password is incorrect.");
  }

  const { data, error } = await supabase.auth.updateUser({
    password: input.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
