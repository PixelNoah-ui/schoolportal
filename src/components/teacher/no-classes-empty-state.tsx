// components/teacher/no-classes-empty-state.tsx
import { Layers } from "lucide-react";

export function NoClassesEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="flex size-11 items-center justify-center border border-primary/30 bg-primary/5">
        <Layers className="size-5 text-primary" />
      </div>
      <p className="mt-4 text-sm font-semibold">No classes assigned yet</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Once an admin assigns you to a subject and class, it will show up here
        with your student roster and gradebook.
      </p>
    </div>
  );
}
