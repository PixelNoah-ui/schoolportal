"use client";

import { useMemo, useState } from "react";
import { Layers, Search, X } from "lucide-react";
import { SiteHeader } from "@/components/teacher/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { ClassCard } from "@/components/teacher/class-card";
import { NoClassesEmptyState } from "@/components/teacher/no-classes-empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTeacherClasses } from "@/hooks/use-teacher-classes";

export default function TeacherClassesPage() {
  const { data = [], isLoading } = useTeacherClasses();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data;
    return data.filter(
      (row) =>
        row.subjectName.toLowerCase().includes(term) || row.className.toLowerCase().includes(term),
    );
  }, [data, search]);

  return (
    <>
      <SiteHeader title="My Classes" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <PageHeader eyebrow="Assigned classes" count={data.length} />

        {data.length > 0 && (
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
        ) : data.length === 0 ? (
          <NoClassesEmptyState />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center border-t py-16 text-center">
            <div className="flex size-11 items-center justify-center border bg-muted/40">
              <Layers className="size-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-semibold">No classes match your search</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different subject or class name.</p>
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
