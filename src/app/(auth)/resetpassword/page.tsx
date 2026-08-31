"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { AlertCircle, Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandPanel, MobileBrandMark } from "@/components/BrandPortal";
import { useUpdatePassword } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const MIN_LENGTH = 8;
type ResetPasswordForm = { password: string; confirmPassword: string };

export default function ResetPasswordPage() {
  const updatePassword = useUpdatePassword({
    onSuccess: () => setIsDone(true),
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>();
  const password = useWatch({ control, name: "password", defaultValue: "" });

  const onSubmit: SubmitHandler<ResetPasswordForm> = ({
    password: nextPassword,
  }) => {
    void updatePassword.mutate({ password: nextPassword });
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      <BrandPanel blurb="Choose a new password to finish resetting access to your account." />
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-sm">
          <MobileBrandMark />
          {isDone ? (
            <div>
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-semibold">Password updated</h1>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Your password has been changed. You can now sign in with your
                new password.
              </p>
              <Link
                href="/login"
                className={cn(buttonVariants(), "mt-8 w-full")}
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-foreground">
                Set a new password
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Choose a new password for your account. Make it at least{" "}
                {MIN_LENGTH} characters.
              </p>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-8 space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Enter a new password"
                      className="pr-10"
                      {...register("password", {
                        required: "Password is required.",
                        minLength: {
                          value: MIN_LENGTH,
                          message: `Password must be at least ${MIN_LENGTH} characters.`,
                        },
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Re-enter the new password"
                      className="pr-10"
                      {...register("confirmPassword", {
                        required: "Please confirm your password.",
                        validate: (value) =>
                          value === password || "Passwords don't match.",
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((value) => !value)}
                      aria-label={
                        showConfirm ? "Hide password" : "Show password"
                      }
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                {updatePassword.error && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <p className="leading-5">{updatePassword.error.message}</p>
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={updatePassword.isLoading}
                  className="w-full"
                >
                  {updatePassword.isLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Update password"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
