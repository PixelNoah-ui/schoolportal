"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
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

const DEFAULT_SECTION_OPTIONS = ["A", "B"];

interface SubjectOption {
  id: string;
  name: string;
}

interface ClassFormDialogProps {
  mode: "add" | "edit";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  subjectOptions?: SubjectOption[];
  onSubmit: (values: {
    grade: string;
    section: string;
    subjects: string[];
  }) => Promise<unknown> | unknown;
  isLoading?: boolean;
  trigger?: React.ReactElement;
  initialValues?: {
    grade?: string;
    section?: string;
    homeroom_teacher?: string;
    subjects?: string[];
  };
}

function parseSections(section?: string) {
  return (section ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ClassFormDialog({
  mode,
  open: controlledOpen,
  onOpenChange,
  subjectOptions = [],
  onSubmit,
  isLoading = false,
  trigger,
  initialValues,
}: ClassFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [grade, setGrade] = useState(initialValues?.grade ?? "");
  const [selectedSections, setSelectedSections] = useState<string[]>(() =>
    parseSections(initialValues?.section),
  );
  const [sectionMode, setSectionMode] = useState<"none" | "selected">(
    initialValues?.section ? "selected" : "none",
  );
  const [customSectionInput, setCustomSectionInput] = useState("");
  const [customSections, setCustomSections] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    initialValues?.subjects ?? [],
  );
  const sectionOptions = Array.from(
    new Set([...DEFAULT_SECTION_OPTIONS, ...customSections]),
  );

  // Seeds all form state from initialValues. Called right when the dialog
  // is told to open, instead of syncing via useEffect on `open`.
  function seedForm() {
    const parsedSections = parseSections(initialValues?.section);
    const seededCustomSections = parsedSections.filter(
      (section) => !DEFAULT_SECTION_OPTIONS.includes(section),
    );

    if (seededCustomSections.length) {
      setCustomSections((prev) =>
        Array.from(new Set([...prev, ...seededCustomSections])),
      );
    }

    setGrade(initialValues?.grade ?? "");
    setSelectedSections(parsedSections);
    setSectionMode(parsedSections.length ? "selected" : "none");
    setCustomSectionInput("");
    setSelectedSubjects(initialValues?.subjects ?? []);
  }

  function resetForm() {
    setGrade("");
    setSelectedSections([]);
    setSectionMode("none");
    setCustomSectionInput("");
    setSelectedSubjects([]);
  }

  // Intercepts every open/close request. Seeds fresh state on the way in,
  // clears it on the way out — no useEffect required.
  function handleOpenChange(next: boolean) {
    if (next) {
      seedForm();
    } else {
      resetForm();
    }
    setOpen(next);
  }

  function toggleSection(section: string) {
    setSelectedSections((prev) => {
      const next = prev.includes(section)
        ? prev.filter((item) => item !== section)
        : [...prev, section];

      setSectionMode(next.length ? "selected" : "none");
      return next;
    });
  }

  function toggleSubject(subjectId: string) {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId],
    );
  }

  function addCustomSection() {
    const nextSection = customSectionInput.trim();
    if (!nextSection) return;

    const normalized = nextSection.toUpperCase();
    setCustomSections((prev) =>
      prev.includes(normalized) ? prev : [...prev, normalized],
    );
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
      grade,
      section: sectionMode === "selected" ? selectedSections.join(", ") : "",
      subjects: selectedSubjects,
    };

    await Promise.resolve(onSubmit(payload));
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-none sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Class" : "Edit Class"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Choose a grade, section, and the subjects it will teach."
              : "Update class details."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-3">
          {/* Grade + Section side by side */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
              <Label htmlFor="grade">Grade *</Label>
              <select
                id="grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Select grade</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={String(g)}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
              <Label>Section</Label>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSections([]);
                    setSectionMode("none");
                  }}
                  className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    sectionMode === "none"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input text-muted-foreground hover:border-primary"
                  }`}
                >
                  None
                </button>
                {sectionOptions.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => toggleSection(sec)}
                    className={`flex size-8 items-center justify-center rounded-md border text-xs font-semibold transition-colors ${
                      selectedSections.includes(sec) &&
                      sectionMode === "selected"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input hover:border-primary"
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom section add */}
          <div className="flex gap-2 sm:pl-1">
            <Input
              value={customSectionInput}
              onChange={(e) => setCustomSectionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomSection();
                }
              }}
              placeholder="Add another section"
              className="h-8 rounded-md text-sm"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-md text-xs"
              onClick={addCustomSection}
            >
              Add
            </Button>
          </div>

          {/* Subjects — card-grid multi-select */}
          {mode === "add" && (
            <div className="space-y-2 rounded-lg border bg-muted/10 p-3">
              <div className="flex items-center justify-between">
                <Label>Subjects for this grade</Label>
                {selectedSubjects.length > 0 && (
                  <span className="text-xs font-medium text-primary">
                    {selectedSubjects.length} selected
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Tap all subjects this class will take — you can pick as many as
                you need.
              </p>

              {subjectOptions.length === 0 ? (
                <div className="border border-dashed bg-muted/20 px-3 py-4 text-center text-xs text-muted-foreground">
                  No subjects available yet. Add subjects first, then come back
                  here.
                </div>
              ) : (
                <div className="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto p-0.5 sm:grid-cols-3">
                  {subjectOptions.map((subject) => {
                    const active = selectedSubjects.includes(subject.id);
                    return (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => toggleSubject(subject.id)}
                        className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition-colors ${
                          active
                            ? "border-primary bg-primary/10 font-medium text-primary ring-1 ring-primary"
                            : "border-input hover:border-primary"
                        }`}
                      >
                        <span
                          className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40"
                          }`}
                        >
                          {active && <Check className="size-3" />}
                        </span>
                        <span className="truncate">{subject.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-none"
            onClick={() => handleOpenChange(false)}
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
