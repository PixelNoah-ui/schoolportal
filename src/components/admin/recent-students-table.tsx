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
import { recentStudents } from "@/lib/mock-data";
import { GradeBadge } from "./grade-badge";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

export function RecentStudentsTable() {
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
              <TableHead>Student No.</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Avg. Score</TableHead>
              <TableHead className="text-right">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentStudents.map((s) => (
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
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm tabular-nums">
                      {s.avgScore.toFixed(1)}
                    </span>
                    <GradeBadge score={s.avgScore} />
                  </div>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {s.joined}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
