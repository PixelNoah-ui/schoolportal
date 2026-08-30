// app/admin/students/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Plus } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { RowActions } from "@/components/admin/row-actions";
import {
  EntityFormDialog,
  type FieldConfig,
} from "@/components/admin/entity-form-dialog";
import { GradeBadge } from "@/components/admin/grade-badge";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { EntityEmptyState } from "@/components/admin/entity-empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import PaginationBar from "@/components/PaginationBar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { classes } from "@/lib/mock-data";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
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

const studentFields: FieldConfig[] = [
  { name: "full_name", label: "Full name" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone" },
  { name: "dob", label: "Date of birth", type: "date" },
];

export default function StudentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput);
  const classFilter = searchParams.get("class") ?? "all";
  const currentPage = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const [addOpen, setAddOpen] = useState(false);

  const { data, isLoading } = useStudents({
    search: debouncedSearch,
    classId: classFilter,
    page: currentPage,
  });
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  const hasFilters = Boolean(search) || classFilter !== "all";
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

  function clearFilters() {
    setSearchInput("");
    router.push("?");
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
            open={addOpen}
            onOpenChange={setAddOpen}
            onSubmit={(values) => createStudent.mutateAsync(values)}
            isLoading={createStudent.isPending}
            trigger={
              <Button className="rounded-none">
                <Plus className="size-4" /> Add Student
              </Button>
            }
          />
        </div>

        <DataToolbar
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search by name or username"
          filterOptions={classes.map((c) => ({
            label: `Grade ${c.grade} - ${c.section}`,
            value: c.id,
          }))}
          filterValue={classFilter}
          onFilterChange={(value) => updateQuery("class", value)}
          filterLabel="All Classes"
        />

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Student</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Temporary Password</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Avg. Score</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          {isLoading ? (
            <TableSkeleton rows={6} columns={7} />
          ) : (
            <TableBody>
              {data?.students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8 rounded-none">
                        <AvatarFallback className="rounded-none bg-secondary text-xs">
                          {initials(s.profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {s.profile.full_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {s.profile.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {s.profile.username}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {s.temporaryPassword ?? "-"}
                  </TableCell>
                  <TableCell className="text-sm">{s.className}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.phone}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.dob}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm tabular-nums">
                        {s.avgScore.toFixed(1)}
                      </span>
                      <GradeBadge score={s.avgScore} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <RowActions
                      entityName={s.profile.full_name}
                      fields={studentFields}
                      values={{
                        full_name: s.profile.full_name,
                        email: s.profile.email,
                        phone: s.phone,
                        dob: s.dob,
                      }}
                      onEdit={(values) =>
                        updateStudent.mutateAsync({ id: s.id, payload: values })
                      }
                      onDelete={() => deleteStudent.mutateAsync(s.id)}
                      editIsLoading={updateStudent.isPending}
                      deleteIsLoading={deleteStudent.isPending}
                    />
                  </TableCell>
                </TableRow>
              ))}
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
            description="Once you enroll students, they'll show up here with their class, contact details, and average score."
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
