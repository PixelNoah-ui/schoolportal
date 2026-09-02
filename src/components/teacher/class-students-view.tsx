// components/teacher/class-students-view.tsx
"use client";

import { useState } from "react";
import { ChevronLeft, Users, AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export interface StudentGradeItem {
  id: string;
  studentId: string;
  studentName: string;
  email: string;
  grade?: number | null;
  classSubjectId: string;
}

export interface ClassStudentsViewProps {
  className: string;
  subjectName: string;
  students: StudentGradeItem[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onBack?: () => void;
  onGradeChange?: (studentId: string, grade: number | null) => void;
  onSaveGrades?: () => void;
  isSaving?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ClassStudentsView({
  className,
  subjectName,
  students,
  isLoading = false,
  isError = false,
  error = null,
  onBack,
  onGradeChange,
  onSaveGrades,
  isSaving = false,
}: ClassStudentsViewProps) {
  const [grades, setGrades] = useState<Record<string, number | null>>(
    students.reduce(
      (acc, s) => ({
        ...acc,
        [s.studentId]: s.grade || null,
      }),
      {},
    ),
  );

  const handleGradeChange = (studentId: string, value: string) => {
    const numValue =
      value === "" ? null : Math.max(0, Math.min(100, parseFloat(value) || 0));
    setGrades({ ...grades, [studentId]: numValue });
    onGradeChange?.(studentId, numValue);
  };

  if (isLoading) {
    return (
      <Card className="rounded-none shadow-none border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="rounded-none"
              >
                <ChevronLeft className="size-4" />
              </Button>
            )}
            <div className="flex-1">
              <CardTitle className="text-base">{className}</CardTitle>
              <p className="text-xs text-muted-foreground">{subjectName}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-none" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="rounded-none shadow-none border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="rounded-none"
              >
                <ChevronLeft className="size-4" />
              </Button>
            )}
            <div className="flex-1">
              <CardTitle className="text-base">{className}</CardTitle>
              <p className="text-xs text-muted-foreground">{subjectName}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-8">
            <AlertTriangle className="size-8 text-destructive" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Could not load students
              </p>
              {error && (
                <p className="text-xs text-muted-foreground mt-1">
                  {error.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (students.length === 0) {
    return (
      <Card className="rounded-none shadow-none border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="rounded-none"
              >
                <ChevronLeft className="size-4" />
              </Button>
            )}
            <div className="flex-1">
              <CardTitle className="text-base">{className}</CardTitle>
              <p className="text-xs text-muted-foreground">{subjectName}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="size-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No students enrolled in this class
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none shadow-none border-border">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-none"
            >
              <ChevronLeft className="size-4" />
            </Button>
          )}
          <div className="flex-1">
            <CardTitle className="text-base">{className}</CardTitle>
            <p className="text-xs text-muted-foreground">{subjectName}</p>
          </div>
          {onSaveGrades && (
            <Button
              type="button"
              onClick={onSaveGrades}
              disabled={isSaving}
              className="rounded-none"
            >
              {isSaving ? "Saving..." : "Save Grades"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="border rounded-none border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="font-semibold">Student</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Grade (0-100)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student, index) => (
                <TableRow
                  key={student.studentId}
                  className={index % 2 === 0 ? "bg-muted/30" : "bg-background"}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8 rounded-none">
                        <AvatarFallback className="text-xs font-medium">
                          {getInitials(student.studentName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {student.studentName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {student.email}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={grades[student.studentId] ?? ""}
                      onChange={(e) =>
                        handleGradeChange(student.studentId, e.target.value)
                      }
                      placeholder="Enter grade"
                      className="rounded-none w-24 h-9"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
