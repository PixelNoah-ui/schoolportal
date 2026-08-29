// app/admin/rankings/[classId]/page.tsx
"use client";

import {
  Suspense,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  notFound,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { GradeBadge } from "@/components/admin/grade-badge";
import { RankIndicator } from "@/components/admin/rank-indicator";
import { StudentStatusBadge } from "@/components/admin/rankings/student-status-badge";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { EntityEmptyState } from "@/components/admin/entity-empty-state";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import PaginationBar from "@/components/PaginationBar";
import { useRankings } from "@/hooks/use-rankings";
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
import { type Period, periodLabel, rankStudents } from "@/lib/ranking-utils";
import type { RankingRow } from "@/lib/mock-data";

const emptyRankingData: RankingRow[] = [];
const emptyClasses: {
  id: string;
  name: string;
  grade: number;
  section: string;
  studentCount: number;
  teacher: string;
}[] = [];
const PAGE_SIZE = 10;

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

// `useSearchParams()` requires a Suspense boundary around whatever reads it,
// or Next.js bails the route out of static rendering at build time. The
// `use(params)` call for the dynamic segment doesn't need this — only the
// search-params hook does — so this is split into a thin wrapper + the
// actual page body.
export default function ClassRankingPageWrapper({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <ClassRankingPage params={params} />
    </Suspense>
  );
}

function ClassRankingPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParam = searchParams.get("search") ?? "";
  const period =
    searchParams.get("period") === "sem1" ||
    searchParams.get("period") === "sem2" ||
    searchParams.get("period") === "final"
      ? (searchParams.get("period") as Period)
      : "sem1";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const [searchInput, setSearchInput] = useState(searchParam);
  const debouncedSearch = useDebouncedValue(searchInput);
  const rankingsQuery = useRankings({
    period,
    classId,
    search: debouncedSearch,
  });
  const rankingData = rankingsQuery.data?.rankingData ?? emptyRankingData;
  const classes = rankingsQuery.data?.classes ?? emptyClasses;
  const klass = classes.find((c) => c.id === classId);

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
  }, [debouncedSearch, klass, period, rankingData]);

  const updateQuery = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams);
      if (!value || (key === "period" && value === "sem1")) next.delete(key);
      else next.set(key, value);
      if (key !== "page") next.delete("page");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (debouncedSearch !== searchParam) updateQuery("search", debouncedSearch);
  }, [debouncedSearch, searchParam, updateQuery]);

  function handlePeriodChange(value: string) {
    updateQuery("period", value as Period);
  }

  if (rankingsQuery.isLoading) {
    return (
      <>
        <SiteHeader title="Rankings" />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <Table>
            <TableSkeleton rows={8} columns={5} />
          </Table>
        </div>
      </>
    );
  }

  if (!klass) notFound();

  const totalPage = Math.max(1, Math.ceil(ranked.length / PAGE_SIZE));
  const pageRows = ranked.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          <Tabs value={period} onValueChange={handlePeriodChange}>
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

        <div className="border px-4 py-3 text-xs text-muted-foreground">
          Rankings are calculated from finalized grades for{" "}
          {periodLabel[period]}.
        </div>

        <DataToolbar
          searchValue={searchInput}
          onSearchChange={(value) => {
            setSearchInput(value);
          }}
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
            {pageRows.map((r) => (
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
                      reason={r.standing.reason ?? ""}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
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
            hasFilters={Boolean(searchParam)}
            onClearFilters={
              Boolean(searchParam)
                ? () => {
                    setSearchInput("");
                    router.replace(pathname);
                  }
                : undefined
            }
            description="Finalized student grades will appear here when ranking data is available."
          />
        )}
        {pageRows.length > 0 && (
          <PaginationBar totalPage={totalPage} currentPage={page} />
        )}
      </div>
    </>
  );
}
