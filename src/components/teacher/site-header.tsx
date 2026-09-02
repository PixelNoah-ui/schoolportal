// components/teacher/site-header.tsx
import { Bell } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export function SiteHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex flex-col leading-tight">
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {subtitle ? (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        ) : null}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Button variant="outline" size="icon" className="rounded-none">
          <Bell className="size-4" />
        </Button>
      </div>
    </header>
  );
}
