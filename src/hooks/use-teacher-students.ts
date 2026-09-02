import { useQuery } from "@tanstack/react-query";
import {
  fetchTeacherStudents,
  type TeacherStudentListParams,
} from "@/lib/api/teacher-students";

export const teacherStudentsKey = ["teacher-students"] as const;

export function useTeacherStudents(params: TeacherStudentListParams = {}) {
  return useQuery({
    queryKey: [...teacherStudentsKey, params],
    queryFn: () => fetchTeacherStudents(params),
  });
}
