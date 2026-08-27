// app/admin/teachers/page.tsx
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
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import {
  useTeachers,
  useCreateTeacher,
  useUpdateTeacher,
  useDeleteTeacher,
} from "@/hooks/use-teachers";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

const teacherFields: FieldConfig[] = [
  { name: "full_name", label: "Full name" },
  { name: "email", label: "Email", type: "email" },
  { name: "teacher_number", label: "Teacher number" },
  { name: "phone", label: "Phone" },
];

export default function TeachersPage() {
  const [search, setSearch] = useState("");

  const { data: teachers, isLoading } = useTeachers();
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();

  const filtered = useMemo(() => {
    if (!teachers) return [];
    return teachers.filter(
      (t) =>
        t.profile.full_name.toLowerCase().includes(search.toLowerCase()) ||
        t.teacher_number.toLowerCase().includes(search.toLowerCase()),
    );
  }, [teachers, search]);

  return (
    <>
      <SiteHeader title="Teachers" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <PageHeader eyebrow="All Teachers" count={teachers?.length} />
          <EntityFormDialog
            mode="add"
            title="Add teacher"
            description="Create a new teacher record."
            fields={teacherFields}
            onSubmit={(values) => createTeacher.mutate(values)}
            trigger={
              <Button className="rounded-none">
                <Plus className="size-4" /> Add Teacher
              </Button>
            }
          />
        </div>

        <DataToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or teacher no."
        />

        <Card className="rounded-none shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Teacher</TableHead>
                  <TableHead>Teacher No.</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              {isLoading ? (
                <TableSkeleton rows={6} columns={6} />
              ) : (
                <TableBody>
                  {filtered.map((t) => (
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
                        {t.teacher_number}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {t.subjects.map((s) => (
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
                          fields={teacherFields}
                          values={{
                            full_name: t.profile.full_name,
                            email: t.profile.email,
                            teacher_number: t.teacher_number,
                            phone: t.phone,
                          }}
                          onEdit={(values) =>
                            updateTeacher.mutate({ id: t.id, payload: values })
                          }
                          onDelete={() => deleteTeacher.mutate(t.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
