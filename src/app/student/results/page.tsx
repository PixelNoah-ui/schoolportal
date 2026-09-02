"use client";

import { useState } from "react";
import { AlertTriangle, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentSiteHeader } from "@/components/student/site-header";
import {
  useStudentFilterOptions,
  useStudentResults,
} from "@/hooks/use-student-portal";

export default function StudentResultsPage() {
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const options = useStudentFilterOptions();
  const results = useStudentResults({
    academicYearId: year || undefined,
    semesterId: semester || undefined,
  });
  const resultError =
    results.error instanceof Error
      ? results.error.message
      : "Please try again later.";
  const optionsError =
    options.error instanceof Error ? options.error.message : null;

  return (
    <>
      <StudentSiteHeader
        title="My Results"
        subtitle="Your academic performance"
      />
      <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Academic record
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              Results
            </h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={year}
              onValueChange={(value) => setYear(value ?? "")}
            >
              <SelectTrigger className="w-full rounded-none sm:w-48">
                <SelectValue placeholder="All years" />
              </SelectTrigger>
              <SelectContent>
                {options.data?.years.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={semester}
              onValueChange={(value) => setSemester(value ?? "")}
            >
              <SelectTrigger className="w-full rounded-none sm:w-40">
                <SelectValue placeholder="All semesters" />
              </SelectTrigger>
              <SelectContent>
                {options.data?.semesters
                  .filter((item) => !year || item.academicYearId === year)
                  .map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {results.isError ? (
          <Card className="rounded-none shadow-none">
            <CardContent className="flex flex-col items-center gap-3 p-6 text-sm text-destructive">
              <AlertTriangle className="size-5" />
              <p>Unable to load your results.</p>
              <p className="max-w-2xl break-words text-center text-xs text-muted-foreground">
                {resultError}
              </p>
            </CardContent>
          </Card>
        ) : results.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <Card key={item} className="rounded-none shadow-none">
                <CardContent className="space-y-3 p-5">
                  <Skeleton className="h-5 w-40 rounded-none" />
                  <Skeleton className="h-4 w-28 rounded-none" />
                  <Skeleton className="h-12 w-full rounded-none" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : results.data?.length === 0 ? (
          <Card className="rounded-none shadow-none">
            <CardContent className="flex flex-col items-center gap-2 p-12 text-center">
              <BookOpen className="size-8 text-muted-foreground" />
              <p className="font-semibold">No results yet</p>
              <p className="text-sm text-muted-foreground">
                Published results will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {results.data?.map((result) => (
              <Card key={result.id} className="rounded-none shadow-none">
                <CardHeader className="border-b">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{result.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {result.className} · {result.semester} ·{" "}
                        {result.academicYear}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold">
                        {result.score ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        out of {result.maxScore}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-5">
                  {result.components.map((component) => (
                    <div
                      key={component.name}
                      className="flex items-center justify-between border-b pb-2 text-sm last:border-0"
                    >
                      <span>
                        {component.name}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {component.status}
                        </span>
                      </span>
                      <span className="font-medium">
                        {component.score ?? "—"} / {component.maxScore}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {optionsError && (
          <p className="text-xs text-muted-foreground">
            Filter options unavailable: {optionsError}
          </p>
        )}
      </main>
    </>
  );
}
