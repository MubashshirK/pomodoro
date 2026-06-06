"use client";

import { useState } from "react";
import { BarChart3, Clock, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stats/stat-card";
import { StreakCard } from "@/components/stats/streak-card";
import { PeriodSelector } from "@/components/stats/period-selector";
import { DailyBarChart } from "@/components/stats/daily-bar-chart";
import { SessionTypePie } from "@/components/stats/session-type-pie";
import { TaskLeaderboard } from "@/components/stats/task-leaderboard";
import { useStats, type StatsPeriod } from "@/hooks/use-stats";
import { humanizeSeconds } from "@/lib/format";

export default function StatsPage() {
  const [period, setPeriod] = useState<StatsPeriod>("week");
  const { data, isLoading, isError, error, isFetching } = useStats(period);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Stats</h1>
          <p className="text-sm text-muted-foreground">
            Your focus, broken down.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isFetching ? (
            <span className="text-xs text-muted-foreground">Refreshing…</span>
          ) : null}
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      {isError ? (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Couldn't load stats:{" "}
            {error instanceof Error ? error.message : "unknown error"}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Target}
          label="Pomodoros"
          value={isLoading ? "—" : (data?.total_pomodoros ?? 0)}
          hint={period === "day" ? "Today" : period === "week" ? "Last 7 days" : "Last 30 days"}
          tone="work"
        />
        <StatCard
          icon={Clock}
          label="Focus time"
          value={isLoading ? "—" : humanizeSeconds(data?.total_focus_seconds ?? 0)}
          hint="Across all sessions"
        />
        <StatCard
          icon={BarChart3}
          label="Sessions"
          value={isLoading
            ? "—"
            : ((data?.by_session_type.work ?? 0) +
                (data?.by_session_type.shortBreak ?? 0) +
                (data?.by_session_type.longBreak ?? 0))}
          hint={`${data?.by_session_type.work ?? 0} work · ${data?.by_session_type.shortBreak ?? 0} short · ${data?.by_session_type.longBreak ?? 0} long`}
        />
        <StreakCard streak={data?.current_streak ?? 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Focus minutes per day</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-80 animate-pulse rounded-lg bg-muted" />
            ) : (
              <DailyBarChart data={data?.per_day ?? []} period={period} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-72 animate-pulse rounded-lg bg-muted" />
            ) : (
              <SessionTypePie byType={data?.by_session_type ?? { work: 0, shortBreak: 0, longBreak: 0 }} />
            )}
          </CardContent>
        </Card>
      </div>

      <TaskLeaderboard tasks={data?.top_tasks ?? []} />
    </div>
  );
}
