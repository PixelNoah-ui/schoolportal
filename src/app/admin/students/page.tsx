// app/admin/students/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Plus } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { RowActions } from "@/components/admin/row-actions";
import { PasswordCell } from "@/components/admin/password-cell";
import {
  EntityFormDialog,
  type FieldConfig,
} from "@/components/admin/entity-form-dialog";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { EntityEmptyState } from "@/components/admin/entity-empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import PaginationBar from "@/components/PaginationBar";
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
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useClassOptions } from "@/hooks/use-classes";
import { useGradeOptions } from "@/hooks/use-grades";
import { useToastManager } from "@/components/ui/toast";
import {
  useStudents,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
} from "@/hooks/use-students";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

export default function StudentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(search);
  const toastManager = useToastManager();
  const debouncedSearch = useDebouncedValue(searchInput);
  const classFilter = searchParams.get("class") ?? "all";
  const { data: academicYears = [] } = useAcademicYears();
  const { data: gradeOptions = [] } = useGradeOptions();
  const currentAcademicYearId =
    academicYears.find((year) => year.isCurrent)?.id ?? "all";
  const currentAcademicYearName =
    academicYears.find((year) => year.isCurrent)?.name ?? "all";
  const yearFilter = searchParams.get("year") ?? currentAcademicYearName;
  const selectedAcademicYearId =
    yearFilter === "all"
      ? "all"
      : (academicYears.find((year) => year.name === yearFilter)?.id ??
        currentAcademicYearId);
  const currentPage = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const [addOpen, setAddOpen] = useState(false);

  const studentFields: FieldConfig[] = [
    { name: "full_name", label: "Full name", fullWidth: true },
    { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Phone" },
    { name: "dob", label: "Date of birth", type: "date" },
    {
      name: "gender",
      label: "Gender",
      type: "radio",
      options: [
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
      ],
    },
    {
      name: "grade_id",
      label: "Grade",
      type: "select",
      options: gradeOptions.map((grade: { id: string; name: string }) => ({
        label: grade.name,
        value: grade.id,
      })),
      fullWidth: true,
    },
  ];

  const { data, isLoading } = useStudents({
    search: debouncedSearch,
    classId: classFilter,
    academicYearId: selectedAcademicYearId,
    page: currentPage,
  });
  const { data: filteredClassOptions = [] } = useClassOptions({
    academicYearId:
      selectedAcademicYearId === "all" ? undefined : selectedAcademicYearId,
  });
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  const handleCreateStudent = async (values: Record<string, string>) => {
    try {
      await createStudent.mutateAsync({
        ...values,
        grade_id: values.grade_id || "",
      });
      setAddOpen(false);
      toastManager.add({
        title: "Student created",
        description: "The student account was created successfully.",
        type: "success",
      });
    } catch (error) {
      toastManager.add({
        title: "Could not create student",
        description:
          error instanceof Error ? error.message : "Failed to create student",
        type: "error",
      });
    }
  };

  const handleUpdateStudent = async (
    id: string,
    values: Record<string, string>,
  ) => {
    try {
      await updateStudent.mutateAsync({ id, payload: values });
      toastManager.add({
        title: "Student updated",
        description: "The student record was updated successfully.",
        type: "success",
      });
    } catch (error) {
      toastManager.add({
        title: "Could not update student",
        description:
          error instanceof Error ? error.message : "Failed to update student",
        type: "error",
      });
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await deleteStudent.mutateAsync(id);
      toastManager.add({
        title: "Student deleted",
        description: "The student record was deleted successfully.",
        type: "success",
      });
    } catch (error) {
      toastManager.add({
        title: "Could not delete student",
        description:
          error instanceof Error ? error.message : "Failed to delete student",
        type: "error",
      });
    }
  };

  const hasFilters =
    Boolean(search) ||
    classFilter !== "all" ||
    (yearFilter !== "all" && yearFilter !== currentAcademicYearName);
  const isEmpty = !isLoading && (data?.students.length ?? 0) === 0;

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

  useEffect(() => {
    if (!searchParams.get("year") && currentAcademicYearName !== "all") {
      const next = new URLSearchParams(searchParams);
      next.set("year", currentAcademicYearName);
      router.replace(`?${next.toString()}`);
    }
  }, [currentAcademicYearName, router, searchParams]);

  function clearFilters() {
    setSearchInput("");
    const next = new URLSearchParams(searchParams);
    next.delete("search");
    next.delete("class");
    next.delete("page");
    if (currentAcademicYearName !== "all")
      next.set("year", currentAcademicYearName);
    router.replace(`?${next.toString()}`);
  }

  return (
    <>
      <SiteHeader title="Students" />

      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <PageHeader eyebrow="All Students" count={data?.totalPages} />
          <EntityFormDialog
            mode="add"
            title="Add student"
            description="Create a new student record."
            fields={studentFields}
            columns={2}
            open={addOpen}
            onOpenChange={setAddOpen}
            onSubmit={handleCreateStudent}
            isLoading={createStudent.isPending}
            trigger={
              <Button className="rounded-none">
                <Plus className="size-4" /> Add Student
              </Button>
            }
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <DataToolbar
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="Search by name or username"
            filterOptions={filteredClassOptions.map((c) => ({
              label: `Grade ${c.grade} - ${c.section || "Unassigned"}`,
              value: c.id,
            }))}
            filterValue={classFilter}
            onFilterChange={(value) => updateQuery("class", value)}
            filterLabel="All Classes"
          />
          <Select
            value={yearFilter === "all" ? "all" : yearFilter}
            onValueChange={(value) => updateQuery("year", value ?? "all")}
          >
            <SelectTrigger className="w-full rounded-none sm:w-52">
              <SelectValue placeholder="Academic year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All academic years</SelectItem>
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={year.name}>
                  {year.name}
                  {year.isCurrent ? " (Current)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Student</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Password</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          {isLoading ? (
            <TableSkeleton rows={6} columns={9} />
          ) : (
            <TableBody>
              {data?.students.map((s) => {
                const fullName = s.profile?.full_name ?? "Unknown student";
                const email = s.profile?.email ?? "-";
                const username = s.profile?.username ?? "-";
                const gradeId =
                  ((s as unknown as Record<string, unknown>)
                    .gradeId as string) || "";
                const classParts = (s.className || "").split(" - ");
                const gradeLabel = classParts[0] || s.className || "Unassigned";
                const classLabel = classParts[1] || "-";

                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 rounded-none">
                          <AvatarFallback className="rounded-none bg-secondary text-xs">
                            {initials(fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {fullName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {username}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <PasswordCell value={s.temporaryPassword} />
                    </TableCell>
                    <TableCell className="text-sm font-medium text-blue-600">
                      {gradeLabel}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {classLabel}
                    </TableCell>
                    <TableCell className="text-sm capitalize text-muted-foreground">
                      {s.gender ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.phone || "Not provided"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.dob || "-"}
                    </TableCell>
                    <TableCell>
                      <RowActions
                        entityName={fullName}
                        fields={studentFields}
                        values={{
                          full_name: fullName,
                          email: email === "-" ? "" : email,
                          phone: s.phone,
                          dob: s.dob,
                          gender: s.gender ?? "",
                          grade_id: gradeId,
                        }}
                        onEdit={(values) => handleUpdateStudent(s.id, values)}
                        onDelete={() => handleDeleteStudent(s.id)}
                        editIsLoading={updateStudent.isPending}
                        deleteIsLoading={deleteStudent.isPending}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          )}
        </Table>

        {isEmpty && (
          <EntityEmptyState
            icon={GraduationCap}
            entityLabel="student"
            hasFilters={hasFilters}
            onClearFilters={hasFilters ? clearFilters : undefined}
            onAdd={!hasFilters ? () => setAddOpen(true) : undefined}
            description="Once you enroll students, they'll show up here with their class and contact details."
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
