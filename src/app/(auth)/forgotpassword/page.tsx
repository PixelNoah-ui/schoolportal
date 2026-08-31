"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, type SubmitHandler } from "react-hook-form";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandPanel, MobileBrandMark } from "@/components/BrandPortal";
import { useForgotPassword } from "@/hooks/use-auth";

type ForgotPasswordForm = { email: string };

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword({
    onSuccess: () => setIsSent(true),
  });
  const [isSent, setIsSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>();

  const onSubmit: SubmitHandler<ForgotPasswordForm> = ({ email }) => {
    setSubmittedEmail(email);
    void forgotPassword.mutate({
      email,
      redirectTo: `${window.location.origin}/resetpassword`,
    });
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      <BrandPanel blurb="Forgot your password? We'll send a reset link to the email on file for your account." />
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-sm">
          <MobileBrandMark />
          <Link
            href="/login"
            className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
          {isSent ? (
            <div>
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-semibold">Check your email</h1>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                If an account exists for{" "}
                <span className="text-foreground">{submittedEmail}</span>, a
                password reset link is on its way.
              </p>
              <Button
                variant="outline"
                className="mt-8 w-full"
                onClick={() => setIsSent(false)}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-foreground">
                Forgot password?
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the email linked to your account and we&apos;ll send you a
                reset link.
              </p>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-8 space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@school.edu"
                    {...register("email", { required: "Email is required." })}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                {forgotPassword.error && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <p className="leading-5">{forgotPassword.error.message}</p>
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={forgotPassword.isLoading}
                  className="w-full"
                >
                  {forgotPassword.isLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>
            </>
          )}
          <p className="mt-8 text-xs text-muted-foreground">
            Need more help? Contact{" "}
            <a
              href="mailto:pixelnoah8@gmail.com"
              className="text-foreground underline underline-offset-2"
            >
              pixelnoah8@gmail.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
