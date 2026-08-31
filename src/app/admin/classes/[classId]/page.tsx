"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAddClassSubject,
  useAvailableSubjects,
  useAvailableTeachers,
  useClassSubjects,
  useRemoveClassSubject,
  useUpdateClassSubjectTeacher,
} from "@/hooks/use-class-subjects";
import { useParams } from "next/navigation";

export default function ClassDetailPage() {
  const params = useParams<{ classId: string }>();
  const classId = params.classId;
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [removeError, setRemoveError] = useState<string | null>(null);

  const { data, isLoading } = useClassSubjects(classId);
  const { data: subjectOptions } = useAvailableSubjects(classId);
  const { data: teacherOptions } = useAvailableTeachers();
  const addClassSubject = useAddClassSubject(classId);
  const updateClassSubjectTeacher = useUpdateClassSubjectTeacher(classId);
  const removeClassSubject = useRemoveClassSubject(classId);

  const assignedSubjects = useMemo(
    () => data?.classSubjects ?? [],
    [data?.classSubjects],
  );

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
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
          Loading class assignments…
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

        <div className="rounded-none border bg-card p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="subject-select">Add subject</Label>
              <Select
                value={selectedSubject}
                onValueChange={handleSelectSubject}
              >
                <SelectTrigger
                  id="subject-select"
                  className="w-full rounded-none"
                >
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {(subjectOptions?.subjects ?? []).map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

        <div className="rounded-none border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Subject</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead className="w-40">Reassign teacher</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedSubjects.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No subjects assigned yet.
                  </TableCell>
                </TableRow>
              ) : (
                assignedSubjects.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <BookOpen className="size-4 text-muted-foreground" />
                        {item.subjectName}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.teacherName ? (
                        <Badge variant="outline" className="rounded-none">
                          {item.teacherName}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Unassigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.teacherId ?? ""}
                        onValueChange={(value) =>
                          handleTeacherChange(
                            item.id,
                            value === "" ? null : value,
                          )
                        }
                      >
                        <SelectTrigger className="w-full rounded-none">
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
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-none text-destructive hover:text-destructive"
                          onClick={() => handleRemove(item.id)}
                          aria-label={`Remove ${item.subjectName}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center gap-3 border p-4 text-sm text-muted-foreground">
          <Users className="size-4" />
          {assignedSubjects.length} subject assignment
          {assignedSubjects.length === 1 ? "" : "s"}
        </div>
      </div>
    </>
  );
}
