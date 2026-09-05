"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Layers, Search, X } from "lucide-react";
import { SiteHeader } from "@/components/teacher/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { ClassCard } from "@/components/teacher/class-card";
import { NoClassesEmptyState } from "@/components/teacher/no-classes-empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTeacherClasses } from "@/hooks/use-teacher-classes";

export default function TeacherClassesPage() {
  const { data = [], isLoading, isError, error, refetch } = useTeacherClasses();
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);

  const subjects = useMemo(
    () => Array.from(new Set(data.map((row) => row.subjectName))).sort(),
    [data],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.filter((row) => {
      const matchesTerm =
        !term ||
        row.subjectName.toLowerCase().includes(term) ||
        row.className.toLowerCase().includes(term);
      const matchesSubject =
        !subjectFilter || row.subjectName === subjectFilter;
      return matchesTerm && matchesSubject;
    });
  }, [data, search, subjectFilter]);

  const hasActiveFilters = search.trim().length > 0 || subjectFilter !== null;

  return (
    <>
      <SiteHeader title="My Classes" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <PageHeader eyebrow="Assigned classes" count={data.length} />

        {data.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search subject or class"
                className="rounded-none pl-8 pr-8"
              />
              {search && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Clear search"
                  className="absolute right-0 top-0 size-8 rounded-none text-muted-foreground hover:text-foreground"
                  onClick={() => setSearch("")}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>

            {subjects.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSubjectFilter(null)}
                  className={cn(
                    "border px-2.5 py-1 text-xs font-medium transition-colors",
                    subjectFilter === null
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                  )}
                >
                  All subjects
                </button>
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() =>
                      setSubjectFilter(
                        subject === subjectFilter ? null : subject,
                      )
                    }
                    className={cn(
                      "border px-2.5 py-1 text-xs font-medium transition-colors",
                      subjectFilter === subject
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                    )}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="rounded-none shadow-none">
                <CardContent className="space-y-4 p-5">
                  <Skeleton className="size-9 rounded-none" />
                  <Skeleton className="h-4 w-2/3 rounded-none" />
                  <Skeleton className="h-3 w-1/3 rounded-none" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card className="rounded-none shadow-none">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertTriangle className="size-6 text-destructive" />
              <p className="text-sm font-semibold">Could not load classes</p>
              <p className="max-w-md text-xs text-muted-foreground">
                {error instanceof Error ? error.message : "Please try again."}
              </p>
              <Button
                type="button"
                variant="outline"
                className="rounded-none"
                onClick={() => refetch()}
              >
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : data.length === 0 ? (
          <NoClassesEmptyState />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center border-t py-16 text-center">
            <div className="flex size-11 items-center justify-center border bg-muted/40">
              <Layers className="size-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-semibold">
              No classes match your filters
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different subject or class name.
            </p>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3 rounded-none text-muted-foreground"
                onClick={() => {
                  setSearch("");
                  setSubjectFilter(null);
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((classRow) => (
              <ClassCard key={classRow.id} classRow={classRow} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
