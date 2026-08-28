// app/admin/rankings/[classId]/page.tsx
"use client";

import { use, useMemo, useState } from "react";
import { notFound, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { GradeBadge } from "@/components/admin/grade-badge";
import { RankIndicator } from "@/components/admin/rank-indicator";
import { StudentStatusBadge } from "@/components/admin/rankings/student-status-badge";
import { CompletionBanner } from "@/components/admin/rankings/completion-banner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { rankingData, classes } from "@/lib/mock-data";
import {
  type Period,
  periodLabel,
  rankStudents,
  getClassCompletion,
} from "@/utils/supabase/ranking-utils";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

export default function ClassRankingPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);
  const klass = classes.find((c) => c.id === classId);
  const searchParams = useSearchParams();
  const initialPeriod = (searchParams.get("period") as Period) ?? "sem1";

  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const ranked = useMemo(() => {
    if (!klass) return [];
    return rankStudents(
      rankingData.filter(
        (r) =>
          r.classId === klass.id &&
          r.studentName.toLowerCase().includes(debouncedSearch.toLowerCase()),
      ),
      period,
    );
  }, [klass, period, debouncedSearch]);

  const completion = klass ? getClassCompletion(klass.id, period) : null;

  if (!klass) notFound();

  return (
    <>
      <SiteHeader title={`Grade ${klass.grade} - ${klass.section}`} />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/rankings"
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
                className:
                  "mb-2 -ml-2 rounded-none text-xs text-muted-foreground hover:text-foreground",
              })}
            >
              <ArrowLeft className="size-3.5" />
              All rankings
            </Link>
            <h2 className="text-lg font-semibold tracking-tight">
              Grade {klass.grade} - Section {klass.section}
            </h2>
            <p className="text-sm text-muted-foreground">
              {klass.studentCount} students · Class teacher {klass.teacher}
            </p>
          </div>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList className="rounded-none">
              <TabsTrigger value="sem1" className="rounded-none">
                Semester 1
              </TabsTrigger>
              <TabsTrigger value="sem2" className="rounded-none">
                Semester 2
              </TabsTrigger>
              <TabsTrigger value="final" className="rounded-none">
                Final
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {completion && (
          <CompletionBanner
            period={period}
            percent={completion.percent}
            pendingCount={completion.pending.length}
          />
        )}

        {completion && completion.pending.length > 0 && (
          <div className="border px-4 py-3 text-xs text-muted-foreground">
            Waiting on:{" "}
            {completion.pending
              .map((p) => `${p.subjectName} (${p.teacher})`)
              .join(", ")}
          </div>
        )}

        <DataToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by student name"
        />

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>{periodLabel[period]} Score</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranked.map((r) => (
              <TableRow
                key={r.studentId}
                className={
                  r.rank !== null && r.rank <= 3 ? "bg-muted/30" : undefined
                }
              >
                <TableCell>
                  {r.rank !== null ? (
                    <RankIndicator rank={r.rank} />
                  ) : (
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      NR
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8 rounded-none">
                      <AvatarFallback className="rounded-none bg-secondary text-xs">
                        {initials(r.studentName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{r.studentName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-semibold tabular-nums">
                  {r.score.toFixed(1)}%
                </TableCell>
                <TableCell>
                  <GradeBadge score={r.score} />
                </TableCell>
                <TableCell>
                  {r.standing.standing ? (
                    <StudentStatusBadge
                      standing={r.standing.standing}
                      reason={r.standing.reason}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {ranked.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No students match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
