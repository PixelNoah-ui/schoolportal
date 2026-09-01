"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PasswordCell({ value }: { value: string | null | undefined }) {
  const [visible, setVisible] = useState(false);

  if (!value) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs text-muted-foreground">
        {visible ? value : "•".repeat(Math.min(value.length, 8))}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
      </Button>
    </div>
  );
}
