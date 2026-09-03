// components/admin/teacher-form-dialog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { BookX, Loader2, X } from "lucide-react";
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
import { createClient } from "@/utils/supabase/client";

interface TeacherFormDialogProps {
  mode: "add" | "edit";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (values: TeacherFormValues) => Promise<unknown> | unknown;
  isLoading?: boolean;
  trigger?: React.ReactElement;
}

interface Subject {
  id: string;
  name: string;
}

interface ClassOption {
  id: string;
  name: string;
  grade: number;
  section: string | null;
}

interface TeacherAssignment {
  subjectId: string;
  classId: string;
  subjectName?: string;
}

type TeacherFormValues = Record<string, unknown> & {
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  assignments: TeacherAssignment[];
};

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export function TeacherFormDialog({
  mode,
  open: controlledOpen,
  onOpenChange,
  onSubmit,
  isLoading = false,
  trigger,
}: TeacherFormDialogProps) {
  void mode;

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);

  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);

  const [classSubjects, setClassSubjects] = useState<Record<string, Subject[]>>(
    {},
  );
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingClassSubjects, setLoadingClassSubjects] = useState(false);

  useEffect(() => {
    if (open && subjects.length === 0 && classes.length === 0) {
      loadSubjectsAndClasses();
    }
  }, [open, subjects.length, classes.length]);

  async function loadSubjectsAndClasses() {
    setLoadingOptions(true);
    try {
      const supabase = createClient();
      const [subjectsRes, classesRes] = await Promise.all([
        supabase.from("subjects").select("id, name").order("name"),
        supabase
          .from("classes")
          .select("id, name, grade, section")
          .order("grade", { ascending: true }),
      ]);

      if (subjectsRes.data) setSubjects(subjectsRes.data as Subject[]);
      if (classesRes.data) setClasses(classesRes.data as ClassOption[]);
    } catch (error) {
      console.error("Error loading options:", error);
    } finally {
      setLoadingOptions(false);
    }
  }

  const grades = useMemo(
    () =>
      Array.from(new Set(classes.map((c) => c.grade))).sort((a, b) => a - b),
    [classes],
  );

  const classesByGrade = useMemo(() => {
    const map: Record<number, ClassOption[]> = {};
    for (const classItem of classes) {
      map[classItem.grade] = [...(map[classItem.grade] ?? []), classItem];
    }
    return map;
  }, [classes]);

  const sectionsForSelectedGrade =
    selectedGrade !== null ? (classesByGrade[selectedGrade] ?? []) : [];

  const selectedClassInfo = classes.find((c) => c.id === selectedClass);

  async function fetchClassSubjects(classId: string) {
    if (classSubjects[classId]) return;
    setLoadingClassSubjects(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("class_subjects")
        .select("subject_id, subjects(id, name)")
        .eq("class_id", classId);
      setClassSubjects((previous) => ({
        ...previous,
        [classId]: (data ?? []).map((row) => row.subjects).flat() as Subject[],
      }));
    } finally {
      setLoadingClassSubjects(false);
    }
  }

  function handleSelectGrade(grade: number) {
    setSelectedGrade(grade);
    setSelectedSubject("");
    const sectionsInGrade = classesByGrade[grade] ?? [];
    if (sectionsInGrade.length === 1) {
      const onlyClass = sectionsInGrade[0].id;
      setSelectedClass(onlyClass);
      fetchClassSubjects(onlyClass);
    } else {
      setSelectedClass("");
    }
  }

  function handleSelectClass(classId: string) {
    setSelectedClass(classId);
    setSelectedSubject("");
    fetchClassSubjects(classId);
  }

  function addAssignments() {
    if (!selectedClass || !selectedSubject) return;
    if (
      assignments.some(
        (assignment) =>
          assignment.classId === selectedClass &&
          assignment.subjectId === selectedSubject,
      )
    )
      return;
    setAssignments((prev) => [
      ...prev,
      {
        subjectId: selectedSubject,
        classId: selectedClass,
        subjectName: getSubjectName(selectedSubject),
      },
    ]);
    // Reset so the user can pick a fresh grade + subject
    setSelectedGrade(null);
    setSelectedClass("");
    setSelectedSubject("");
  }

  function removeAssignment(index: number) {
    setAssignments((prev) => prev.filter((_, i) => i !== index));
  }

  function getSubjectName(subjectId: string): string {
    return subjects.find((s) => s.id === subjectId)?.name ?? "Unknown";
  }

  function getClassName(classId: string): string {
    const classInfo = classes.find((c) => c.id === classId);
    if (!classInfo) return "Unknown";
    return `Grade ${classInfo.grade}${classInfo.section ? ` - ${classInfo.section}` : ""}`;
  }

  async function handleSubmit() {
    if (isLoading) return;
    if (!fullName.trim() || !email.trim()) {
      alert("Name and email are required");
      return;
    }

    const payload: TeacherFormValues = {
      full_name: fullName,
      email,
      phone,
      gender,
      assignments,
    };

    await Promise.resolve(onSubmit(payload));
    resetForm();
    setOpen(false);
  }

  function resetForm() {
    setFullName("");
    setEmail("");
    setPhone("");
    setGender("");
    setSelectedGrade(null);
    setSelectedClass("");
    setSelectedSubject("");
    setAssignments([]);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="max-h-[75vh] overflow-y-auto rounded-none sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-base">Add Teacher</DialogTitle>
          <DialogDescription className="text-xs">
            Create a new teacher and assign subjects and classes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Basic Information */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted-foreground">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  className="h-8 rounded-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="h-8 rounded-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  className="h-8 rounded-none text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Gender</Label>
              <div className="flex gap-1.5">
                {GENDER_OPTIONS.map((option) => {
                  const checked = gender === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-center gap-1.5 border px-2.5 py-1 text-xs transition-colors ${
                        checked
                          ? "border-primary bg-primary/5 font-medium text-primary"
                          : "text-muted-foreground hover:border-primary/60"
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={option.value}
                        checked={checked}
                        onChange={() => setGender(option.value)}
                        className="size-3 accent-primary"
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Subject and Class Selection */}
          <div className="space-y-2.5 border-t pt-3">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground">
                Teaching Assignments
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Pick a grade, then a subject that grade offers.
              </p>
            </div>

            {loadingOptions ? (
              <p className="text-xs text-muted-foreground">Loading grades…</p>
            ) : (
              <div className="space-y-2.5">
                {/* Step 1: Grade */}
                <div className="space-y-1.5">
                  <Label className="text-xs">1. Select grade</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {grades.map((grade) => {
                      const active = selectedGrade === grade;
                      return (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => handleSelectGrade(grade)}
                          className={`min-w-9 border px-2 py-1 text-xs transition-colors ${
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "hover:border-primary"
                          }`}
                        >
                          {grade}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Section (only if the grade has more than one) */}
                {selectedGrade !== null &&
                  sectionsForSelectedGrade.length > 1 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">2. Select section</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {sectionsForSelectedGrade.map((classItem) => {
                          const active = selectedClass === classItem.id;
                          return (
                            <button
                              key={classItem.id}
                              type="button"
                              onClick={() => handleSelectClass(classItem.id)}
                              className={`border px-2 py-1 text-xs transition-colors ${
                                active
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "hover:border-primary"
                              }`}
                            >
                              {classItem.section
                                ? `Sec. ${classItem.section}`
                                : classItem.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* Step 3: Subject */}
                {selectedClass && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      {sectionsForSelectedGrade.length > 1 ? "3" : "2"}. Select
                      subject
                      {selectedClassInfo && (
                        <span className="ml-1 font-normal text-muted-foreground">
                          — {getClassName(selectedClassInfo.id)}
                        </span>
                      )}
                    </Label>

                    {loadingClassSubjects ? (
                      <p className="text-xs text-muted-foreground">
                        Loading subjects…
                      </p>
                    ) : (classSubjects[selectedClass] ?? []).length === 0 ? (
                      <div className="flex items-center gap-2 border border-dashed bg-muted/20 px-2.5 py-2 text-xs text-muted-foreground">
                        <BookX className="size-3.5 shrink-0" />
                        Subject is not available for this class yet.
                      </div>
                    ) : (
                      <div className="flex max-h-20 flex-wrap gap-1.5 overflow-y-auto">
                        {(classSubjects[selectedClass] ?? []).map((subject) => {
                          const active = selectedSubject === subject.id;
                          return (
                            <button
                              key={subject.id}
                              type="button"
                              onClick={() => setSelectedSubject(subject.id)}
                              className={`border px-2 py-1 text-xs transition-colors ${
                                active
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "hover:border-primary"
                              }`}
                            >
                              {subject.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Add Assignments Button */}
            <Button
              type="button"
              size="sm"
              onClick={addAssignments}
              disabled={!selectedSubject || !selectedClass}
              className="w-full rounded-none text-xs"
              variant="outline"
            >
              Add Selected Assignment
            </Button>

            {/* Assignments List */}
            {assignments.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Assigned Classes</Label>
                <div className="max-h-28 space-y-1.5 overflow-y-auto rounded-none border border-input p-2">
                  {assignments.map((assignment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="font-medium">
                          {getSubjectName(assignment.subjectId)}
                        </span>
                        {" - "}
                        <span>{getClassName(assignment.classId)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAssignment(index)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="rounded-none text-xs"
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="rounded-none text-xs"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Creating Teacher...
              </>
            ) : (
              "Create Teacher"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
