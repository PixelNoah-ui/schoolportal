"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, Plus, School } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { RowActions } from "@/components/admin/row-actions";
import {
  EntityFormDialog,
  type FieldConfig,
} from "@/components/admin/entity-form-dialog";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { EntityEmptyState } from "@/components/admin/entity-empty-state";
import { Button } from "@/components/ui/button";
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

const classFields: FieldConfig[] = [
  { name: "name", label: "Class name" },
  { name: "grade", label: "Grade", type: "number" },
  { name: "section", label: "Section" },
];

export default function ClassesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const yearFilter = searchParams.get("year") ?? "all";
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput);
  const currentPage = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const [addOpen, setAddOpen] = useState(false);

  const { data: academicYears = [] } = useAcademicYears();
  const { data, isLoading } = useClasses({
    search: debouncedSearch,
    academicYearId: yearFilter,
    page: currentPage,
  });
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();

  const hasFilters = Boolean(search) || yearFilter !== "all";
  const isEmpty = !isLoading && (data?.classes.length ?? 0) === 0;

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

  return (
    <>
      <SiteHeader title="Classes" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <PageHeader eyebrow="All Classes" count={data?.classes.length} />
          <EntityFormDialog
            mode="add"
            title="Add class"
            description="Create a new class record."
            fields={classFields}
            open={addOpen}
            onOpenChange={setAddOpen}
            onSubmit={(values) =>
              createClass.mutateAsync({
                ...values,
                academic_year_id: activeAcademicYearId || "",
              })
            }
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

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Class</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Section</TableHead>
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
                <TableRow key={classRow.id}>
                  <TableCell className="font-medium">{classRow.name}</TableCell>
                  <TableCell className="text-sm">
                    Grade {classRow.grade}
                  </TableCell>
                  <TableCell className="text-sm">
                    {classRow.section || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {classRow.teacher}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {classRow.studentCount}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/classes/${classRow.id}`}
                        className="inline-flex items-center gap-1 rounded-none border px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Eye className="size-3.5" />
                        View
                      </Link>
                      <RowActions
                        entityName={`${classRow.name} - Grade ${classRow.grade}`}
                        fields={classFields}
                        values={{
                          name: classRow.name,
                          grade: String(classRow.grade),
                          section: classRow.section,
                        }}
                        onEdit={(values) =>
                          updateClass.mutate({
                            id: classRow.id,
                            payload: {
                              ...values,
                              academic_year_id: activeAcademicYearId || "",
                            },
                          })
                        }
                        onDelete={() => deleteClass.mutate(classRow.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>

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
