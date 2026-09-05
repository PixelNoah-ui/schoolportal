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
  initialValues?: Partial<
    Pick<TeacherFormValues, "full_name" | "email" | "phone" | "gender">
  >;
  initialAssignments?: TeacherAssignment[];
  teacherId?: string;
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
  subjectIds: string[];
}

interface TeacherAssignment {
  subjectId: string;
  classId: string;
  subjectName?: string;
  className?: string;
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
  initialValues,
  initialAssignments = [],
  teacherId,
}: TeacherFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [fullName, setFullName] = useState(initialValues?.full_name ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [gender, setGender] = useState(initialValues?.gender ?? "");
  const [selectionNeedsAdd, setSelectionNeedsAdd] = useState(false);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);

  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [assignments, setAssignments] =
    useState<TeacherAssignment[]>(initialAssignments);

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingTeacher, setLoadingTeacher] = useState(false);

  useEffect(() => {
    if (open && subjects.length === 0 && classes.length === 0) {
      loadSubjectsAndClasses();
    }
  }, [open, subjects.length, classes.length]);

  useEffect(() => {
    if (!open || mode !== "edit" || !teacherId) return;
    loadTeacherFromBackend(teacherId);
  }, [open, mode, teacherId]);

  async function loadTeacherFromBackend(id: string) {
    setLoadingTeacher(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("teachers")
        .select(
          "phone, gender, profiles!teachers_profile_id_fkey(full_name, email), class_subjects(subject_id, class_id, subjects(id, name), classes(name, section, grade_levels!classes_grade_level_id_fkey(level_number)))",
        )
        .eq("id", id)
        .single();
      if (error) throw error;

      const profile = Array.isArray(data.profiles)
        ? data.profiles[0]
        : data.profiles;
      setFullName(profile?.full_name ?? "");
      setEmail(profile?.email ?? "");
      setPhone(data.phone ?? "");
      setGender(data.gender ?? "");
      const savedAssignments = (data.class_subjects ?? []).map((assignment) => {
        const subjectData = assignment.subjects as unknown;
        const subject = Array.isArray(subjectData)
          ? (subjectData[0] as { name?: string } | undefined)
          : (subjectData as { name?: string } | null);
        const classData = Array.isArray(assignment.classes)
          ? assignment.classes[0]
          : assignment.classes;
        const gradeLevels = Array.isArray(classData?.grade_levels)
          ? classData.grade_levels[0]
          : classData?.grade_levels;
        return {
          subjectId: assignment.subject_id,
          classId: assignment.class_id,
          subjectName: subject?.name,
          className: classData
            ? `Grade ${gradeLevels?.level_number ?? "-"}${classData.section ? ` - ${classData.section}` : ""}`
            : undefined,
        };
      });
      setAssignments(savedAssignments);
      const firstAssignment = savedAssignments[0];
      const firstClass = firstAssignment
        ? (data.class_subjects ?? []).find(
            (assignment) => assignment.class_id === firstAssignment.classId,
          )
        : undefined;
      const firstClassData = Array.isArray(firstClass?.classes)
        ? firstClass.classes[0]
        : firstClass?.classes;
      const firstGradeLevels = Array.isArray(firstClassData?.grade_levels)
        ? firstClassData.grade_levels[0]
        : firstClassData?.grade_levels;
      if (firstAssignment && firstGradeLevels?.level_number) {
        setSelectedGrade(firstGradeLevels.level_number);
        setSelectedSubject(firstAssignment.subjectId);
        setSelectedClass(firstAssignment.classId);
      }
    } catch (error) {
      console.error("Error loading teacher:", error);
    } finally {
      setLoadingTeacher(false);
    }
  }

  async function loadSubjectsAndClasses() {
    setLoadingOptions(true);
    try {
      const supabase = createClient();
      const [subjectsRes, classesRes] = await Promise.all([
        supabase.from("subjects").select("id, name").order("name"),
        supabase
          .from("classes")
          .select(
            "id, name, section, grade_levels!classes_grade_level_id_fkey(level_number), class_subjects(subject_id)",
          )
          .order("section", { ascending: true }),
      ]);

      if (subjectsRes.data) setSubjects(subjectsRes.data as Subject[]);
      if (classesRes.data) {
        setClasses(
          (classesRes.data as Array<Record<string, unknown>>).map(
            (classRow) => {
              const gradeLevels = classRow.grade_levels as
                | { level_number: number }
                | { level_number: number }[]
                | null;
              const classSubjects = (classRow.class_subjects ?? []) as Array<{
                subject_id: string;
              }>;
              return {
                id: String(classRow.id),
                name: String(classRow.name),
                grade: Array.isArray(gradeLevels)
                  ? (gradeLevels[0]?.level_number ?? 0)
                  : (gradeLevels?.level_number ?? 0),
                section: classRow.section as string | null,
                subjectIds: classSubjects.map(
                  (assignment) => assignment.subject_id,
                ),
              };
            },
          ) as ClassOption[],
        );
      }
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
    setSelectionNeedsAdd(true);
  }, [classes]);

  const classesForSelectedGrade = useMemo(
    () => (selectedGrade !== null ? (classesByGrade[selectedGrade] ?? []) : []),
    [classesByGrade, selectedGrade],
  );
  const subjectsForSelectedGrade = useMemo(() => {
    const subjectIds = new Set(
      classesForSelectedGrade.flatMap((classItem) => classItem.subjectIds),
    );
    return subjects.filter((subject) => subjectIds.has(subject.id));
  }, [classesForSelectedGrade, subjects]);
  const classesForSelectedSubject = classesForSelectedGrade.filter(
    (classItem) => classItem.subjectIds.includes(selectedSubject),
  );

  function handleSelectGrade(grade: number) {
    setSelectedGrade(grade);
    setSelectedSubject("");
    setSelectedClass("");
    setSelectionNeedsAdd(true);
  }

  function handleSelectSubject(subjectId: string) {
    setSelectedSubject(subjectId);
    setSelectedClass("");
    setSelectionNeedsAdd(true);
  }

  function handleSelectClass(classId: string) {
    setSelectedClass(classId);
    setSelectionNeedsAdd(true);
  }

  function addAssignments() {
    if (!selectedClass || !selectedSubject) return;
    if (
      assignments.some(
        (assignment) =>
          assignment.classId === selectedClass &&
          assignment.subjectId === selectedSubject,
      )
    ) {
      setSelectionNeedsAdd(false);
      setSelectedGrade(null);
      setSelectedClass("");
      setSelectedSubject("");
      return;
    }
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
    setSelectionNeedsAdd(false);
  }

  function removeAssignment(index: number) {
    setAssignments((prev) => prev.filter((_, i) => i !== index));
  }

  function getSubjectName(subjectId: string): string {
    return (
      subjects.find((s) => s.id === subjectId)?.name ??
      assignments.find((assignment) => assignment.subjectId === subjectId)
        ?.subjectName ??
      "Unknown"
    );
  }

  function getClassName(classId: string): string {
    const classInfo = classes.find((c) => c.id === classId);
    if (!classInfo) {
      return (
        assignments.find((assignment) => assignment.classId === classId)
          ?.className ?? "Unknown"
      );
    }
    return `Grade ${classInfo.grade}${classInfo.section ? ` - ${classInfo.section}` : ""}`;
  }

  async function handleSubmit() {
    if (isLoading || selectionNeedsAdd || assignments.length === 0) return;
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
    setSelectionNeedsAdd(false);
    setAssignments([]);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="max-h-[75vh] overflow-y-auto rounded-none sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            {mode === "edit" ? "Edit Teacher" : "Add Teacher"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {mode === "edit"
              ? "Update teacher information and teaching assignments."
              : "Create a new teacher and assign subjects and classes."}
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

            {loadingTeacher ? (
              <p className="text-xs text-muted-foreground">
                Loading teacher information...
              </p>
            ) : loadingOptions ? (
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

                {/* Step 2: Subject offered by the selected grade */}
                {selectedGrade !== null && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">2. Select subject</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {subjectsForSelectedGrade.map((subject) => (
                        <button
                          key={subject.id}
                          type="button"
                          onClick={() => handleSelectSubject(subject.id)}
                          className={`border px-2 py-1 text-xs transition-colors ${
                            selectedSubject === subject.id
                              ? "border-primary bg-primary text-primary-foreground"
                              : "hover:border-primary"
                          }`}
                        >
                          {subject.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Classes offering the selected subject */}
                {selectedSubject && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">3. Select class</Label>
                    {classesForSelectedSubject.length === 0 ? (
                      <div className="flex items-center gap-2 border border-dashed bg-muted/20 px-2.5 py-2 text-xs text-muted-foreground">
                        <BookX className="size-3.5 shrink-0" />
                        No class offers this subject.
                      </div>
                    ) : (
                      <div className="grid max-h-28 gap-1.5 overflow-y-auto">
                        {classesForSelectedSubject.map((classItem) => {
                          const active = selectedClass === classItem.id;
                          return (
                            <label
                              key={classItem.id}
                              className={`flex cursor-pointer items-center gap-2 border px-2.5 py-2 text-xs transition-colors ${
                                active
                                  ? "border-primary bg-primary/5 text-primary"
                                  : "hover:border-primary"
                              }`}
                            >
                              <input
                                type="radio"
                                name="teaching-class"
                                value={classItem.id}
                                checked={active}
                                onChange={() => handleSelectClass(classItem.id)}
                                className="size-3.5 accent-primary"
                              />
                              <span>
                                Grade {classItem.grade} -{" "}
                                {classItem.section || classItem.name}
                              </span>
                            </label>
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
            disabled={
              isLoading || assignments.length === 0 || selectionNeedsAdd
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                {mode === "edit" ? "Saving changes..." : "Creating Teacher..."}
              </>
            ) : mode === "edit" ? (
              "Save changes"
            ) : (
              "Create Teacher"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
