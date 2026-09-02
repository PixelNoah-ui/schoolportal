import { useQuery } from "@tanstack/react-query";
import { fetchTeacherDashboard } from "@/lib/api/teacher-dashboard";

export const teacherDashboardKey = ["teacher-dashboard"] as const;

export function useTeacherDashboard() {
  return useQuery({
    queryKey: teacherDashboardKey,
    queryFn: fetchTeacherDashboard,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
