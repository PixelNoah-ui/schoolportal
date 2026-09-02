// app/teacher/settings/page.tsx
"use client";

import { AlertTriangle, RefreshCw, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/teacher/site-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCurrentTeacher,
  useUpdateTeacherProfile,
} from "@/hooks/use-teacher";

export default function SettingsPage() {
  const { data, isLoading, isError, error, refetch } = useCurrentTeacher();
  const updateProfile = useUpdateTeacherProfile();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    bio: "",
    department: "",
    qualifications: "",
  });
  const [showNotification, setShowNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (data) {
      setFormData({
        fullName: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        bio: data.bio || "",
        department: data.department || "",
        qualifications: data.qualifications || "",
      });
    }
  }, [data]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
        department: formData.department,
        qualifications: formData.qualifications,
      });
      setShowNotification({
        type: "success",
        message: "Profile updated successfully!",
      });
      setTimeout(() => setShowNotification(null), 3000);
    } catch (err) {
      setShowNotification({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to update profile",
      });
    }
  };

  if (isLoading) {
    return (
      <>
        <SiteHeader title="Settings" />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32 rounded-none" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20 rounded-none" />
                  <Skeleton className="h-10 w-full rounded-none" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <SiteHeader title="Settings" />
        <div className="flex flex-1 items-center justify-center p-6">
          <Card className="w-full max-w-lg rounded-none border-border shadow-none">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="flex size-12 items-center justify-center bg-destructive/10 text-destructive">
                <AlertTriangle className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground">
                  Could not load settings
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {error instanceof Error
                    ? error.message
                    : "Something went wrong. Please try again."}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => refetch()}
                className="rounded-none"
              >
                <RefreshCw className="size-4" />
                Try again
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!data) return null;

  return (
    <>
      <SiteHeader title="Settings" />

      {showNotification && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg text-white z-50 animate-in fade-in slide-in-from-top-2 duration-300 ${
            showNotification.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {showNotification.message}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-6 p-6 max-w-2xl">
        <div>
          <h2 className="text-lg font-semibold">Profile Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your teacher profile information
          </p>
        </div>

        <Card className="rounded-none shadow-none">
          <CardHeader className="border-b">
            <h3 className="text-sm font-semibold">Basic Information</h3>
            <CardDescription className="text-xs">
              Your personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Full Name
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="rounded-none"
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Contact your administrator to change your name
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="rounded-none"
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Contact your administrator to change your email
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+251 912 345 678"
                className="rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department" className="text-sm font-medium">
                Department
              </Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                placeholder="e.g., Science, Mathematics"
                className="rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualifications" className="text-sm font-medium">
                Qualifications
              </Label>
              <Input
                id="qualifications"
                value={formData.qualifications}
                onChange={(e) =>
                  setFormData({ ...formData, qualifications: e.target.value })
                }
                placeholder="e.g., B.Sc. in Physics, M.Ed."
                className="rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium">
                Bio
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder="Tell students a bit about yourself..."
                className="rounded-none min-h-24"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={updateProfile.isPending}
              className="rounded-none w-full sm:w-auto"
            >
              {updateProfile.isPending ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="size-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
