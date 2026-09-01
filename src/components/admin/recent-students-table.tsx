"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PasswordCell } from "@/components/admin/password-cell";
import type { AllStudentRow } from "@/utils/types/dashboard";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

export function RecentStudentsTable({
  students,
}: {
  students: AllStudentRow[];
}) {
  console.log("RecentStudentsTable students:", students);
  return (
    <Card className="rounded-none shadow-none">
      <CardHeader className="border-b pb-4">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Recently Enrolled
        </span>
      </CardHeader>
      <CardContent className="p-0">
        {students.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            No students enrolled yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Student</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Date of Birth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => {
                const fullName = s.profile?.full_name ?? "Unknown student";
                const email = s.profile?.email ?? "-";
                const username = s.profile?.username ?? "-";
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
                    <TableCell>
                      <PasswordCell value={s.temporaryPassword} />
                    </TableCell>
                    <TableCell className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {gradeLabel}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {classLabel}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.phone || "Not provided"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.dob || "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
