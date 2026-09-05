import Link from "next/link";
import { BookOpen, Users, ChevronRight, CircleDot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { TeacherClassRow } from "@/hooks/use-teacher-classes";

export function ClassCard({ classRow }: { classRow: TeacherClassRow }) {
  return (
    <Link href={`/teacher/classes/${classRow.id}`} className="block group">
      <Card className="rounded-none shadow-none transition-colors group-hover:border-foreground/40">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between">
            <div className="flex size-9 items-center justify-center border bg-muted/40">
              <BookOpen className="size-4 text-muted-foreground" />
            </div>
            {classRow.isHomeroom && (
              <span
                className="inline-flex items-center gap-1 text-xs font-medium text-foreground"
                aria-label="Selected as homeroom"
                title="Selected as homeroom"
              >
                <CircleDot className="size-4" />
                Homeroom
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold leading-tight">
                {classRow.subjectName}
              </p>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Grade {classRow.className}
            </p>
          </div>

          <div className="flex items-center justify-between border-t pt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" />
              {classRow.studentCount} student
              {classRow.studentCount === 1 ? "" : "s"}
            </span>
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
