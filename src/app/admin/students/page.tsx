// app/admin/students/page.tsx
"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { classes } from "@/lib/mock-data";
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
  { name: "student_number", label: "Student number" },
  { name: "phone", label: "Phone" },
  { name: "dob", label: "Date of birth", type: "date" },
];

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");

  const { data: students, isLoading } = useStudents();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  const filtered = useMemo(() => {
    if (!students) return [];
    return students.filter((s) => {
      const matchesSearch =
        s.profile.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.student_number.toLowerCase().includes(search.toLowerCase());
      const matchesClass = classFilter === "all" || s.classId === classFilter;
      return matchesSearch && matchesClass;
    });
  }, [students, search, classFilter]);

  return (
    <>
      <SiteHeader title="Students" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <PageHeader eyebrow="All Students" count={students?.length} />
          <EntityFormDialog
            mode="add"
            title="Add student"
            description="Create a new student record."
            fields={studentFields}
            onSubmit={(values) => createStudent.mutate(values)}
            trigger={
              <Button className="rounded-none">
                <Plus className="size-4" /> Add Student
              </Button>
            }
          />
        </div>

        <DataToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or student no."
          filterOptions={classes.map((c) => ({
            label: `Grade ${c.grade} - ${c.section}`,
            value: c.id,
          }))}
          filterValue={classFilter}
          onFilterChange={setClassFilter}
          filterLabel="All Classes"
        />

        <Card className="rounded-none shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Student</TableHead>
                  <TableHead>Student No.</TableHead>
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
                  {filtered.map((s) => (
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
                        {s.student_number}
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
                            student_number: s.student_number,
                            phone: s.phone,
                            dob: s.dob,
                          }}
                          onEdit={(values) =>
                            updateStudent.mutate({ id: s.id, payload: values })
                          }
                          onDelete={() => deleteStudent.mutate(s.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No students match your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              )}
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
