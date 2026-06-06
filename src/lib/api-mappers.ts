import type { AppSettings, PomodoroSessionLog, SessionType, Task } from "@/types";

type DbTask = {
  id: number;
  title: string;
  notes: string | null;
  estimatedPomodoros: number;
  completedPomodoros: number;
  isCompleted: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

type DbSession = {
  id: number;
  taskId: number | null;
  sessionType: string;
  durationSeconds: number;
  completedAt: Date;
};

type DbSettings = {
  id: number;
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  cyclesUntilLongBreak: number;
  autoStart: boolean;
  soundEnabled: boolean;
  volume: number;
  theme: string;
  notificationsEnabled: boolean;
  updatedAt: Date;
};

export function toApiTask(t: DbTask): Task {
  return {
    id: t.id,
    title: t.title,
    notes: t.notes,
    estimated_pomodoros: t.estimatedPomodoros,
    completed_pomodoros: t.completedPomodoros,
    is_completed: t.isCompleted,
    position: t.position,
    created_at: t.createdAt.toISOString(),
    updated_at: t.updatedAt.toISOString(),
  };
}

export function toApiSession(s: DbSession): PomodoroSessionLog {
  return {
    id: s.id,
    task_id: s.taskId,
    session_type: s.sessionType as SessionType,
    duration_seconds: s.durationSeconds,
    completed_at: s.completedAt.toISOString(),
  };
}

export function toApiSettings(s: DbSettings): AppSettings {
  return {
    id: s.id,
    work_duration: s.workDuration,
    short_break_duration: s.shortBreakDuration,
    long_break_duration: s.longBreakDuration,
    cycles_until_long_break: s.cyclesUntilLongBreak,
    auto_start: s.autoStart,
    sound_enabled: s.soundEnabled,
    volume: s.volume,
    theme: s.theme as "light" | "dark" | "system",
    notifications_enabled: s.notificationsEnabled,
    updated_at: s.updatedAt.toISOString(),
  };
}
