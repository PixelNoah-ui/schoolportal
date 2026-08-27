// components/admin/site-header.tsx
import { Bell, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SiteHeader({ title }: { title: string }) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search students, teachers..."
            className="w-64 rounded-none pl-8"
          />
        </div>
        <Button variant="outline" size="icon" className="rounded-none">
          <Bell className="size-4" />
        </Button>
      </div>
    </header>
  );
}
