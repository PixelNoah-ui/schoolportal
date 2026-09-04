"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, MoreVertical, Pencil, Plus, School, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { ClassFormDialog } from "@/components/admin/class-form-dialog";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { EntityEmptyState } from "@/components/admin/entity-empty-state";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { useToastManager } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PaginationBar from "@/components/PaginationBar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useClasses,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
} from "@/hooks/use-classes";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useSubjects } from "@/hooks/use-subjects";
import { useClassSubjects } from "@/hooks/use-class-subjects";
import { addClassSubject, removeClassSubject } from "@/lib/api/class-subjects";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ClassesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const yearFilter = searchParams.get("year") ?? "all";
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput);
  const currentPage = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const [addOpen, setAddOpen] = useState(false);
  const [editClassId, setEditClassId] = useState<string | null>(null);
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);

  const { data: academicYears = [] } = useAcademicYears();
  const { data: subjectOptions = { subjects: [] } } = useSubjects({
    pageSize: 200,
  });
  const { data, error, isLoading } = useClasses({
    search: debouncedSearch,
    academicYearId: yearFilter,
    page: currentPage,
  });
  const { data: editClassDetails } = useClassSubjects(editClassId ?? "");
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();
  const toastManager = useToastManager();
  const queryClient = useQueryClient();

  const hasFilters = Boolean(search) || yearFilter !== "all";
  const isEmpty = !isLoading && !error && (data?.classes.length ?? 0) === 0;

  const updateQuery = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams);
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
      next.delete("page");
      router.replace(`?${next.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (debouncedSearch === search) return;
    updateQuery("search", debouncedSearch);
  }, [debouncedSearch, search, updateQuery]);

  function clearFilters() {
    setSearchInput("");
    router.replace("?");
  }

  const activeAcademicYearId =
    yearFilter === "all"
      ? (academicYears.find((year) => year.isCurrent)?.id ?? "")
      : yearFilter;
  const editClass = data?.classes.find(
    (classRow) => classRow.id === editClassId,
  );
  const deleteClassRow = data?.classes.find(
    (classRow) => classRow.id === deleteClassId,
  );
  const editSubjects =
    editClassDetails?.classSubjects.map((subject) => ({
      classSubjectId: subject.id,
      id: subject.subjectId,
      name: subject.subjectName,
    })) ??
    editClass?.subjects ??
    [];
  const editSubjectOptions = Array.from(
    new Map(
      [...subjectOptions.subjects, ...editSubjects].map((subject) => [
        subject.id,
        { id: subject.id, name: subject.name },
      ]),
    ).values(),
  );
  const editGrade = editClassDetails?.grade ?? editClass?.grade ?? 0;
  const editSection = editClassDetails?.section ?? editClass?.section ?? "";

  return (
    <>
      <SiteHeader title="Classes" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <PageHeader eyebrow="All Classes" count={data?.classes.length} />
          <ClassFormDialog
            mode="add"
            open={addOpen}
            onOpenChange={setAddOpen}
            subjectOptions={subjectOptions.subjects}
            onSubmit={async (values) => {
              try {
                const sections = values.section
                  .split(",")
                  .map((section) => section.trim())
                  .filter(Boolean);
                const sectionsToCreate = sections.length ? sections : [""];

                await Promise.all(
                  sectionsToCreate.map(async (section) => {
                    const createdClass = await createClass.mutateAsync({
                      grade: values.grade,
                      section,
                      academic_year_id: activeAcademicYearId || "",
                    });

                    if (values.subjects.length) {
                      await Promise.all(
                        values.subjects.map((subjectId) =>
                          addClassSubject({
                            classId: createdClass.id,
                            subjectId,
                          }),
                        ),
                      );
                    }

                    return createdClass;
                  }),
                );
                toastManager.add({
                  title: "Class created",
                  description: "The class and selected subjects were added.",
                  type: "success",
                });
              } catch (error) {
                toastManager.add({
                  title: "Could not create class",
                  description:
                    error instanceof Error
                      ? error.message
                      : "Please try again.",
                  type: "error",
                });
                throw error;
              }
            }}
            isLoading={createClass.isPending}
            trigger={
              <Button className="rounded-none">
                <Plus className="size-4" /> Add Class
              </Button>
            }
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <DataToolbar
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="Search by class or section"
          />
          <Select
            value={yearFilter}
            onValueChange={(value) => updateQuery("year", value ?? "all")}
          >
            <SelectTrigger className="w-full rounded-none sm:w-52">
              <SelectValue placeholder="Academic year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All academic years</SelectItem>
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name}
                  {year.isCurrent ? " (Current)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-none border">
          {error ? (
            <div className="border-b border-destructive/20 bg-destructive/5 px-4 py-5 text-sm text-destructive">
              Could not load classes:{" "}
              {error instanceof Error ? error.message : "Please try again."}
            </div>
          ) : null}
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Class</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Homeroom teacher</TableHead>
                <TableHead>Students</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            {isLoading ? (
              <TableSkeleton rows={6} columns={6} />
            ) : (
              <TableBody>
                {data?.classes.map((classRow) => (
                  <TableRow
                    key={classRow.id}
                    className="group border-b border-border/60 transition-colors odd:bg-muted/20 hover:bg-muted/50"
                  >
                    <TableCell className="border-l-4 border-l-primary/40 font-medium">
                      <div className="flex flex-col gap-0.5">
                        <span>{classRow.name}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {classRow.academicYearName ?? "Current academic year"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex max-w-xs flex-wrap gap-1.5">
                        {classRow.subjects.length > 0 ? (
                          classRow.subjects.map((subject) => (
                            <span
                              key={subject.classSubjectId}
                              className="inline-flex items-center border border-primary/20 bg-primary/5 px-2 py-1 text-xs font-medium text-primary"
                            >
                              {subject.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No subjects
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {classRow.teacher && classRow.teacher !== "Unassigned" ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-semibold text-foreground">
                            {initials(classRow.teacher)}
                          </span>
                          <span className="text-muted-foreground">
                            {classRow.teacher}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-amber-600">
                          Unassigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium tabular-nums text-foreground">
                        {classRow.studentCount} students
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end opacity-70 transition-opacity group-hover:opacity-100">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-none"
                                aria-label={`Actions for ${classRow.name}`}
                              />
                            }
                          >
                            <MoreVertical className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="min-w-32 rounded-none"
                          >
                            <DropdownMenuItem
                              render={
                                <Link href={`/admin/classes/${classRow.id}`} />
                              }
                            >
                              <Eye className="size-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setEditClassId(classRow.id)}
                            >
                              <Pencil className="size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteClassId(classRow.id)}
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
        </div>

        {editClass && (
          <ClassFormDialog
            key={`${editClass.id}:${editGrade}:${editSection}:${editSubjects.map((subject) => subject.id).join(",")}`}
            mode="edit"
            open
            onOpenChange={(open) => !open && setEditClassId(null)}
            subjectOptions={editSubjectOptions}
            initialValues={{
              grade: String(editGrade),
              section: editSection,
              homeroom_teacher: "",
              subjects: editSubjects.map((subject) => subject.id),
            }}
            onSubmit={async (values) => {
              try {
                await updateClass.mutateAsync({
                  id: editClass.id,
                  payload: {
                    grade: values.grade,
                    section: values.section,
                    academic_year_id: activeAcademicYearId || "",
                  },
                });
                const previousSubjects = new Map(
                  editSubjects.map((subject) => [subject.id, subject]),
                );
                await Promise.all(
                  values.subjects
                    .filter((subjectId) => !previousSubjects.has(subjectId))
                    .map((subjectId) =>
                      addClassSubject({
                        classId: editClass.id,
                        subjectId,
                      }),
                    ),
                );
                await Promise.all(
                  editSubjects
                    .filter((subject) => !values.subjects.includes(subject.id))
                    .map((subject) =>
                      removeClassSubject({
                        classSubjectId: subject.classSubjectId,
                      }),
                    ),
                );
                await queryClient.invalidateQueries({
                  queryKey: ["class-subjects", editClass.id],
                });
                await queryClient.invalidateQueries({
                  queryKey: ["classes"],
                });
                toastManager.add({
                  title: "Class updated",
                  description: "The class details were updated.",
                  type: "success",
                });
              } catch (error) {
                toastManager.add({
                  title: "Could not update class",
                  description:
                    error instanceof Error
                      ? error.message
                      : "Please try again.",
                  type: "error",
                });
                throw error;
              }
            }}
            isLoading={updateClass.isPending}
          />
        )}

        {deleteClassRow && (
          <ConfirmDeleteDialog
            name={`${deleteClassRow.name} - Grade ${deleteClassRow.grade}`}
            open
            onOpenChange={(open) => !open && setDeleteClassId(null)}
            onConfirm={async () => {
              try {
                await deleteClass.mutateAsync(deleteClassRow.id);
                toastManager.add({
                  title: "Class deleted",
                  description: "The class was removed successfully.",
                  type: "success",
                });
                setDeleteClassId(null);
              } catch (error) {
                toastManager.add({
                  title: "Could not delete class",
                  description:
                    error instanceof Error
                      ? error.message
                      : "Please try again.",
                  type: "error",
                });
                throw error;
              }
            }}
            isLoading={deleteClass.isPending}
          />
        )}

        {isEmpty && (
          <EntityEmptyState
            icon={School}
            entityLabel="class"
            hasFilters={hasFilters}
            onClearFilters={hasFilters ? clearFilters : undefined}
            onAdd={!hasFilters ? () => setAddOpen(true) : undefined}
            description="Once you add classes, they'll show up here with their grade, section, teacher, and student count."
          />
        )}

        {!isEmpty && (
          <PaginationBar
            totalPage={data?.totalPages ?? 1}
            currentPage={currentPage}
          />
        )}
      </div>
    </>
  );
}
