// components/admin/teacher-form-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
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
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);

  const [classSubjects, setClassSubjects] = useState<Record<string, Subject[]>>(
    {},
  );
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (open && subjects.length === 0) {
      loadSubjectsAndClasses();
    }
  }, [open, subjects.length]);

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
    setSelectedClass("");
    setSelectedSubject("");
    setAssignments([]);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="rounded-none sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Teacher</DialogTitle>
          <DialogDescription>
            Create a new teacher and assign subjects and classes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="flex h-10 w-full rounded-none border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="rounded-none"
                />
              </div>
            </div>
          </div>

          {/* Subject and Class Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Teaching Assignments</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="teacher-class">1. Select class</Label>
                <select
                  id="teacher-class"
                  value={selectedClass}
                  onChange={async (event) => {
                    const classId = event.target.value;
                    setSelectedClass(classId);
                    setSelectedSubject("");
                    if (classId && !classSubjects[classId]) {
                      const supabase = createClient();
                      const { data } = await supabase
                        .from("class_subjects")
                        .select("subject_id, subjects(id, name)")
                        .eq("class_id", classId);
                      setClassSubjects((previous) => ({
                        ...previous,
                        [classId]: (data ?? [])
                          .map((row) => row.subjects)
                          .flat() as Subject[],
                      }));
                    }
                  }}
                  className="flex h-10 w-full rounded-none border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Choose a class</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      Grade {classItem.grade}
                      {classItem.section
                        ? ` - Section ${classItem.section}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>2. Select subject for this class</Label>
                <div className="grid max-h-32 gap-2 overflow-y-auto">
                  {loadingOptions ? (
                    <p className="text-sm text-muted-foreground">
                      Loading classes...
                    </p>
                  ) : (classSubjects[selectedClass] ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Select a class to see its subjects.
                    </p>
                  ) : (
                    (classSubjects[selectedClass] ?? []).map((subject) => (
                      <label
                        key={subject.id}
                        className="flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm hover:border-primary"
                      >
                        <input
                          type="radio"
                          name="teacher-subject"
                          value={subject.id}
                          checked={selectedSubject === subject.id}
                          onChange={() => setSelectedSubject(subject.id)}
                          className="size-4 accent-primary"
                        />
                        {subject.name}
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Add Assignments Button */}
            <Button
              type="button"
              onClick={addAssignments}
              disabled={!selectedSubject || !selectedClass}
              className="w-full rounded-none"
              variant="outline"
            >
              Add Selected Assignments
            </Button>

            {/* Assignments List */}
            {assignments.length > 0 && (
              <div className="space-y-2">
                <Label>Assigned Classes</Label>
                <div className="border border-input rounded-none p-3 space-y-2 max-h-40 overflow-y-auto">
                  {assignments.map((assignment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-2 text-sm"
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
                        <X className="size-4" />
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
