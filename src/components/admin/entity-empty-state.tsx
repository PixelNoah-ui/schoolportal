// components/admin/entity-empty-state.tsx
import { SearchX, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EntityEmptyStateProps {
  icon: LucideIcon;
  entityLabel: string; // singular, lowercase — "student", "teacher", "class"
  entityLabelPlural?: string; // defaults to entityLabel + "s"
  hasFilters: boolean;
  onClearFilters?: () => void;
  onAdd?: () => void;
  addLabel?: string; // defaults to "Add your first {entityLabel}"
  description?: string; // override the default copy if needed
}

export function EntityEmptyState({
  icon: Icon,
  entityLabel,
  entityLabelPlural = `${entityLabel}s`,
  hasFilters,
  onClearFilters,
  onAdd,
  addLabel,
  description,
}: EntityEmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center border-t py-16 text-center">
        <div className="flex size-11 items-center justify-center border bg-muted/40">
          <SearchX className="size-5 text-muted-foreground" />
        </div>
        <p className="mt-4 text-sm font-semibold">
          No {entityLabelPlural} match your search
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try a different name, or clear your filters to see everyone.
        </p>
        {onClearFilters && (
          <Button
            variant="outline"
            className="mt-5 rounded-none"
            onClick={onClearFilters}
          >
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center border-t py-16 text-center">
      <div className="flex size-11 items-center justify-center border border-primary/30 bg-primary/5">
        <Icon className="size-5 text-primary" />
      </div>
      <p className="mt-4 text-sm font-semibold">No {entityLabelPlural} yet</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {description ??
          `Once you add ${entityLabelPlural}, they'll show up here.`}
      </p>
      {onAdd && (
        <Button className="mt-5 rounded-none" onClick={onAdd}>
          {addLabel ?? `Add your first ${entityLabel}`}
        </Button>
      )}
    </div>
  );
}
