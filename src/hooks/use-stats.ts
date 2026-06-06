import { useQuery } from "@tanstack/react-query";
import { taskKeys } from "@/hooks/use-tasks";
import { localData } from "@/lib/local-data";
import type {
  PomodoroSessionLog,
  StatsBySessionType,
  StatsPerDay,
  StatsResponse,
  Task,
} from "@/types";

export type StatsPeriod = "day" | "week" | "month";

export const statsKeys = {
  all: ["stats"] as const,
  detail: (period: StatsPeriod) => ["stats", period] as const,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysForPeriod(period: StatsPeriod): number {
  if (period === "day") return 1;
  if (period === "week") return 7;
  return 30;
}

function computeStreak(sessions: PomodoroSessionLog[]): number {
  if (sessions.length === 0) return 0;
  const workDays = new Set(
    sessions
      .filter((s) => s.session_type === "work")
      .map((s) => ymd(new Date(s.completed_at))),
  );
  let streak = 0;
  const cursor = startOfLocalDay(new Date());
  while (workDays.has(ymd(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function computeStats(period: StatsPeriod): StatsResponse {
  const sessions = localData.listSessions();
  const tasks = localData.listTasks();
  const days = daysForPeriod(period);
  const today = startOfLocalDay(new Date());
  const rangeStart = new Date(today.getTime() - (days - 1) * MS_PER_DAY);
  const rangeEnd = new Date(today.getTime() + MS_PER_DAY - 1);

  const inRange = sessions.filter((s) => {
    const t = new Date(s.completed_at).getTime();
    return t >= rangeStart.getTime() && t <= rangeEnd.getTime();
  });

  let totalPomodoros = 0;
  let totalFocusSeconds = 0;
  const byType: StatsBySessionType = { work: 0, shortBreak: 0, longBreak: 0 };
  for (const s of inRange) {
    byType[s.session_type] += 1;
    if (s.session_type === "work") {
      totalPomodoros += 1;
      totalFocusSeconds += s.duration_seconds;
    }
  }

  const perDayMap = new Map<string, StatsPerDay>();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(rangeStart.getTime() + i * MS_PER_DAY);
    perDayMap.set(ymd(d), { date: ymd(d), count: 0, focus_seconds: 0 });
  }
  for (const s of inRange) {
    if (s.session_type !== "work") continue;
    const key = ymd(new Date(s.completed_at));
    const bucket = perDayMap.get(key);
    if (bucket) {
      bucket.count += 1;
      bucket.focus_seconds += s.duration_seconds;
    }
  }
  const per_day: StatsPerDay[] = Array.from(perDayMap.values());

  const topTasks: Task[] = tasks
    .filter((t) => t.completed_pomodoros > 0)
    .sort((a, b) => b.completed_pomodoros - a.completed_pomodoros)
    .slice(0, 5);

  return {
    period,
    range_start: rangeStart.toISOString(),
    range_end: rangeEnd.toISOString(),
    total_pomodoros: totalPomodoros,
    total_focus_seconds: totalFocusSeconds,
    current_streak: computeStreak(sessions),
    by_session_type: byType,
    per_day,
    top_tasks: topTasks,
  };
}

export function useStats(period: StatsPeriod) {
  return useQuery<StatsResponse>({
    queryKey: statsKeys.detail(period),
    queryFn: () => computeStats(period),
    staleTime: Infinity,
  });
}

export { taskKeys };
