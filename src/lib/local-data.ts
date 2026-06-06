import type { AppSettings, PomodoroSessionLog, Task } from "@/types";

const STORAGE_KEY = "pomodoro-local-data-v1";

export type LocalData = {
  tasks: Task[];
  sessions: PomodoroSessionLog[];
  settings: AppSettings;
};

export const DEFAULT_SETTINGS: AppSettings = {
  id: 1,
  work_duration: 25,
  short_break_duration: 5,
  long_break_duration: 15,
  cycles_until_long_break: 4,
  auto_start: false,
  sound_enabled: true,
  volume: 80,
  theme: "system",
  notifications_enabled: true,
  updated_at: new Date(0).toISOString(),
};

const EMPTY: LocalData = {
  tasks: [],
  sessions: [],
  settings: DEFAULT_SETTINGS,
};

function isTaskArray(v: unknown): v is Task[] {
  if (!Array.isArray(v)) return false;
  return v.every(
    (t) =>
      t &&
      typeof t === "object" &&
      typeof (t as Task).id === "number" &&
      typeof (t as Task).title === "string",
  );
}

function isSessionArray(v: unknown): v is PomodoroSessionLog[] {
  if (!Array.isArray(v)) return false;
  return v.every(
    (s) =>
      s &&
      typeof s === "object" &&
      typeof (s as PomodoroSessionLog).id === "number" &&
      typeof (s as PomodoroSessionLog).session_type === "string",
  );
}

function isSettings(v: unknown): v is AppSettings {
  if (!v || typeof v !== "object") return false;
  const s = v as Partial<AppSettings>;
  return (
    typeof s.work_duration === "number" &&
    typeof s.short_break_duration === "number" &&
    typeof s.long_break_duration === "number" &&
    typeof s.cycles_until_long_break === "number" &&
    typeof s.auto_start === "boolean" &&
    typeof s.sound_enabled === "boolean" &&
    typeof s.volume === "number" &&
    (s.theme === "light" || s.theme === "dark" || s.theme === "system") &&
    typeof s.notifications_enabled === "boolean"
  );
}

function load(): LocalData {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY;
    const p = parsed as Partial<LocalData>;
    return {
      tasks: isTaskArray(p.tasks) ? p.tasks : [],
      sessions: isSessionArray(p.sessions) ? p.sessions : [],
      settings: isSettings(p.settings) ? p.settings : DEFAULT_SETTINGS,
    };
  } catch {
    return EMPTY;
  }
}

function save(data: LocalData) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

let state: LocalData = load();
let nextId = computeNextId(state);

function computeNextId(d: LocalData): number {
  const t = d.tasks.reduce((m, x) => Math.max(m, x.id), 0);
  const s = d.sessions.reduce((m, x) => Math.max(m, x.id), 0);
  return Math.max(t, s, 0) + 1;
}

function commit(next: LocalData) {
  state = next;
  nextId = computeNextId(next);
  save(state);
  emit();
}

export const localData = {
  getSnapshot(): LocalData {
    return state;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  // --- Tasks ---
  listTasks(): Task[] {
    return [...state.tasks].sort((a, b) => a.position - b.position);
  },

  addTask(input: {
    title: string;
    notes?: string | null;
    estimated_pomodoros?: number;
  }): Task {
    const now = new Date().toISOString();
    const maxPos = state.tasks.reduce((m, t) => Math.max(m, t.position), 0);
    const task: Task = {
      id: nextId,
      title: input.title,
      notes: input.notes ?? null,
      estimated_pomodoros: input.estimated_pomodoros ?? 1,
      completed_pomodoros: 0,
      is_completed: false,
      position: maxPos + 1,
      created_at: now,
      updated_at: now,
    };
    commit({ ...state, tasks: [...state.tasks, task] });
    return task;
  },

  updateTask(
    id: number,
    patch: Partial<Pick<Task, "title" | "notes" | "estimated_pomodoros" | "is_completed">>,
  ): Task {
    const idx = state.tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error("Task not found");
    const now = new Date().toISOString();
    const updated: Task = {
      ...state.tasks[idx],
      ...patch,
      updated_at: now,
    };
    const tasks = state.tasks.slice();
    tasks[idx] = updated;
    commit({ ...state, tasks });
    return updated;
  },

  deleteTask(id: number): void {
    const tasks = state.tasks.filter((t) => t.id !== id);
    const sessions = state.sessions.filter((s) => s.task_id !== id);
    commit({ ...state, tasks, sessions });
  },

  reorderTasks(order: number[]): Task[] {
    const sorted = [...state.tasks].sort(
      (a, b) => order.indexOf(a.id) - order.indexOf(b.id),
    );
    const tasks = sorted.map((t, i) => ({ ...t, position: i + 1 }));
    commit({ ...state, tasks });
    return tasks;
  },

  // --- Sessions ---
  listSessions(): PomodoroSessionLog[] {
    return state.sessions.slice();
  },

  logSession(input: {
    session_type: PomodoroSessionLog["session_type"];
    duration_seconds: number;
    task_id?: number | null;
  }): PomodoroSessionLog {
    const session: PomodoroSessionLog = {
      id: nextId,
      task_id: input.task_id ?? null,
      session_type: input.session_type,
      duration_seconds: input.duration_seconds,
      completed_at: new Date().toISOString(),
    };
    let tasks = state.tasks;
    if (
      input.session_type === "work" &&
      input.task_id != null
    ) {
      const idx = tasks.findIndex((t) => t.id === input.task_id);
      if (idx !== -1) {
        const t = tasks[idx];
        tasks = tasks.slice();
        tasks[idx] = {
          ...t,
          completed_pomodoros: t.completed_pomodoros + 1,
          updated_at: new Date().toISOString(),
        };
      }
    }
    commit({ ...state, sessions: [...state.sessions, session], tasks });
    return session;
  },

  // --- Settings ---
  getSettings(): AppSettings {
    return state.settings;
  },

  updateSettings(patch: Partial<Omit<AppSettings, "id" | "updated_at">>): AppSettings {
    const next: AppSettings = {
      ...state.settings,
      ...patch,
      updated_at: new Date().toISOString(),
    };
    commit({ ...state, settings: next });
    return next;
  },

  // --- Maintenance ---
  resetAll(): void {
    commit(EMPTY);
  },
};
