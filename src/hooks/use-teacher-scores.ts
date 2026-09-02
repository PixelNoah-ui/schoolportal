import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchClassScores,
  setScoreFinal,
  upsertScore,
  upsertScores,
  type ScoreUpsertInput,
  type ScoreFinalInput,
} from "@/lib/api/teacher-scores";

export const teacherScoresKey = (classSubjectId: string, semesterId: string) =>
  ["teacher-scores", classSubjectId, semesterId] as const;

export function useClassScores(classSubjectId: string, semesterId: string) {
  return useQuery({
    queryKey: teacherScoresKey(classSubjectId, semesterId),
    queryFn: () => fetchClassScores({ classSubjectId, semesterId }),
    enabled: Boolean(classSubjectId) && Boolean(semesterId),
  });
}

export function useSaveScore(classSubjectId: string, semesterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ScoreUpsertInput) => upsertScore(input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: teacherScoresKey(classSubjectId, semesterId),
      }),
  });
}

export function useSaveAllScores(classSubjectId: string, semesterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inputs: ScoreUpsertInput[]) => upsertScores(inputs),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: teacherScoresKey(classSubjectId, semesterId),
      }),
  });
}

export function useSetScoreFinal(classSubjectId: string, semesterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ScoreFinalInput) => setScoreFinal(input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: teacherScoresKey(classSubjectId, semesterId),
      }),
  });
}
