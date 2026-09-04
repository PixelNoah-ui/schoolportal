"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Check,
  GraduationCap,
  Pencil,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { ClassFormDialog } from "@/components/admin/class-form-dialog";
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
  useAvailableTeachers,
  useClassSubjects,
  useRemoveClassSubject,
} from "@/hooks/use-class-subjects";
import { addClassSubject } from "@/lib/api/class-subjects";
import { useUpdateClass } from "@/hooks/use-classes";
import { useSubjects } from "@/hooks/use-subjects";
import { useToastManager } from "@/components/ui/toast";
import { useParams } from "next/navigation";

export default function ClassDetailPage() {
  const params = useParams<{ classId: string }>();
  const classId = params.classId;
  const [homeroomTeacher, setHomeroomTeacher] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading } = useClassSubjects(classId);
  const { data: teacherOptions } = useAvailableTeachers();
  const { data: subjectOptions = { subjects: [] } } = useSubjects({
    pageSize: 200,
  });
  const removeClassSubject = useRemoveClassSubject(classId);
  const updateClass = useUpdateClass();
  const toastManager = useToastManager();
  const queryClient = useQueryClient();

  const assignedSubjects = useMemo(
    () => data?.classSubjects ?? [],
    [data?.classSubjects],
  );
  const editSubjectOptions = useMemo(
    () =>
      assignedSubjects.map((subject) => ({
        id: subject.subjectId,
        name: subject.subjectName,
      })),
    [assignedSubjects],
  );
  const selectedHomeroomTeacher =
    homeroomTeacher || data?.homeroomTeacherId || "";

  const handleHomeroomChange = async (value: string | null) => {
    const nextTeacher = value ?? "";
    setHomeroomTeacher(nextTeacher);
    try {
      await updateClass.mutateAsync({
        id: classId,
        payload: {
          grade: String(data?.grade ?? ""),
          section: data?.section ?? "",
          homeroom_teacher: nextTeacher,
        },
      });
      toastManager.add({
        title: "Homeroom teacher assigned",
        description: nextTeacher
          ? "The class homeroom teacher has been updated."
          : "The homeroom teacher assignment was cleared.",
        type: "success",
      });
    } catch (error) {
      toastManager.add({
        title: "Could not assign homeroom teacher",
        description:
          error instanceof Error ? error.message : "Please try again.",
        type: "error",
      });
    }
  };

  const handleClassEdit = async (values: {
    grade: string;
    section: string;
    subjects: string[];
  }) => {
    if (!data) return;

    await updateClass.mutateAsync({
      id: classId,
      payload: {
        grade: values.grade,
        section: values.section,
        homeroom_teacher: data.homeroomTeacherId ?? "",
      },
    });

    const assignedIds = new Set(
      data.classSubjects.map((subject) => subject.subjectId),
    );
    await Promise.all(
      values.subjects
        .filter((subjectId) => !assignedIds.has(subjectId))
        .map((subjectId) => addClassSubject({ classId, subjectId })),
    );
    await Promise.all(
      data.classSubjects
        .filter((subject) => !values.subjects.includes(subject.subjectId))
        .map((subject) =>
          removeClassSubject.mutateAsync({ classSubjectId: subject.id }),
        ),
    );
    await queryClient.invalidateQueries({
      queryKey: ["class-subjects", classId],
    });
    await queryClient.invalidateQueries({ queryKey: ["classes"] });

    toastManager.add({
      title: "Class updated",
      description: "The class details and subjects were updated.",
      type: "success",
    });
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

          <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
            <Skeleton className="h-32 rounded-none" />
            <Skeleton className="h-32 rounded-none" />
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
      <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 sm:p-6">
        <div className="flex flex-col gap-5 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <Link
              href="/admin/classes"
              className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Back to classes
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center bg-primary text-primary-foreground">
                <GraduationCap className="size-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {data?.className ?? "Class assignments"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {data?.grade ? `Grade ${data.grade}` : "Grade not set"}
                  {data?.section ? ` · Section ${data.section}` : ""}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ClassFormDialog
              key={`${classId}:${data?.grade}:${data?.section}:${data?.classSubjects.map((subject) => subject.subjectId).join(",")}`}
              mode="edit"
              open={editOpen}
              onOpenChange={setEditOpen}
              subjectOptions={Array.from(
                new Map(
                  [...subjectOptions.subjects, ...editSubjectOptions].map(
                    (subject) => [subject.id, subject],
                  ),
                ).values(),
              )}
              initialValues={{
                grade: String(data?.grade ?? ""),
                section: data?.section ?? "",
                subjects:
                  data?.classSubjects.map((subject) => subject.subjectId) ?? [],
              }}
              onSubmit={handleClassEdit}
              isLoading={updateClass.isPending || removeClassSubject.isPending}
            />
            <Button
              variant="outline"
              className="rounded-none"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-4" /> Edit class
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="border bg-card">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="font-semibold">Subjects in this class</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Subjects currently assigned to this class.
                </p>
              </div>
              <span className="border bg-muted px-2 py-1 text-xs font-semibold tabular-nums">
                {assignedSubjects.length}
              </span>
            </div>
            {assignedSubjects.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <BookOpen className="size-9 text-muted-foreground" />
                <p className="mt-3 font-semibold">No subjects assigned</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Add subjects from the class edit dialog to build this class
                  roster.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {assignedSubjects.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-5 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center bg-primary/10 text-sm font-semibold text-primary">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {item.subjectName}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Subject assignment
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="border bg-card">
            <div className="border-b px-5 py-4">
              <h3 className="font-semibold">Homeroom teacher</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Assign the teacher responsible for this class.
              </p>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3 border bg-muted/30 p-3">
                <div className="flex size-10 items-center justify-center bg-primary text-primary-foreground">
                  {selectedHomeroomTeacher ? (
                    <Check className="size-5" />
                  ) : (
                    <Users className="size-5" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Current status
                  </p>
                  <p className="font-semibold">
                    {data?.homeroomTeacherName ?? "Not assigned"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="homeroom-teacher">Choose teacher</Label>
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
              <p className="text-xs leading-5 text-muted-foreground">
                This teacher appears as the primary contact for the class.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
