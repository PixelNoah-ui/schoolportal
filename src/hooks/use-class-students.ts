import { useQuery } from "@tanstack/react-query";

export interface ClassStudentGrade {
  id: string;
  studentId: string;
  studentName: string;
  email: string;
  grade?: number | null;
  classSubjectId: string;
}

export interface ClassStudentsData {
  students: ClassStudentGrade[];
}

async function fetchClassStudents(
  classSubjectId: string,
): Promise<ClassStudentsData> {
  // This would typically call your API endpoint
  // For now, returning empty since you'll need to implement the backend
  return {
    students: [],
  };
}

export const classStudentsKeys = {
  all: ["class-students"] as const,
  byClassSubject: (classSubjectId: string) =>
    [...classStudentsKeys.all, classSubjectId] as const,
};

export function useClassStudents(classSubjectId: string | null) {
  return useQuery({
    queryKey: classStudentsKeys.byClassSubject(classSubjectId || ""),
    queryFn: () => fetchClassStudents(classSubjectId || ""),
    enabled: !!classSubjectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
