// components/admin/nav-config.ts
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  Layers,
  Settings,
  Trophy,
  CreditCard,
  CalendarClock,
  ClipboardCheck,
  FileText,
  NotebookPen,
  BriefcaseBusiness,
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
  { title: "Schedule", url: "/admin/schedule", icon: CalendarClock },
  {
    title: "Academic Years",
    url: "/admin/academic-years",
    icon: BriefcaseBusiness,
  },
  { title: "Semesters", url: "/admin/semesters", icon: NotebookPen },
  {
    title: "Course Assignments",
    url: "/admin/course-assignments",
    icon: ClipboardCheck,
  },
  { title: "Results", url: "/admin/results", icon: Trophy },
  { title: "Ranking", url: "/admin/rankings", icon: Trophy },
  { title: "Payments", url: "/admin/payments", icon: CreditCard },
  { title: "Reports", url: "/admin/reports", icon: FileText },
];

export const adminNavFooter: NavItem[] = [
  { title: "Settings", url: "/admin/settings", icon: Settings },
];
