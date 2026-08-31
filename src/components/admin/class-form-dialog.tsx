// components/admin/class-form-dialog.tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTeachers } from "@/hooks/use-teachers";

const DEFAULT_SECTION_OPTIONS = ["A", "B"];

interface ClassFormDialogProps {
  mode: "add" | "edit";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (values: {
    grade: number;
    section: string;
    homeroom_teacher?: string;
  }) => Promise<unknown> | unknown;
  isLoading?: boolean;
  trigger?: React.ReactElement;
  initialValues?: {
    grade?: string;
    section?: string;
    homeroom_teacher?: string;
  };
}

export function ClassFormDialog({
  mode,
  open: controlledOpen,
  onOpenChange,
  onSubmit,
  isLoading = false,
  trigger,
  initialValues,
}: ClassFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [grade, setGrade] = useState(initialValues?.grade ?? "");
  const [selectedSections, setSelectedSections] = useState<string[]>(() => {
    const initialSection = initialValues?.section ?? "";
    return initialSection
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  });
  const [sectionMode, setSectionMode] = useState<"none" | "selected">(
    initialValues?.section ? "selected" : "none",
  );
  const [customSectionInput, setCustomSectionInput] = useState("");
  const [customSections, setCustomSections] = useState<string[]>([]);
  const [homeroomTeacher, setHomeroomTeacher] = useState(
    initialValues?.homeroom_teacher ?? "",
  );
  const { data: teachersData } = useTeachers({ pageSize: 200 });

  const teacherOptions = (teachersData?.teachers ?? []).map((teacher) => ({
    id: teacher.id,
    name: teacher.profile.full_name,
  }));

  const sectionOptions = Array.from(
    new Set([...DEFAULT_SECTION_OPTIONS, ...customSections]),
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const parsedSections = (initialValues?.section ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const seededCustomSections = parsedSections.filter(
      (section) => !DEFAULT_SECTION_OPTIONS.includes(section),
    );

    if (seededCustomSections.length) {
      setCustomSections((prev) => {
        const merged = [...prev, ...seededCustomSections];
        return Array.from(new Set(merged));
      });
    }

    setGrade(initialValues?.grade ?? "");
    setSelectedSections(parsedSections);
    setSectionMode(parsedSections.length ? "selected" : "none");
    setCustomSectionInput("");
    setHomeroomTeacher(initialValues?.homeroom_teacher ?? "");
  }, [open, initialValues]);

  function toggleSection(section: string) {
    setSelectedSections((prev) => {
      const next = prev.includes(section)
        ? prev.filter((item) => item !== section)
        : [...prev, section];

      setSectionMode(next.length ? "selected" : "none");
      return next;
    });
  }

  function addCustomSection() {
    const nextSection = customSectionInput.trim();
    if (!nextSection) return;

    const normalized = nextSection.toUpperCase();
    setCustomSections((prev) => {
      if (prev.includes(normalized)) {
        return prev;
      }
      return [...prev, normalized];
    });
    setSelectedSections((prev) => {
      const next = prev.includes(normalized) ? prev : [...prev, normalized];
      setSectionMode(next.length ? "selected" : "none");
      return next;
    });
    setCustomSectionInput("");
  }

  async function handleSubmit() {
    if (isLoading) return;
    if (!grade) {
      alert("Grade is required");
      return;
    }

    if (sectionMode === "selected" && selectedSections.length === 0) {
      alert("Please choose at least one section or select no section.");
      return;
    }

    const payload = {
      grade: Number(grade),
      section: sectionMode === "selected" ? selectedSections.join(", ") : "",
      homeroom_teacher: homeroomTeacher || "",
    };

    await Promise.resolve(onSubmit(payload));
    resetForm();
    setOpen(false);
  }

  function resetForm() {
    setGrade("");
    setSelectedSections([]);
    setSectionMode("none");
    setCustomSectionInput("");
    setHomeroomTeacher("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="rounded-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Class" : "Edit Class"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Choose a grade, optional section, and optional homeroom teacher."
              : "Update class details."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="grade">Grade *</Label>
            <select
              id="grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="flex h-10 w-full rounded-none border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">Select grade</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={String(g)}>
                  Grade {g}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <Label>Section</Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedSections([]);
                  setSectionMode("none");
                }}
                className={`rounded-none border px-3 py-2 text-sm font-medium transition-colors ${
                  sectionMode === "none"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input hover:border-primary"
                }`}
              >
                No section
              </button>
              {sectionOptions.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => toggleSection(sec)}
                  className={`h-10 w-10 rounded-none border-2 font-medium transition-colors ${
                    selectedSections.includes(sec) && sectionMode === "selected"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input hover:border-primary"
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={customSectionInput}
                onChange={(e) => setCustomSectionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomSection();
                  }
                }}
                placeholder="Add more section"
                className="rounded-none"
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-none"
                onClick={addCustomSection}
              >
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="homeroomTeacher">
              Homeroom Teacher{" "}
              <span className="text-xs text-muted-foreground">(Optional)</span>
            </Label>
            <select
              id="homeroomTeacher"
              value={homeroomTeacher}
              onChange={(e) => setHomeroomTeacher(e.target.value)}
              className="flex h-10 w-full rounded-none border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">Select teacher (optional)</option>
              {teacherOptions.map((teacher) => (
                <option key={teacher.id} value={teacher.name}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-none"
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className="rounded-none"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {mode === "add" ? "Creating..." : "Saving..."}
              </>
            ) : mode === "add" ? (
              "Create Class"
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
