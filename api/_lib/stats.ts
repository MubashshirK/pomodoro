import { and, eq, gte, lte, sql, desc, asc, isNotNull } from "drizzle-orm";
import { db } from "./db.js";
import { tasks, pomodoroSessions } from "../../lib/schema.js";

export type Period = "day" | "week" | "month";

export const PERIOD_DAYS: Record<Period, number> = {
  day: 1,
  week: 7,
  month: 30,
};

export function parsePeriod(value: string | null | undefined): Period {
  if (value === "day" || value === "week" || value === "month") return value;
  return "week";
}

export function parseTzOffset(value: string | null | undefined): number {
  if (!value) return 0;
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(-14 * 60, Math.min(14 * 60, Math.trunc(n)));
}

export interface DailyBucket {
  date: string;
  work_sessions: number;
  work_minutes: number;
}

export interface WeeklyBucket {
  week_start: string;
  work_sessions: number;
  work_minutes: number;
}

export interface MonthlyBucket {
  month: string;
  work_sessions: number;
  work_minutes: number;
}

export interface TopTask {
  task_id: number;
  title: string;
  sessions: number;
  minutes: number;
}

export interface StatsResult {
  period: Period;
  days: number;
  totals: {
    work_sessions: number;
    work_minutes: number;
    tasks_completed: number;
  };
  daily: DailyBucket[];
  weekly: WeeklyBucket[];
  monthly: MonthlyBucket[];
  current_streak: number;
  top_tasks: TopTask[];
}

export async function computeStats(
  userId: number,
  period: Period,
  tzOffset: number,
): Promise<StatsResult> {
  const days = PERIOD_DAYS[period];
  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const baseFilter = and(
    eq(pomodoroSessions.userId, userId),
    gte(pomodoroSessions.completedAt, sql`${sinceIso}::timestamp`),
    eq(pomodoroSessions.sessionType, "work"),
  );

  const totalsRows = await db
    .select({
      work_sessions: sql<number>`count(*)::int`,
      work_minutes: sql<number>`coalesce(sum(${pomodoroSessions.durationSeconds}), 0)::int / 60`,
    })
    .from(pomodoroSessions)
    .where(baseFilter);
  const totals = totalsRows[0] ?? { work_sessions: 0, work_minutes: 0 };

  const tasksCompletedRows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.isCompleted, true),
        gte(tasks.updatedAt, sql`${sinceIso}::timestamp`),
      ),
    );
  const tasksCompleted = tasksCompletedRows[0]?.c ?? 0;

  const dailyRows = await db.execute<{
    bucket: string;
    work_sessions: number;
    work_minutes: number;
  }>(sql`
    select
      to_char(date_trunc('day', completed_at + (${sql.raw(String(tzOffset))} || ' minutes')::interval), 'YYYY-MM-DD') as bucket,
      count(*)::int as work_sessions,
      coalesce(sum(duration_seconds), 0)::int / 60 as work_minutes
    from pomodoro_sessions
    where user_id = ${userId}
      and session_type = 'work'
      and completed_at >= ${sinceIso}::timestamp
    group by 1
    order by 1
  `);

  const weeklyRows = await db.execute<{
    bucket: string;
    work_sessions: number;
    work_minutes: number;
  }>(sql`
    select
      to_char(date_trunc('week', completed_at + (${sql.raw(String(tzOffset))} || ' minutes')::interval), 'YYYY-MM-DD') as bucket,
      count(*)::int as work_sessions,
      coalesce(sum(duration_seconds), 0)::int / 60 as work_minutes
    from pomodoro_sessions
    where user_id = ${userId}
      and session_type = 'work'
      and completed_at >= ${sinceIso}::timestamp
    group by 1
    order by 1
  `);

  const monthlyRows = await db.execute<{
    bucket: string;
    work_sessions: number;
    work_minutes: number;
  }>(sql`
    select
      to_char(date_trunc('month', completed_at + (${sql.raw(String(tzOffset))} || ' minutes')::interval), 'YYYY-MM-DD') as bucket,
      count(*)::int as work_sessions,
      coalesce(sum(duration_seconds), 0)::int / 60 as work_minutes
    from pomodoro_sessions
    where user_id = ${userId}
      and session_type = 'work'
      and completed_at >= ${sinceIso}::timestamp
    group by 1
    order by 1
  `);

  const topRows = await db
    .select({
      task_id: pomodoroSessions.taskId,
      title: tasks.title,
      sessions: sql<number>`count(${pomodoroSessions.id})::int`,
      minutes: sql<number>`coalesce(sum(${pomodoroSessions.durationSeconds}), 0)::int / 60`,
    })
    .from(pomodoroSessions)
    .leftJoin(tasks, eq(pomodoroSessions.taskId, tasks.id))
    .where(
      and(
        eq(pomodoroSessions.userId, userId),
        gte(pomodoroSessions.completedAt, sql`${sinceIso}::timestamp`),
        eq(pomodoroSessions.sessionType, "work"),
        isNotNull(pomodoroSessions.taskId),
      ),
    )
    .groupBy(pomodoroSessions.taskId, tasks.title)
    .orderBy(desc(sql`count(${pomodoroSessions.id})`))
    .limit(5);

  const topTasks: TopTask[] = topRows
    .filter((r) => r.task_id != null)
    .map((r) => ({
      task_id: r.task_id as number,
      title: r.title ?? "(deleted)",
      sessions: r.sessions,
      minutes: r.minutes,
    }));

  const currentStreak = await computeStreak(userId, tzOffset);

  return {
    period,
    days,
    totals: {
      work_sessions: totals.work_sessions,
      work_minutes: totals.work_minutes,
      tasks_completed: tasksCompleted,
    },
    daily: dailyRows.rows.map((r) => ({
      date: r.bucket,
      work_sessions: r.work_sessions,
      work_minutes: r.work_minutes,
    })),
    weekly: weeklyRows.rows.map((r) => ({
      week_start: r.bucket,
      work_sessions: r.work_sessions,
      work_minutes: r.work_minutes,
    })),
    monthly: monthlyRows.rows.map((r) => ({
      month: r.bucket.slice(0, 7),
      work_sessions: r.work_sessions,
      work_minutes: r.work_minutes,
    })),
    current_streak: currentStreak,
    top_tasks: topTasks,
  };
}

async function computeStreak(userId: number, tzOffset: number): Promise<number> {
  const rows = await db.execute<{ bucket: string }>(sql`
    select distinct to_char(date_trunc('day', completed_at + (${sql.raw(String(tzOffset))} || ' minutes')::interval), 'YYYY-MM-DD') as bucket
    from pomodoro_sessions
    where user_id = ${userId}
      and session_type = 'work'
    order by 1 desc
    limit 365
  `);

  const dates = rows.rows.map((r) => r.bucket);
  if (dates.length === 0) return 0;

  const today = new Date(Date.now() + tzOffset * 60 * 1000);
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const set = new Set(dates);
  let cursor = todayStr;
  if (!set.has(cursor)) {
    if (!set.has(yesterdayStr)) return 0;
    cursor = yesterdayStr;
  }

  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    const prev = new Date(cursor + "T00:00:00Z");
    prev.setUTCDate(prev.getUTCDate() - 1);
    cursor = prev.toISOString().slice(0, 10);
  }
  return streak;
}
