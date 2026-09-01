"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-4">
          <span className="text-6xl font-semibold tabular-nums leading-none sm:text-7xl">
            404
          </span>
          <div className="h-14 w-px bg-border sm:h-16" />
          <div className="flex size-14 items-center justify-center border border-border text-muted-foreground sm:size-16">
            <Search className="size-6" />
          </div>
        </div>

        <div className="max-w-sm space-y-1.5">
          <h1 className="text-lg font-semibold">
            We couldn&apos;t find that page
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            It may have been moved, renamed, or never existed. Double-check the
            link, or head back to somewhere that does.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="rounded-none"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
          Go back
        </Button>
        <Link
          href="/admin"
          className={cn(
            buttonVariants({ variant: "default", size: "default" }),
            "rounded-none",
          )}
        >
          <Home className="size-4" />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
