"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StudentSiteHeader } from "@/components/student/site-header";
import { Button } from "@/components/ui/button";
import { useStudentResults } from "@/hooks/use-student-portal";

type ResultComponent = {
  name: string;
  score: number | null;
  maxScore: number;
  status: string;
};

type ResultRow = {
  id: string;
  subject: string;
  className: string;
  semester: string;
  academicYear: string;
  score: number | null;
  maxScore: number;
  components: ResultComponent[];
};

// Sums only graded (non-null) components. isComplete is true only when
// EVERY component of the subject has a score — that's the signal that
// decides whether we show a real total or "—".
function componentTotals(components: ResultComponent[]) {
  const graded = components.filter((c) => c.score !== null);
  const scoreSum = graded.reduce((sum, c) => sum + (c.score ?? 0), 0);
  const maxSum = graded.reduce((sum, c) => sum + c.maxScore, 0);
  const isComplete =
    components.length > 0 && graded.length === components.length;
  return {
    scoreSum,
    maxSum,
    isComplete,
    gradedCount: graded.length,
    totalCount: components.length,
  };
}

function SubjectRow({ result }: { result: ResultRow }) {
  const [open, setOpen] = useState(false);
  const totals = componentTotals(result.components);

  return (
    <>
      <TableRow
        className="cursor-pointer select-none hover:bg-muted/40"
        onClick={() => setOpen((value) => !value)}
      >
        <TableCell className="w-8">
          {open ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell className="font-medium">{result.subject}</TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {result.className}
        </TableCell>
        <TableCell className="text-right font-medium tabular-nums">
          {totals.isComplete ? `${totals.scoreSum} / ${totals.maxSum}` : "—"}
        </TableCell>
      </TableRow>
      {open && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={4} className="bg-muted/20 p-0">
            <div className="p-4">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Result details</TableHead>
                    <TableHead className="w-[20%]">Status</TableHead>
                    <TableHead className="w-[20%] text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.components.map((component, index) => (
                    <TableRow
                      key={`${component.name}-${index}`}
                      className="hover:bg-transparent"
                    >
                      <TableCell className="text-sm">
                        {component.name}
                      </TableCell>
                      <TableCell className="text-xs capitalize text-muted-foreground">
                        {component.status}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {component.score ?? "—"} / {component.maxScore}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function SemesterSection({
  academicYear,
  semester,
  rows,
}: {
  academicYear: string;
  semester: string;
  rows: ResultRow[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="rounded-none shadow-none">
      <CardHeader className="flex flex-col gap-4 border-b bg-muted/30 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">{semester}</p>
          <p className="text-xs text-muted-foreground">{academicYear}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-none"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Hide" : "Details"}
        </Button>
      </CardHeader>
      {open && (
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8" />
                <TableHead className="w-[34%]">Subject</TableHead>
                <TableHead className="w-[28%]">Class</TableHead>
                <TableHead className="text-right">Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((result) => (
                <SubjectRow key={result.id} result={result} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
}

export default function StudentResultsPage() {
  const results = useStudentResults({});

  const resultError =
    results.error instanceof Error
      ? results.error.message
      : "Please try again later.";
  const data = useMemo<ResultRow[]>(() => results.data ?? [], [results.data]);

  // Group flat subject rows into per-semester sections. NOTE: this assumes
  // fetchStudentResults returns rows already ordered chronologically by
  // semester — if not, groups here will render in whatever order the API
  // returns them in.
  const groups = useMemo(() => {
    const map = new Map<
      string,
      { academicYear: string; semester: string; rows: ResultRow[] }
    >();
    for (const row of data) {
      const key = `${row.academicYear}__${row.semester}`;
      const group = map.get(key) ?? {
        academicYear: row.academicYear,
        semester: row.semester,
        rows: [],
      };
      group.rows.push(row);
      map.set(key, group);
    }
    return [...map.values()];
  }, [data]);

  return (
    <>
      <StudentSiteHeader
        title="My Results"
        subtitle="Your academic performance"
      />
      <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-6">
        <div>
          <div>
            {data[0]?.className && (
              <p className="mb-2 text-sm font-semibold text-muted-foreground">
                Grade and section: {data[0].className}
              </p>
            )}
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Academic record
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              Results
            </h2>
          </div>
        </div>

        {results.isError && (
          <Card className="rounded-none shadow-none">
            <CardContent className="flex flex-col items-center gap-3 p-6 text-sm text-destructive">
              <AlertTriangle className="size-5" />
              <p>Unable to load your results.</p>
              <p className="max-w-2xl wrap-break-word text-center text-xs text-muted-foreground">
                {resultError}
              </p>
            </CardContent>
          </Card>
        )}

        {!results.isError && results.isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-none" />
            ))}
          </div>
        )}

        {!results.isError && !results.isLoading && data.length === 0 && (
          <Card className="rounded-none shadow-none">
            <CardContent className="flex flex-col items-center gap-2 p-12 text-center">
              <BookOpen className="size-8 text-muted-foreground" />
              <p className="font-semibold">No results yet</p>
              <p className="text-sm text-muted-foreground">
                Published results will appear here.
              </p>
            </CardContent>
          </Card>
        )}

        {!results.isError && !results.isLoading && data.length > 0 && (
          <div className="space-y-4">
            {groups.map((group) => (
              <SemesterSection
                key={`${group.academicYear}__${group.semester}`}
                academicYear={group.academicYear}
                semester={group.semester}
                rows={group.rows}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
