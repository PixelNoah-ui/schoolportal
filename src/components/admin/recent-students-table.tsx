// components/admin/recent-students-table.tsx
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
import type { AllStudentRow } from "@/lib/mock-data";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

function displayName(student: AllStudentRow) {
  return student.profile?.full_name ?? "Unknown student";
}

export function RecentStudentsTable({
  students,
}: {
  students: AllStudentRow[];
}) {
  return (
    <Card className="rounded-none shadow-none">
      <CardHeader className="border-b pb-4">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Recently Enrolled
        </span>
      </CardHeader>
      <CardContent className="p-0">
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
                        <span className="text-sm font-medium">{fullName}</span>
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
                    {s.temporaryPassword ?? "-"}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-blue-600">
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
      </CardContent>
    </Card>
  );
}
