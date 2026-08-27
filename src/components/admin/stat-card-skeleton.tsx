// components/admin/stat-card-skeleton.tsx
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCardSkeleton() {
  return (
    <Card className="rounded-none p-5 shadow-none">
      <Skeleton className="h-3 w-24 rounded-none" />
      <Skeleton className="mt-3 h-8 w-16 rounded-none" />
      <Skeleton className="mt-2 h-3 w-20 rounded-none" />
    </Card>
  );
}
