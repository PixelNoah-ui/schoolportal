// components/admin/page-header.tsx
import { Button } from "@/components/ui/button";
import { Plus, type LucideIcon } from "lucide-react";

interface PageHeaderProps {
  eyebrow: string;
  count?: number;
  actionLabel?: string;
  actionIcon?: LucideIcon;
}

export function PageHeader({
  eyebrow,
  count,
  actionLabel,
  actionIcon: Icon = Plus,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {eyebrow}
        </span>
        {typeof count === "number" && (
          <p className="mt-1 text-sm text-muted-foreground">
            {count} total records
          </p>
        )}
      </div>
      {actionLabel && (
        <Button className="rounded-none">
          <Icon className="size-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
