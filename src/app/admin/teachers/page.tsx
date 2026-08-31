// app/admin/teachers/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { RowActions } from "@/components/admin/row-actions";
import { type FieldConfig } from "@/components/admin/entity-form-dialog";
import { TeacherFormDialog } from "@/components/admin/teacher-form-dialog";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { EntityEmptyState } from "@/components/admin/entity-empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PaginationBar from "@/components/PaginationBar";
import type { TeacherRow } from "@/lib/mock-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useTeachers,
  useCreateTeacher,
  useUpdateTeacher,
  useDeleteTeacher,
} from "@/hooks/use-teachers";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

// For editing teacher basic info only
const editTeacherFields: FieldConfig[] = [
  { name: "full_name", label: "Full name" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone" },
];

export default function TeachersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput);
  const currentPage = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const [addOpen, setAddOpen] = useState(false);

  const { data, isLoading } = useTeachers({
    search: debouncedSearch,
    page: currentPage,
  });
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();

  const hasFilters = Boolean(search);
  const isEmpty = !isLoading && (data?.teachers.length ?? 0) === 0;

  const updateQuery = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams);
      if (value) next.set("search", value);
      else next.delete("search");
      next.delete("page");
      router.replace(`?${next.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (debouncedSearch === search) return;
    updateQuery(debouncedSearch);
  }, [debouncedSearch, search, updateQuery]);

  function clearFilters() {
    setSearchInput("");
    router.replace("?");
  }

  return (
    <>
      <SiteHeader title="Teachers" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <PageHeader eyebrow="All Teachers" count={data?.teachers.length} />
          <TeacherFormDialog
            mode="add"
            open={addOpen}
            onOpenChange={setAddOpen}
            onSubmit={(values) => createTeacher.mutateAsync(values)}
            isLoading={createTeacher.isPending}
            trigger={
              <Button className="rounded-none">
                <Plus className="size-4" /> Add Teacher
              </Button>
            }
          />
        </div>

        <DataToolbar
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search by teacher name"
        />

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Teacher</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Password</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead>Classes</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          {isLoading ? (
            <TableSkeleton rows={6} columns={7} />
          ) : (
            <TableBody>
              {data?.teachers.map((t: TeacherRow) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8 rounded-none">
                        <AvatarFallback className="rounded-none bg-secondary text-xs">
                          {initials(t.profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {t.profile.full_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t.profile.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {t.profile.username}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {t.temporaryPassword ?? "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {t.subjects.map((s: string) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="rounded-none font-normal"
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {t.classCount}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.phone}
                  </TableCell>
                  <TableCell>
                    <RowActions
                      entityName={t.profile.full_name}
                      fields={editTeacherFields}
                      values={{
                        full_name: t.profile.full_name,
                        email: t.profile.email,
                        phone: t.phone,
                      }}
                      onEdit={(values) =>
                        updateTeacher.mutateAsync({ id: t.id, payload: values })
                      }
                      onDelete={() => deleteTeacher.mutateAsync(t.id)}
                      editIsLoading={updateTeacher.isPending}
                      deleteIsLoading={deleteTeacher.isPending}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>

        {isEmpty && (
          <EntityEmptyState
            icon={Users}
            entityLabel="teacher"
            hasFilters={hasFilters}
            onClearFilters={hasFilters ? clearFilters : undefined}
            onAdd={!hasFilters ? () => setAddOpen(true) : undefined}
            description="Once you add teachers, they'll show up here with their subjects and assigned classes."
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
