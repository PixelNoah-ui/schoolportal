import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addClassSubject,
  fetchAvailableSubjects,
  fetchAvailableTeachers,
  fetchClassSubjects,
  removeClassSubject,
  updateClassSubjectTeacher,
} from "@/lib/api/class-subjects";

export const classSubjectsKey = (classId: string) =>
  ["class-subjects", classId] as const;

export function useClassSubjects(classId: string) {
  return useQuery({
    queryKey: classSubjectsKey(classId),
    queryFn: () => fetchClassSubjects({ classId }),
    enabled: Boolean(classId),
  });
}

export function useAvailableSubjects(classId: string) {
  return useQuery({
    queryKey: [...classSubjectsKey(classId), "available-subjects"],
    queryFn: () => fetchAvailableSubjects({ classId }),
    enabled: Boolean(classId),
  });
}

export function useAvailableTeachers() {
  return useQuery({
    queryKey: ["available-teachers"],
    queryFn: fetchAvailableTeachers,
  });
}

export function useAddClassSubject(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      subjectId,
      teacherId,
      semesterId,
    }: {
      subjectId: string;
      teacherId?: string | null;
      semesterId?: string;
    }) => addClassSubject({ classId, subjectId, teacherId, semesterId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classSubjectsKey(classId) });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
}

export function useUpdateClassSubjectTeacher(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classSubjectId,
      subjectId,
      teacherId,
    }: {
      classSubjectId?: string;
      subjectId?: string;
      teacherId: string | null;
    }) =>
      updateClassSubjectTeacher({
        classSubjectId,
        classId,
        subjectId,
        teacherId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classSubjectsKey(classId) });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
}

export function useRemoveClassSubject(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classSubjectId,
      subjectId,
    }: {
      classSubjectId?: string;
      subjectId?: string;
    }) => removeClassSubject({ classSubjectId, classId, subjectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classSubjectsKey(classId) });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
}
