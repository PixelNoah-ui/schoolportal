"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/admin/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { createClient } from "@/utils/supabase/client";

type AssessmentTypeRow = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

export default function AssessmentsPage() {
  const [rows, setRows] = useState<AssessmentTypeRow[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("assessment_types")
        .select("id, name, description, is_active")
        .order("name");
      setRows((data ?? []) as AssessmentTypeRow[]);
    };

    void load();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("assessment_types")
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        is_active: true,
      })
      .select("id, name, description, is_active")
      .single();
    if (data) {
      setRows((current) => [...current, data as AssessmentTypeRow]);
      setName("");
      setDescription("");
    }
  };

  return (
    <>
      <SiteHeader title="Assessments" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <PageHeader eyebrow="Assessment types" count={rows.length} />

        <Card className="rounded-none shadow-none">
          <CardHeader className="border-b pb-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Add assessment type
            </span>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-[1fr_1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="assessment-name">Name</Label>
              <Input
                id="assessment-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Quiz"
                className="rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assessment-description">Description</Label>
              <Input
                id="assessment-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Short description"
                className="rounded-none"
              />
            </div>
            <div className="flex items-end">
              <Button
                className="rounded-none"
                onClick={handleCreate}
                disabled={!name.trim()}
              >
                Save
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.length === 0 ? (
            <div className="rounded-none border border-dashed p-6 text-sm text-muted-foreground">
              No assessment types configured yet.
            </div>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="rounded-none border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{row.name}</p>
                  <Badge className="rounded-none">
                    {row.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {row.description ?? "No description"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
