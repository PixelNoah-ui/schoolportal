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

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "date" | "select" | "radio";
  options?: FieldOption[];
  fullWidth?: boolean;
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
  columns?: 1 | 2;
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
  columns = 1,
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
        <div
          className={`grid gap-4 py-2 ${columns === 2 ? "sm:grid-cols-2" : "grid-cols-1"}`}
        >
          {fields.map((f) => (
            <div
              key={f.name}
              className={`space-y-2 ${columns === 2 && f.fullWidth ? "sm:col-span-2" : ""}`}
            >
              <Label htmlFor={f.name}>{f.label}</Label>
              {f.type === "radio" ? (
                <div className="flex gap-5 pt-1">
                  {(f.options ?? []).map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="radio"
                        name={f.name}
                        value={option.value}
                        checked={values[f.name] === option.value}
                        disabled={readOnly}
                        onChange={(e) =>
                          setValues((prev) => ({
                            ...prev,
                            [f.name]: e.target.value,
                          }))
                        }
                        className="size-4 accent-primary"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              ) : f.type === "select" ? (
                <select
                  id={f.name}
                  value={values[f.name] ?? ""}
                  disabled={readOnly}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [f.name]: e.target.value }))
                  }
                  className="flex h-10 w-full rounded-none border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select {f.label}</option>
                  {(f.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
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
              )}
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
                  {submitLabel ??
                    (mode === "add" ? "Creating..." : "Saving...")}
                </>
              ) : (
                (submitLabel ?? (mode === "add" ? "Create" : "Save changes"))
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
