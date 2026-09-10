"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { AlertCircle, Check, Copy, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandPanel, MobileBrandMark } from "@/components/BrandPortal";
import { useLogin } from "@/hooks/use-auth";

type LoginForm = { email: string; password: string };

const demoAccounts = [
  { role: "Student", email: "pixel@gmail.com", password: "1829f753f8A1!" },
  {
    role: "Teacher",
    email: "pixelnah8@gmail.com",
    password: "edf0311e2aA1!",
  },
  { role: "Admin", email: "pixelnoah8@gmail.com", password: "12345678" },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin({
    onSuccess: ({ role }) => {
      router.replace(`/${role}`);
      router.refresh();
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit: SubmitHandler<LoginForm> = (values) => {
    void login.mutate(values);
  };

  const copyValue = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
    window.setTimeout(() => setCopiedValue(null), 1500);
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      <BrandPanel />
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-sm">
          <MobileBrandMark />
          <h1 className="text-2xl font-semibold text-foreground">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your credentials to access the portal.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgotpassword"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="pr-10"
                  {...register("password", {
                    required: "Password is required.",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
            {login.error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p className="leading-5">{login.error.message}</p>
              </div>
            )}
            <Button type="submit" disabled={login.isLoading} className="w-full">
              {login.isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
          <section className="mt-8 border-t pt-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold">Demo accounts</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Ready-to-use accounts for testing.
              </p>
            </div>
            <div className="divide-y border-y">
              {demoAccounts.map((account) => (
                <div
                  key={account.role}
                  className="grid gap-3 py-3 sm:grid-cols-[5rem_1fr] sm:items-center"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {account.role}
                  </p>
                  <div className="grid gap-2 text-xs sm:grid-cols-2">
                    {[
                      ["Email", account.email],
                      ["Password", account.password],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex min-w-0 items-center gap-2"
                      >
                        <span className="w-14 shrink-0 text-muted-foreground">
                          {label}
                        </span>
                        <code className="min-w-0 flex-1 truncate text-foreground">
                          {value}
                        </code>
                        <button
                          type="button"
                          aria-label={`Copy ${account.role} ${label.toLowerCase()}`}
                          title={`Copy ${label.toLowerCase()}`}
                          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                          onClick={() => void copyValue(value)}
                        >
                          {copiedValue === value ? (
                            <Check className="size-4 text-emerald-600" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
          <p className="mt-8 text-xs text-muted-foreground">
            Trouble signing in? Contact{" "}
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
