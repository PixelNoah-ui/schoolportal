// components/admin/nav-config.ts
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  Layers,
  ClipboardList,
  CalendarRange,
  Settings,
  Trophy,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string;
}

export const adminNavMain: NavItem[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Students", url: "/admin/students", icon: GraduationCap },
  { title: "Teachers", url: "/admin/teachers", icon: Users },
  { title: "Classes", url: "/admin/classes", icon: Layers },
  { title: "Subjects", url: "/admin/subjects", icon: BookOpen },
  { title: "Grades", url: "/admin/grades", icon: ClipboardList },
  { title: "Rankings", url: "/admin/rankings", icon: Trophy },
  { title: "Payments", url: "/admin/payments", icon: CreditCard },
  {
    title: "Academic Years",
    url: "/admin/academic-years",
    icon: CalendarRange,
  },
];

export const adminNavFooter: NavItem[] = [
  { title: "Settings", url: "/admin/settings", icon: Settings },
];
