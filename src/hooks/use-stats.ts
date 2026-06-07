import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { StatsResponse } from "@/types";

export type StatsPeriod = "day" | "week" | "month";

export const statsKeys = {
  all: ["stats"] as const,
  detail: (period: StatsPeriod) => ["stats", period] as const,
};

function clientTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export function useStats(period: StatsPeriod) {
  return useQuery<StatsResponse>({
    queryKey: statsKeys.detail(period),
    queryFn: () => {
      const tz = encodeURIComponent(clientTimezone());
      return api.get<StatsResponse>(
        `/api/stats?period=${period}&tz=${tz}`,
      );
    },
    staleTime: 60_000,
  });
}
