import { useQuery } from "@tanstack/react-query";
import { fetchRankings, type RankingListParams } from "@/lib/api/rankings";

export const rankingsKey = ["rankings"] as const;

export function useRankings(params: RankingListParams = {}) {
  return useQuery({
    queryKey: [...rankingsKey, params],
    queryFn: () => fetchRankings(params),
  });
}
