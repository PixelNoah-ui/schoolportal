"use client";

import { useEffect, useState } from "react";
import { Plus, BookOpen } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { SiteHeader } from "@/components/admin/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AssignmentRow = {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string | null;
  classes?: { name: string; grade: number; section: string | null }[];
  subjects?: { name: string }[];
  teachers?: { profiles?: { full_name: string }[] }[];
};

export default function CourseAssignmentsPage() {
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [teachers, setTeachers] = useState<
    Array<{ id: string; full_name: string }>
  >([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [
        { data: classesData },
        { data: subjectData },
        { data: teacherData },
        { data: assignmentData },
      ] = await Promise.all([
        supabase
          .from("classes")
          .select("id, name, grade, section")
          .order("grade", { ascending: true }),
        supabase.from("subjects").select("id, name").order("name"),
        supabase
          .from("teachers")
          .select("id, profiles(full_name)")
          .order("created_at", { ascending: false }),
        supabase
          .from("class_subjects")
          .select(
            "id, class_id, subject_id, teacher_id, classes(name, grade, section), subjects(name), teachers(profiles(full_name))",
          ),
      ]);

      setClasses(
        (classesData ?? []).map((row) => ({
          id: row.id,
          name: `Grade ${row.grade} - ${row.section ?? ""}`,
        })),
      );
      setSubjects(
        (subjectData ?? []).map((row) => ({ id: row.id, name: row.name })),
      );
      setTeachers(
        (teacherData ?? []).map((row) => ({
          id: row.id,
          full_name: row.profiles?.[0]?.full_name ?? "Unassigned",
        })),
      );
      setAssignments((assignmentData ?? []) as AssignmentRow[]);
      if (!selectedClass && (classesData ?? []).length)
        setSelectedClass((classesData ?? [])[0].id);
      if (!selectedSubject && (subjectData ?? []).length)
        setSelectedSubject((subjectData ?? [])[0].id);
    };

    void load();
  }, [selectedClass, selectedSubject]);

  const handleCreate = async () => {
    if (!selectedClass || !selectedSubject) return;
    const supabase = createClient();
    const { error } = await supabase.from("class_subjects").insert({
      class_id: selectedClass,
      subject_id: selectedSubject,
      teacher_id: selectedTeacher || null,
    });
    if (!error) {
      const { data } = await supabase
        .from("class_subjects")
        .select(
          "id, class_id, subject_id, teacher_id, classes(name, grade, section), subjects(name), teachers(profiles(full_name))",
        );
      setAssignments((data ?? []) as AssignmentRow[]);
    }
  };

  return (
    <>
      <SiteHeader title="Course assignments" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <PageHeader
            eyebrow="Teaching assignments"
            count={assignments.length}
          />
        </div>

        <Card className="rounded-none shadow-none">
          <CardHeader className="border-b pb-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Assign teacher to course
            </span>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select
                  value={selectedClass}
                  onValueChange={(value) => setSelectedClass(value ?? "")}
                >
                  <SelectTrigger className="w-full rounded-none">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((row) => (
                      <SelectItem key={row.id} value={row.id}>
                        {row.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select
                  value={selectedSubject}
                  onValueChange={(value) => setSelectedSubject(value ?? "")}
                >
                  <SelectTrigger className="w-full rounded-none">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((row) => (
                      <SelectItem key={row.id} value={row.id}>
                        {row.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Teacher</Label>
                <Select
                  value={selectedTeacher}
                  onValueChange={(value) => setSelectedTeacher(value ?? "")}
                >
                  <SelectTrigger className="w-full rounded-none">
                    <SelectValue placeholder="Select teacher (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((row) => (
                      <SelectItem key={row.id} value={row.id}>
                        {row.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-end justify-end">
              <Button
                className="rounded-none"
                onClick={handleCreate}
                disabled={!selectedClass || !selectedSubject}
              >
                <Plus className="size-4" />
                Save assignment
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assignments.length === 0 ? (
            <div className="rounded-none border border-dashed p-6 text-sm text-muted-foreground">
              No teaching assignments created yet.
            </div>
          ) : (
            assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-none border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">
                    {assignment.classes?.[0]?.name ?? "Class"}
                  </p>
                  <BookOpen className="size-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {assignment.subjects?.[0]?.name ?? "Subject"}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Teacher:{" "}
                  {assignment.teachers?.[0]?.profiles?.[0]?.full_name ??
                    "Unassigned"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
