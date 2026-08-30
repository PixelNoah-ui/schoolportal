// components/admin/entity-form-dialog.tsx
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface FieldConfig {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "date";
}

interface EntityFormDialogProps {
  mode: "add" | "edit" | "view";
  title: string;
  description?: string;
  fields?: FieldConfig[];
  initialValues?: Record<string, string>;
  onSubmit: (values: Record<string, string>) => Promise<unknown> | unknown;
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function EntityFormDialog({
  mode,
  title,
  description,
  fields = [],
  initialValues,
  onSubmit,
  trigger,
  open: controlledOpen,
  onOpenChange,
  isLoading = false,
  submitLabel,
}: EntityFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((f) => [f.name, initialValues?.[f.name] ?? ""]),
    ),
  );
  const readOnly = mode === "view";

  async function handleSubmit() {
    if (isLoading) return;
    await Promise.resolve(onSubmit(values));
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="rounded-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {fields.map((f) => (
            <div key={f.name} className="space-y-2">
              <Label htmlFor={f.name}>{f.label}</Label>
              <Input
                id={f.name}
                type={f.type ?? "text"}
                value={values[f.name]}
                disabled={readOnly}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [f.name]: e.target.value }))
                }
                className="rounded-none"
              />
            </div>
          ))}
        </div>
        {!readOnly && (
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-none"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="rounded-none"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {submitLabel ?? (mode === "add" ? "Creating..." : "Saving...")}
                </>
              ) : (
                submitLabel ?? (mode === "add" ? "Create" : "Save changes")
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
