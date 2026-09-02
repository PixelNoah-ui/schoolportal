"use client";

import { FormEvent, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { StudentSiteHeader } from "@/components/student/site-header";
import { useUpdatePassword } from "@/hooks/use-auth";

export default function StudentSettingsPage() {
  const updatePassword = useUpdatePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    if (!currentPassword) {
      setMessage("Enter your current password.");
      return;
    }
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }
    const result = await updatePassword.mutate({ currentPassword, password });
    if (result) {
      setCurrentPassword("");
      setPassword("");
      setConfirm("");
      setMessage("Password updated successfully.");
    }
  };
  return (
    <>
      <StudentSiteHeader
        title="Settings"
        subtitle="Manage your account access"
      />
      <main className="flex flex-1 bg-muted/20 p-6">
        <Card className="h-fit w-full max-w-xl rounded-none shadow-none">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center bg-primary/10 text-primary">
                <LockKeyhole className="size-4" />
              </div>
              <div>
                <p className="font-semibold">Change password</p>
                <p className="text-sm text-muted-foreground">
                  Your username and account identity cannot be changed here.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  required
                  className="rounded-none"
                />
              </div>
              {message && (
                <p
                  className={`text-sm ${message.includes("successfully") ? "text-emerald-700" : "text-destructive"}`}
                >
                  {message}
                </p>
              )}
              {updatePassword.error && (
                <p className="text-sm text-destructive">
                  {updatePassword.error.message}
                </p>
              )}
              <Button
                type="submit"
                disabled={updatePassword.isLoading}
                className="rounded-none"
              >
                {updatePassword.isLoading ? "Updating..." : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
