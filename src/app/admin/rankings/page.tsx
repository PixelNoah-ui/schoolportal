// app/admin/rankings/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useRankings } from "@/hooks/use-rankings";
import { ChevronRight, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { GradeBadge } from "@/components/admin/grade-badge";
import { RankIndicator } from "@/components/admin/rank-indicator";
import { StudentStatusBadge } from "@/components/admin/rankings/student-status-badge";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { EntityEmptyState } from "@/components/admin/entity-empty-state";
import PaginationBar from "@/components/PaginationBar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type Period,
  periodLabel,
  rankStudents,
  type RankedRow,
} from "@/lib/ranking-utils";
import type { ClassRow, RankingRow } from "@/lib/mock-data";

const PAGE_SIZE = 10;
const emptyRankingData: RankingRow[] = [];
const emptyClasses: ClassRow[] = [];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

export default function RankingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const academicYearParam = searchParams.get("year") ?? "";
  const period = (searchParams.get("period") ?? "sem1") as Period;
  const classFilter = searchParams.get("class") ?? "all";
  const searchParam = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const [searchInput, setSearchInput] = useState(searchParam);
  const debouncedSearch = useDebouncedValue(searchInput);
  const rankingsQuery = useRankings({
    academicYearId: academicYearParam || undefined,
    period,
    classId: classFilter,
    search: debouncedSearch,
  });
  const rankingData = rankingsQuery.data?.rankingData ?? emptyRankingData;
  const classes = rankingsQuery.data?.classes ?? emptyClasses;
  const academicYears = rankingsQuery.data?.academicYears ?? [];
  const currentAcademicYearRecord =
    academicYears.find((year) => year.is_current) ?? academicYears[0];
  const isLoading = rankingsQuery.isLoading;
  const activeAcademicYearId =
    academicYearParam || currentAcademicYearRecord?.id;
  const isArchivedYear =
    Boolean(currentAcademicYearRecord) &&
    activeAcademicYearId !== currentAcademicYearRecord.id;

  const rankedByClass = useMemo(() => {
    if (isArchivedYear) return [];
    return classes.map((c) => {
      const ranked = rankStudents(
        rankingData.filter((r) => r.classId === c.id),
        period,
      ).filter((r) => r.rank !== null);
      return {
        ...c,
        top5: ranked.slice(0, 5),
      };
    });
  }, [classes, isArchivedYear, period, rankingData]);

  const rankedFull = useMemo(
    () => (isArchivedYear ? [] : rankStudents(rankingData, period)),
    [isArchivedYear, period, rankingData],
  );

  const totalPage = Math.max(1, Math.ceil(rankedFull.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageRows = rankedFull.slice(pageStart, pageStart + PAGE_SIZE);

  const updateQuery = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams);
      if (!value || value === "all" || (key === "period" && value === "sem1"))
        next.delete(key);
      else next.set(key, value);
      if (key !== "page") next.delete("page");
      router.replace(`?${next.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (debouncedSearch !== searchParam) updateQuery("search", debouncedSearch);
  }, [debouncedSearch, searchParam, updateQuery]);

  return (
    <>
      <SiteHeader title="Rankings" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <PageHeader eyebrow="Student Rankings" />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              value={activeAcademicYearId ?? ""}
              onValueChange={(v) => {
                if (!v) return;
                updateQuery("year", v);
              }}
            >
              <SelectTrigger className="w-full rounded-none sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.name}
                    {y.is_current ? " (Current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Tabs
              value={period}
              onValueChange={(value) => updateQuery("period", value)}
            >
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
        </div>

        {isLoading ? (
          <Table>
            <TableSkeleton rows={8} columns={6} />
          </Table>
        ) : isArchivedYear ? (
          <div className="border px-4 py-10 text-center text-sm text-muted-foreground">
            No ranking data available for{" "}
            {academicYears.find((y) => y.id === activeAcademicYearId)?.name} in
            this preview.
          </div>
        ) : (
          <>
            <div className="border px-4 py-3 text-xs text-muted-foreground">
              Rankings are calculated from finalized grades for{" "}
              {periodLabel[period]}.
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2">
                <Trophy className="size-4 text-muted-foreground" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Top 5 · {periodLabel[period]}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {rankedByClass.map((c) => (
                  <Card key={c.id} className="rounded-none shadow-none">
                    <CardHeader className="flex-row items-center justify-between border-b pb-3">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Grade {c.grade}
                        </span>
                        <p className="text-sm font-semibold">
                          Section {c.section}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Finalized grades only
                        </p>
                      </div>
                      <Link
                        href={`/admin/rankings/${c.id}?period=${period}`}
                        className={buttonVariants({
                          variant: "ghost",
                          size: "sm",
                          className:
                            "rounded-none text-xs text-muted-foreground hover:text-foreground",
                        })}
                      >
                        View all
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </CardHeader>
                    <CardContent className="divide-y p-0">
                      {c.top5.map((s) => (
                        <div
                          key={s.studentId}
                          className="flex items-center gap-3 px-4 py-2.5"
                        >
                          <RankIndicator rank={s.rank as number} />
                          <Avatar className="size-7 rounded-none">
                            <AvatarFallback className="rounded-none bg-secondary text-[10px]">
                              {initials(s.studentName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="flex-1 truncate text-sm">
                            {s.studentName}
                          </span>
                          <span className="text-sm font-medium tabular-nums">
                            {s.score.toFixed(1)}
                          </span>
                        </div>
                      ))}
                      {c.top5.length === 0 && (
                        <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                          No ranked students in this class yet.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                All Students · {periodLabel[period]}
              </span>

              <DataToolbar
                searchValue={searchInput}
                onSearchChange={(v) => {
                  setSearchInput(v);
                }}
                searchPlaceholder="Search by student name"
                filterOptions={classes.map((c) => ({
                  label: `Grade ${c.grade} - ${c.section}`,
                  value: c.id,
                }))}
                filterValue={classFilter}
                onFilterChange={(value) => updateQuery("class", value)}
                filterLabel="All Classes"
              />

              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>{periodLabel[period]} Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((r: RankedRow) => (
                    <TableRow
                      key={r.studentId}
                      className={
                        r.rank !== null && r.rank <= 3
                          ? "bg-muted/30"
                          : undefined
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
                          <span className="text-sm font-medium">
                            {r.studentName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.className}
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
                            reason={r.standing.reason ?? ""}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {pageRows.length === 0 && (
                <EntityEmptyState
                  icon={Trophy}
                  entityLabel="student"
                  hasFilters={Boolean(searchParam) || classFilter !== "all"}
                  onClearFilters={() => {
                    setSearchInput("");
                    router.replace("?");
                  }}
                  description="Finalized student grades will appear here when ranking data is available."
                />
              )}
              {rankedFull.length > 0 && (
                <PaginationBar totalPage={totalPage} currentPage={page} />
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
