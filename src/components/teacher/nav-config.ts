// components/teacher/nav-config.ts
import {
  LayoutDashboard,
  Layers,
  CalendarClock,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string;
}

export const teacherNavMain: NavItem[] = [
  { title: "Dashboard", url: "/teacher", icon: LayoutDashboard },
  { title: "My Classes", url: "/teacher/classes", icon: Layers },
  { title: "My Schedule", url: "/teacher/schedule", icon: CalendarClock },
];

export const teacherNavFooter: NavItem[] = [
  { title: "Settings", url: "/teacher/settings", icon: Settings },
];
