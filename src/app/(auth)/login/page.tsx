"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandPanel, MobileBrandMark } from "@/components/BrandPortal";
import { useLogin } from "@/hooks/use-auth";

type LoginForm = { email: string; password: string };

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin({
    onSuccess: ({ role }) => {
      router.replace(`/${role}`);
      router.refresh();
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit: SubmitHandler<LoginForm> = (values) => {
    void login.mutate(values);
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
              <p className="text-xs text-destructive">{login.error.message}</p>
            )}
            <Button type="submit" disabled={login.isLoading} className="w-full">
              {login.isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
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
