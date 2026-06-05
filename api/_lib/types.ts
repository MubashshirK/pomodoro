export interface SessionData {
  userId?: number;
}

export interface TaskDict {
  id: number;
  user_id: number;
  title: string;
  notes: string | null;
  estimated_pomodoros: number;
  completed_pomodoros: number;
  is_completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface SessionDict {
  id: number;
  user_id: number;
  task_id: number | null;
  session_type: string;
  duration_seconds: number;
  completed_at: string;
}

export interface SettingsDict {
  id: number;
  user_id: number;
  work_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  cycles_until_long_break: number;
  auto_start: boolean;
  sound_enabled: boolean;
  volume: number;
  theme: string;
  notifications_enabled: boolean;
  updated_at: string;
}

export interface UserDict {
  id: number;
  email: string;
  name: string | null;
  created_at: string;
}
