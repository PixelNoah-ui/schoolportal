// app/admin/rankings/page.tsx
"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronRight, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { GradeBadge } from "@/components/admin/grade-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { RankIndicator } from "@/components/admin/rank-indicator";

type Period = "sem1" | "sem2" | "final";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

function scoreFor(row: (typeof rankingData)[number], period: Period) {
  if (period === "sem1") return row.semester1;
  if (period === "sem2") return row.semester2;
  return (row.semester1 + row.semester2) / 2;
}

const periodLabel: Record<Period, string> = {
  sem1: "Semester 1",
  sem2: "Semester 2",
  final: "Final (Combined)",
};

export default function RankingsPage() {
  const [period, setPeriod] = useState<Period>("sem1");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const fullListRef = useRef<HTMLDivElement>(null);

  const rankedByClass = useMemo(() => {
    return classes.map((c) => {
      const ranked = rankingData
        .filter((r) => r.classId === c.id)
        .map((r) => ({ ...r, score: scoreFor(r, period) }))
        .sort((a, b) => b.score - a.score)
        .map((r, i) => ({ ...r, rank: i + 1 }));
      return { ...c, top5: ranked.slice(0, 5) };
    });
  }, [period]);

  const ranked = useMemo(() => {
    const scored = rankingData
      .filter((r) => classFilter === "all" || r.classId === classFilter)
      .filter((r) => r.studentName.toLowerCase().includes(search.toLowerCase()))
      .map((r) => ({ ...r, score: scoreFor(r, period) }))
      .sort((a, b) => b.score - a.score);

    return scored.map((r, i) => ({ ...r, rank: i + 1 }));
  }, [period, search, classFilter]);

  function viewClassInFullList(classId: string) {
    setClassFilter(classId);
    fullListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <SiteHeader title="Rankings" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <PageHeader eyebrow="Student Rankings" />
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
                    <p className="text-sm font-semibold">Section {c.section}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-none text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => viewClassInFullList(c.id)}
                  >
                    View all
                    <ChevronRight className="size-3.5" />
                  </Button>
                </CardHeader>
                <CardContent className="divide-y p-0">
                  {c.top5.map((s) => (
                    <div
                      key={s.studentId}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <RankIndicator rank={s.rank} />
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
                      No students in this class yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div ref={fullListRef} className="flex flex-col gap-4 scroll-mt-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              All Students · {periodLabel[period]}
            </span>
            {classFilter !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setClassFilter("all")}
              >
                Clear class filter
              </Button>
            )}
          </div>

          <DataToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by student name"
            filterOptions={classes.map((c) => ({
              label: `Grade ${c.grade} - ${c.section}`,
              value: c.id,
            }))}
            filterValue={classFilter}
            onFilterChange={setClassFilter}
            filterLabel="All Classes"
          />

          <Card className="rounded-none shadow-none">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>{periodLabel[period]} Score</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranked.map((r) => (
                    <TableRow
                      key={r.studentId}
                      className={r.rank <= 3 ? "bg-muted/30" : undefined}
                    >
                      <TableCell>
                        <RankIndicator rank={r.rank} />
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
                    </TableRow>
                  ))}
                  {ranked.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No students match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
