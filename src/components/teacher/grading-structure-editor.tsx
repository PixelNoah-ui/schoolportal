"use client";

import { useMemo, useState } from "react";
import { Lock, Plus, Trash2, Pencil, Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  DraftComponent,
  GradingComponent,
} from "@/hooks/use-grading-structure";

export function GradingStructureEditor({
  components,
  isLocked,
  isSaving,
  onSave,
}: {
  components: GradingComponent[];
  isLocked: boolean;
  isSaving: boolean;
  onSave: (components: DraftComponent[]) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<DraftComponent[]>(() =>
    toDraft(components),
  );

  const total = useMemo(
    () => draft.reduce((sum, c) => sum + (Number(c.maxScore) || 0), 0),
    [draft],
  );
  const canSave = total > 0 && draft.every((c) => c.name.trim().length > 0);

  const startEditing = () => {
    setDraft(toDraft(components));
    setIsEditing(true);
  };

  const updateRow = (index: number, patch: Partial<DraftComponent>) => {
    setDraft((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const removeRow = (index: number) => {
    setDraft((rows) =>
      rows
        .filter((_, i) => i !== index)
        .map((row, i) => ({ ...row, orderNumber: i + 1 })),
    );
  };

  const addRow = () => {
    setDraft((rows) => [
      ...rows,
      { name: "", maxScore: 0, orderNumber: rows.length + 1 },
    ]);
  };

  const handleSave = () => {
    onSave(draft);
    setIsEditing(false);
  };

  if (isLocked) {
    return (
      <Card className="rounded-none shadow-none border-muted-foreground/30 bg-muted/30">
        <CardContent className="flex items-center gap-3 p-4 text-sm">
          <Lock className="size-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium">Grading structure locked</p>
            <p className="text-muted-foreground">
              This structure can&apos;t be changed because grades have already
              been submitted for it.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-none shadow-none">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
        <p className="text-sm font-semibold">Grading structure</p>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-none"
            onClick={startEditing}
          >
            <Pencil className="size-3.5" />
            Edit structure
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-4">
        {(isEditing ? draft : toDraft(components)).map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Input
                  value={row.name}
                  onChange={(e) => updateRow(index, { name: e.target.value })}
                  placeholder="Component name"
                  className="h-8 rounded-none"
                />
                <Input
                  type="number"
                  value={row.maxScore}
                  onChange={(e) =>
                    updateRow(index, { maxScore: Number(e.target.value) })
                  }
                  className="h-8 w-20 rounded-none"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-none text-muted-foreground hover:text-destructive"
                  onClick={() => removeRow(index)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </>
            ) : (
              <div className="flex w-full items-center justify-between text-sm">
                <span>{row.name}</span>
                <span className="font-mono text-muted-foreground">
                  {row.maxScore}
                </span>
              </div>
            )}
          </div>
        ))}

        {isEditing && (
          <Button
            variant="ghost"
            size="sm"
            className="w-fit rounded-none"
            onClick={addRow}
          >
            <Plus className="size-3.5" />
            Add component
          </Button>
        )}

        <div className="flex items-center justify-between border-t pt-3 text-sm">
          <span className="font-medium">Total</span>
          <span
            className={`font-mono font-semibold ${
              !isEditing
                ? "text-foreground"
                : total > 0
                  ? "text-emerald-600"
                  : "text-amber-600"
            }`}
          >
            {isEditing ? total : components.reduce((s, c) => s + c.maxScore, 0)}{" "}
            total marks
          </span>
        </div>

        {isEditing && total <= 0 && (
          <p className="text-xs text-amber-600">
            Add at least one component with a positive maximum score.
          </p>
        )}

        {isEditing && (
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="rounded-none"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="rounded-none"
              disabled={!canSave || isSaving}
              onClick={handleSave}
            >
              <Check className="size-3.5" />
              {isSaving ? "Saving..." : "Save structure"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function toDraft(components: GradingComponent[]): DraftComponent[] {
  return components.map((c) => ({
    name: c.name,
    maxScore: c.maxScore,
    orderNumber: c.orderNumber,
  }));
}
