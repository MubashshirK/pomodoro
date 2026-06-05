import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { StatsResponse } from "@/types";

export type StatsPeriod = "day" | "week" | "month";

export const statsKeys = {
  all: ["stats"] as const,
  detail: (period: StatsPeriod) => ["stats", period] as const,
};

export function useStats(period: StatsPeriod) {
  return useQuery<StatsResponse>({
    queryKey: statsKeys.detail(period),
    queryFn: () =>
      api.get<StatsResponse>(`/stats`, {
        params: { period, tz_offset: -new Date().getTimezoneOffset() },
      }),
    staleTime: 30_000,
  });
}
