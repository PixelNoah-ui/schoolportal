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

  const { data: profileRoleValue, error: profileError } =
    await supabase.rpc("current_user_role");

  if (profileError) {
    throw new Error(
      `Could not load your account profile: ${profileError.message}`,
    );
  }

  const profileRole = toUserRole(profileRoleValue);
  if (!profileRole) {
    throw new Error(
      "Your account has no valid role. Ask an administrator to set your profiles.role to admin, teacher, or student.",
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
