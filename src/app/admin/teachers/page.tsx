// app/admin/teachers/page.tsx
"use client";

import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/admin/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { RowActions } from "@/components/admin/row-actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { allTeachers } from "@/lib/mock-data";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

export default function TeachersPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      allTeachers.filter(
        (t) =>
          t.profile.full_name.toLowerCase().includes(search.toLowerCase()) ||
          t.teacher_number.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  return (
    <>
      <SiteHeader title="Teachers" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <PageHeader
          eyebrow="All Teachers"
          count={allTeachers.length}
          actionLabel="Add Teacher"
        />
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
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
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
                      <RowActions />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
