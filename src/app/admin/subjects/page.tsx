"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Plus } from "lucide-react";
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
import { useClassOptions } from "@/hooks/use-classes";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
} from "@/hooks/use-subjects";

const subjectFields: FieldConfig[] = [{ name: "name", label: "Subject" }];

export default function SubjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput);
  const classFilter = searchParams.get("class") ?? "all";
  const currentPage = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const [addOpen, setAddOpen] = useState(false);

  const { data, isLoading } = useSubjects({
    search: debouncedSearch,
    classId: classFilter,
    page: currentPage,
  });
  const { data: classOptions } = useClassOptions();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  const hasFilters = Boolean(search) || classFilter !== "all";
  const isEmpty = !isLoading && (data?.subjects.length ?? 0) === 0;

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
      <SiteHeader title="Subjects" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <PageHeader eyebrow="All Subjects" count={data?.subjects.length} />
          <EntityFormDialog
            mode="add"
            title="Add subject"
            description="Create a new subject record."
            fields={subjectFields}
            open={addOpen}
            onOpenChange={setAddOpen}
            onSubmit={(values) => createSubject.mutateAsync(values)}
            isLoading={createSubject.isPending}
            trigger={
              <Button className="rounded-none">
                <Plus className="size-4" /> Add Subject
              </Button>
            }
          />
        </div>

        <DataToolbar
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search by subject name"
          filterOptions={
            classOptions?.map((classRow) => ({
              label: `Grade ${classRow.grade} - ${classRow.section}`,
              value: classRow.id,
            })) ?? []
          }
          filterValue={classFilter}
          onFilterChange={(value) => updateQuery("class", value)}
          filterLabel="All Classes"
        />

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Subject</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Class Average</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          {isLoading ? (
            <TableSkeleton rows={6} columns={5} />
          ) : (
            <TableBody>
              {data?.subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="text-sm font-medium">
                    {subject.name}
                  </TableCell>
                  <TableCell className="text-sm">{subject.className}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {subject.teacher}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm tabular-nums">
                        {subject.avgScore.toFixed(1)}%
                      </span>
                      <GradeBadge score={subject.avgScore} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <RowActions
                      entityName={subject.name}
                      fields={subjectFields}
                      values={{ name: subject.name }}
                      onEdit={(values) =>
                        updateSubject.mutateAsync({
                          id: subject.id,
                          payload: values,
                        })
                      }
                      onDelete={() => deleteSubject.mutateAsync(subject.id)}
                      editIsLoading={updateSubject.isPending}
                      deleteIsLoading={deleteSubject.isPending}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>

        {isEmpty && (
          <EntityEmptyState
            icon={BookOpen}
            entityLabel="subject"
            hasFilters={hasFilters}
            onClearFilters={hasFilters ? clearFilters : undefined}
            onAdd={!hasFilters ? () => setAddOpen(true) : undefined}
            description="Once you add subjects, they'll show up here with their class, teacher, and calculated average."
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
