// components/teacher/score-cell.tsx
"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function scoreToGrade(score: number) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

const GRADE_STYLES: Record<string, string> = {
  A: "border-emerald-600 text-emerald-700 dark:text-emerald-400",
  B: "border-blue-600 text-blue-700 dark:text-blue-400",
  C: "border-amber-600 text-amber-700 dark:text-amber-400",
  D: "border-orange-600 text-orange-700 dark:text-orange-400",
  F: "border-destructive text-destructive",
};

interface ScoreCellProps {
  value: number | null;
  onSave: (score: number) => Promise<unknown>;
  disabled?: boolean;
}

export function ScoreCell({ value, onSave, disabled }: ScoreCellProps) {
  const [draft, setDraft] = useState(value === null ? "" : String(value));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  // Keep the draft in sync when `value` changes for reasons outside this
  // component (e.g. switching semester, or a refetch after another cell's
  // save). This is the React-recommended "adjust state during render"
  // pattern rather than an effect, since it needs to happen before paint.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(value === null ? "" : String(value));
  }

  async function commit() {
    if (draft.trim() === "") return;
    const parsed = Number(draft);

    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      setStatus("error");
      setError("0–100");
      return;
    }

    if (value !== null && parsed === value) {
      setStatus("idle");
      return;
    }

    setStatus("saving");
    setError(null);
    try {
      await onSave(parsed);
      setStatus("saved");
      setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 1500);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  const numeric = draft.trim() === "" ? null : Number(draft);
  const grade =
    numeric !== null && !Number.isNaN(numeric) && numeric >= 0 && numeric <= 100
      ? scoreToGrade(numeric)
      : null;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Input
          type="number"
          min={0}
          max={100}
          inputMode="decimal"
          value={draft}
          disabled={disabled}
          onChange={(event) => {
            setDraft(event.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          placeholder="—"
          className={cn(
            "w-20 rounded-none pr-7 text-right tabular-nums",
            status === "error" &&
              "border-destructive focus-visible:ring-destructive/40",
          )}
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
          {status === "saving" ? (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          ) : status === "saved" ? (
            <Check className="size-3.5 text-emerald-600" />
          ) : null}
        </span>
      </div>
      {grade ? (
        <Badge
          variant="outline"
          className={cn(
            "rounded-none font-mono font-semibold",
            GRADE_STYLES[grade],
          )}
        >
          {grade}
        </Badge>
      ) : null}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
