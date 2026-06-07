import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { toApiSession, toApiTask } from "@/lib/api-mappers";
import type {
  PomodoroSessionLog,
  SessionType,
  StatsBySessionType,
  StatsPerDay,
  StatsResponse,
  Task,
} from "@/types";

export const runtime = "nodejs";

function ymdInTimezone(d: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${day}`;
}

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function resolveTimezone(raw: string | null): string {
  if (raw && isValidTimezone(raw)) return raw;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

function daysForPeriod(period: string): number {
  if (period === "day") return 1;
  if (period === "week") return 7;
  return 30;
}

function computeStreak(
  sessions: PomodoroSessionLog[],
  timezone: string,
): number {
  if (sessions.length === 0) return 0;
  const workDays = new Set(
    sessions
      .filter((s) => s.session_type === "work")
      .map((s) => ymdInTimezone(new Date(s.completed_at), timezone)),
  );
  if (workDays.size === 0) return 0;
  const todayYmd = ymdInTimezone(new Date(), timezone);
  if (!workDays.has(todayYmd)) return 0;
  let streak = 0;
  let cursor = todayYmd;
  while (workDays.has(cursor)) {
    streak += 1;
    cursor = addDaysYmd(cursor, -1);
  }
  return streak;
}

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const periodRaw = url.searchParams.get("period") ?? "week";
    const period =
      periodRaw === "day" || periodRaw === "week" || periodRaw === "month"
        ? periodRaw
        : "week";
    const timezone = resolveTimezone(url.searchParams.get("tz"));

    const [rawSessions, tasks] = await Promise.all([
      prisma.pomodoroSessionLog.findMany({
        where: { userId: user.id },
        orderBy: { completedAt: "desc" },
      }),
      prisma.task.findMany({
        where: { userId: user.id },
        orderBy: { position: "asc" },
      }),
    ]);
    const sessions = rawSessions.map(toApiSession);
    const taskList: Task[] = tasks.map(toApiTask);

    const days = daysForPeriod(period);
    const todayYmd = ymdInTimezone(new Date(), timezone);
    const startYmd = addDaysYmd(todayYmd, -(days - 1));

    const perDayMap = new Map<string, StatsPerDay>();
    for (let i = 0; i < days; i += 1) {
      const key = addDaysYmd(startYmd, i);
      perDayMap.set(key, { date: key, count: 0, focus_seconds: 0 });
    }

    let totalPomodoros = 0;
    let totalFocusSeconds = 0;
    const byType: StatsBySessionType = {
      work: 0,
      shortBreak: 0,
      longBreak: 0,
    };
    for (const s of sessions as Array<{
      session_type: SessionType;
      duration_seconds: number;
      completed_at: string | Date;
    }>) {
      const key = ymdInTimezone(new Date(s.completed_at), timezone);
      const bucket = perDayMap.get(key);
      if (!bucket) continue;
      byType[s.session_type] += 1;
      if (s.session_type === "work") {
        totalPomodoros += 1;
        totalFocusSeconds += s.duration_seconds;
        bucket.count += 1;
        bucket.focus_seconds += s.duration_seconds;
      }
    }

    const topTasks = taskList
      .filter((t) => t.completed_pomodoros > 0)
      .sort((a, b) => b.completed_pomodoros - a.completed_pomodoros)
      .slice(0, 5);

    const body: StatsResponse = {
      period,
      range_start: `${startYmd}T00:00:00Z`,
      range_end: `${addDaysYmd(todayYmd, 1)}T00:00:00Z`,
      total_pomodoros: totalPomodoros,
      total_focus_seconds: totalFocusSeconds,
      current_streak: computeStreak(sessions, timezone),
      by_session_type: byType,
      per_day: Array.from(perDayMap.values()),
      top_tasks: topTasks,
    };
    return NextResponse.json(body);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Failed to load stats" },
      { status: 500 },
    );
  }
}
