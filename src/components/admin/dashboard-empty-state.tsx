// components/admin/dashboard-empty-state.tsx
import Link from "next/link";
import {
  CalendarRange,
  Layers,
  Users,
  GraduationCap,
  Check,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SetupStep {
  number: string;
  icon: typeof CalendarRange;
  title: string;
  description: string;
  href: string;
  done?: boolean;
}

const steps: SetupStep[] = [
  {
    number: "01",
    icon: CalendarRange,
    title: "Set the academic year",
    description: "Define the current year and its two semesters.",
    href: "/admin/academic-years",
  },
  {
    number: "02",
    icon: Layers,
    title: "Create your classes",
    description: "Add grade levels and sections students will belong to.",
    href: "/admin/classes",
  },
  {
    number: "03",
    icon: Users,
    title: "Add teachers",
    description: "Bring on staff and assign them to subjects.",
    href: "/admin/teachers",
  },
  {
    number: "04",
    icon: GraduationCap,
    title: "Enroll students",
    description: "Add students and place them into classes.",
    href: "/admin/students",
  },
];

export function DashboardEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        {/* Ghosted stat row — hints at what the dashboard becomes */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {["Students", "Teachers", "Classes", "Avg. Score"].map((label) => (
            <div key={label} className="border border-dashed p-4 opacity-40">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {label}
              </span>
              <div className="mt-3 h-7 w-10 bg-muted" />
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
            Get started
          </span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Your school overview starts here
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            This dashboard fills in automatically once you set up your school
            records. Work through these four steps in order.
          </p>
        </div>

        <div className="mt-8 border">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === steps.length - 1;
            return (
              <Link
                key={step.number}
                href={step.href}
                className={cn(
                  "group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40",
                  !isLast && "border-b",
                )}
              >
                <span className="w-8 shrink-0 font-mono text-sm text-muted-foreground">
                  {step.number}
                </span>
                <div className="flex size-9 shrink-0 items-center justify-center border border-primary/30 bg-primary/5">
                  {step.done ? (
                    <Check className="size-4 text-primary" />
                  ) : (
                    <Icon className="size-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
