export type SessionType = "work" | "shortBreak" | "longBreak";

export type Task = {
  id: number;
  title: string;
  notes: string | null;
  estimated_pomodoros: number;
  completed_pomodoros: number;
  is_completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

export type PomodoroSessionLog = {
  id: number;
  task_id: number | null;
  session_type: SessionType;
  duration_seconds: number;
  completed_at: string;
};

export type AppSettings = {
  id: number;
  work_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  cycles_until_long_break: number;
  auto_start: boolean;
  sound_enabled: boolean;
  volume: number;
  theme: "light" | "dark" | "system";
  notifications_enabled: boolean;
  updated_at: string;
};

export type StatsBySessionType = {
  work: number;
  shortBreak: number;
  longBreak: number;
};

export type StatsPerDay = {
  date: string;
  count: number;
  focus_seconds: number;
};

export type StatsResponse = {
  period: "day" | "week" | "month";
  range_start: string;
  range_end: string;
  total_pomodoros: number;
  total_focus_seconds: number;
  current_streak: number;
  by_session_type: StatsBySessionType;
  per_day: StatsPerDay[];
  top_tasks: Task[];
};
