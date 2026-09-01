import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCardSkeleton() {
  return (
    <Card className="rounded-none border-border shadow-none">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3 w-24 rounded-none" />
          <Skeleton className="h-7 w-16 rounded-none" />
          <Skeleton className="h-3 w-28 rounded-none" />
        </div>
        <Skeleton className="size-9 shrink-0 rounded-none" />
      </CardContent>
    </Card>
  );
}
