"use client";

import { FormEvent, useEffect, useState } from "react";
import { LockKeyhole, Save, UserRound } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useUpdatePassword } from "@/hooks/use-auth";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export default function SettingsPage() {
  const updatePassword = useUpdatePassword();
  const [profileId, setProfileId] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setProfileError("Could not load your account.");
        setProfileLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, username, email")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        setProfileError("Could not load your account.");
      } else {
        setProfileId(data.id);
        setFullName(data.full_name);
        setUsername(data.username);
        setEmail(data.email || user.email || "");
      }
      setProfileLoading(false);
    }

    void loadProfile();
  }, [supabase]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setProfileError("");
    setMessage("");
    setProfileSaving(true);

    const { data: authData } = await supabase.auth.getUser();
    const currentEmail = authData.user?.email ?? "";
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
      })
      .eq("id", profileId);

    if (profileUpdateError) {
      setProfileError(profileUpdateError.message);
      setProfileSaving(false);
      return;
    }

    if (email.trim() !== currentEmail) {
      const { error: authUpdateError } = await supabase.auth.updateUser({
        email: email.trim(),
      });
      if (authUpdateError) {
        setProfileError(authUpdateError.message);
        setProfileSaving(false);
        return;
      }
      setMessage(
        "Account details saved. Check the new email for confirmation.",
      );
    } else {
      setMessage("Account details saved.");
    }
    setProfileSaving(false);
  }

  async function changePassword(event: FormEvent) {
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
  }

  return (
    <>
      <SiteHeader title="Settings" />
      <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-6">
        <Card className="h-fit w-full max-w-2xl rounded-none shadow-none">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center bg-primary/10 text-primary">
                <UserRound className="size-4" />
              </div>
              <div>
                <p className="font-semibold">Account details</p>
                <p className="text-sm text-muted-foreground">
                  Update your administrator account information.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full-name">Full name</Label>
                <Input
                  id="full-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  className="rounded-none"
                  disabled={profileLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  className="rounded-none"
                  disabled={profileLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="rounded-none"
                  disabled={profileLoading}
                />
              </div>
              {profileError && (
                <p className="text-sm text-destructive">{profileError}</p>
              )}
              <Button
                type="submit"
                disabled={profileLoading || profileSaving}
                className="rounded-none"
              >
                <Save className="size-4" />
                {profileSaving ? "Saving..." : "Save account details"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit w-full max-w-2xl rounded-none shadow-none">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center bg-primary/10 text-primary">
                <LockKeyhole className="size-4" />
              </div>
              <div>
                <p className="font-semibold">Change password</p>
                <p className="text-sm text-muted-foreground">
                  Confirm your current password before changing it.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={changePassword} className="space-y-4">
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
                <p className="text-sm text-muted-foreground">{message}</p>
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
