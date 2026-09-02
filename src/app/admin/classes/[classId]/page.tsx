"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAddClassSubject,
  useAvailableSubjects,
  useAvailableTeachers,
  useClassSubjects,
  useRemoveClassSubject,
  useUpdateClassSubjectTeacher,
} from "@/hooks/use-class-subjects";
import { useUpdateClass } from "@/hooks/use-classes";
import { useParams } from "next/navigation";

export default function ClassDetailPage() {
  const params = useParams<{ classId: string }>();
  const classId = params.classId;
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [homeroomTeacher, setHomeroomTeacher] = useState("");

  const { data, isLoading } = useClassSubjects(classId);
  const { data: subjectOptions } = useAvailableSubjects(classId);
  const { data: teacherOptions } = useAvailableTeachers();
  const addClassSubject = useAddClassSubject(classId);
  const updateClassSubjectTeacher = useUpdateClassSubjectTeacher(classId);
  const removeClassSubject = useRemoveClassSubject(classId);
  const updateClass = useUpdateClass();

  const assignedSubjects = useMemo(
    () => data?.classSubjects ?? [],
    [data?.classSubjects],
  );
  const availableSubjects = subjectOptions?.subjects ?? [];

  const selectedHomeroomTeacher =
    homeroomTeacher || data?.homeroomTeacherId || "";

  const handleAddAssignment = () => {
    if (!selectedSubject) return;
    addClassSubject.mutate({
      subjectId: selectedSubject,
      teacherId: selectedTeacher || null,
    });
    setSelectedSubject("");
    setSelectedTeacher("");
  };

  const handleSelectSubject = (value: string | null) => {
    setSelectedSubject(value ?? "");
  };

  const handleSelectTeacher = (value: string | null) => {
    setSelectedTeacher(value ?? "");
  };

  const handleTeacherChange = (
    classSubjectId: string,
    teacherId: string | null,
  ) => {
    updateClassSubjectTeacher.mutate({ classSubjectId, teacherId });
  };

  const handleHomeroomChange = async (value: string | null) => {
    const nextTeacher = value ?? "";
    setHomeroomTeacher(nextTeacher);
    await updateClass.mutateAsync({
      id: classId,
      payload: {
        grade: String(data?.grade ?? ""),
        section: data?.section ?? "",
        homeroom_teacher: nextTeacher,
      },
    });
  };

  const handleRemove = (classSubjectId: string) => {
    setRemoveError(null);
    removeClassSubject.mutate(
      { classSubjectId },
      {
        onError: (error) => {
          setRemoveError(
            error instanceof Error && error.message
              ? error.message
              : "We couldn’t remove this class assignment. Please try again.",
          );
        },
      },
    );
  };

  if (!classId || isLoading) {
    return (
      <>
        <SiteHeader title="Class details" />
        <div className="flex flex-1 flex-col gap-5 p-6">
          <div className="space-y-3">
            <Skeleton className="h-3 w-28 rounded-none" />
            <Skeleton className="h-7 w-48 rounded-none" />
            <Skeleton className="h-4 w-32 rounded-none" />
          </div>

          <div className="rounded-none border bg-card p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <Skeleton className="h-14 flex-1 rounded-none" />
              <Skeleton className="h-14 flex-1 rounded-none" />
              <Skeleton className="h-9 w-32 rounded-none" />
            </div>
          </div>

          <div className="rounded-none border">
            <div className="space-y-px p-4">
              <Skeleton className="h-5 w-full rounded-none" />
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-none" />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader title={data?.className ?? "Class details"} />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Link
              href="/admin/classes"
              className="mb-2 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Back to classes
            </Link>
            <h2 className="text-xl font-semibold tracking-tight">
              {data?.className ?? "Class assignments"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {data?.grade ? `Grade ${data.grade}` : "Grade not set"}
              {data?.section ? ` · Section ${data.section}` : ""}
            </p>
          </div>
          <div className="w-full max-w-xs space-y-2 sm:w-64">
            <Label htmlFor="homeroom-teacher">Homeroom teacher</Label>
            <Select
              value={selectedHomeroomTeacher}
              onValueChange={handleHomeroomChange}
              disabled={updateClass.isPending}
            >
              <SelectTrigger
                id="homeroom-teacher"
                className="w-full rounded-none"
              >
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {(teacherOptions?.teachers ?? []).map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {removeError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p className="leading-5">{removeError}</p>
          </div>
        )}

        {availableSubjects.length > 0 ? (
          <div className="rounded-none border bg-card p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="subject-select">Add subject</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {availableSubjects.map((subject) => (
                    <label
                      key={subject.id}
                      className="flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm hover:border-primary"
                    >
                      <input
                        id={`subject-${subject.id}`}
                        type="radio"
                        name="subject"
                        value={subject.id}
                        checked={selectedSubject === subject.id}
                        onChange={() => handleSelectSubject(subject.id)}
                        className="size-4 accent-primary"
                      />
                      {subject.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="teacher-select">Assigned teacher</Label>
                <Select
                  value={selectedTeacher}
                  onValueChange={handleSelectTeacher}
                >
                  <SelectTrigger
                    id="teacher-select"
                    className="w-full rounded-none"
                  >
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {(teacherOptions?.teachers ?? []).map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="rounded-none"
                onClick={handleAddAssignment}
                disabled={!selectedSubject || addClassSubject.isPending}
              >
                <Plus className="size-4" /> Add subject
              </Button>
            </div>
          </div>
        ) : assignedSubjects.length === 0 ? (
          <div className="flex items-center gap-3 border border-dashed bg-muted/30 px-4 py-4 text-sm text-muted-foreground">
            <BookOpen className="size-4 shrink-0" />
            <span>
              No courses are available to assign yet. Add subjects first.
            </span>
          </div>
        ) : null}

        {assignedSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed px-6 py-16 text-center">
            <BookOpen className="size-9 text-muted-foreground" />
            <p className="mt-3 font-semibold">No courses assigned</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose an available subject above to build this class schedule.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {assignedSubjects.map((item) => (
              <div key={item.id} className="border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center bg-primary/10 text-primary">
                      <BookOpen className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.subjectName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Course assigned to this class
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-none"
                          aria-label={`Actions for ${item.subjectName}`}
                        />
                      }
                    >
                      <MoreVertical className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="min-w-36 rounded-none"
                    >
                      <DropdownMenuItem
                        onClick={() => setEditingSubjectId(item.id)}
                      >
                        <Pencil className="size-4" /> Edit teacher
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleRemove(item.id)}
                      >
                        <Trash2 className="size-4" /> Remove course
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-5 border-t pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Subject teacher
                  </p>
                  {editingSubjectId === item.id ? (
                    <Select
                      value={item.teacherId ?? ""}
                      onValueChange={(value) => {
                        handleTeacherChange(
                          item.id,
                          value === "" ? null : value,
                        );
                        setEditingSubjectId(null);
                      }}
                    >
                      <SelectTrigger className="mt-2 w-full rounded-none">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {(teacherOptions?.teachers ?? []).map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 text-sm">
                      {item.teacherName ?? "Unassigned"}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 border p-4 text-sm text-muted-foreground">
          <Users className="size-4" />
          {assignedSubjects.length} subject assignment
          {assignedSubjects.length === 1 ? "" : "s"}
        </div>
      </div>
    </>
  );
}
