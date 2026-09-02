"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/teacher/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useClassRoster } from "@/hooks/use-class-roster";

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function ClassRosterPage() {
  const params = useParams();
  const router = useRouter();
  const classSubjectId = params.id as string;
  const [semesterId, setSemesterId] = useState("sem-1");

  const { data, isLoading, isError } = useClassRoster(classSubjectId, semesterId);

  return (
    <>
      <SiteHeader
        title={data ? `${data.header.subjectName} · Grade ${data.header.className}` : "Class"}
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <PageHeader eyebrow="Students" count={data?.students.length ?? 0} />
          <Select value={semesterId} onValueChange={setSemesterId}>
            <SelectTrigger className="w-full rounded-none sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sem-1">Semester 1</SelectItem>
              <SelectItem value="sem-2">Semester 2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Table>
            <TableSkeleton rows={8} columns={3} />
          </Table>
        ) : isError ? (
          <Card className="rounded-none shadow-none">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <AlertTriangle className="size-5 text-destructive" />
              <p className="text-sm text-muted-foreground">Couldn&apos;t load this class. Try again shortly.</p>
            </CardContent>
          </Card>
        ) : !data || data.students.length === 0 ? (
          <Card className="rounded-none shadow-none">
            <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
              No students in this class yet.
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-none shadow-none">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Student</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.students.map((student) => (
                    <TableRow
                      key={student.studentId}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/teacher/classes/${classSubjectId}/students/${student.studentId}?semester=${semesterId}`)
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8 rounded-none">
                            <AvatarFallback className="rounded-none bg-muted text-xs">
                              {initials(student.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{student.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">
                        {student.studentNumber}
                      </TableCell>
                      <TableCell className="text-sm">
                        {student.normalizedScore != null ? (
                          <span className="font-mono">{student.normalizedScore} / 100</span>
                        ) : (
                          <span className="text-muted-foreground">Not graded</span>
                        )}
                        {!student.isComplete && (
                          <span className="ml-2 text-[11px] text-amber-600">incomplete</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ArrowRight className="size-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
