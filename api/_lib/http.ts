import { HttpError } from "./session.js";

export function json<T>(data: T, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function jsonError(message: string, status: number, extra?: Record<string, unknown>): Response {
  return json({ error: message, ...(extra ?? {}) }, { status });
}

export async function parseJson<T = unknown>(req: Request): Promise<T> {
  const ct = req.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    throw new HttpError(415, "Content-Type must be application/json");
  }
  const text = await req.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}

export function methodNotAllowed(allowed: string[]): Response {
  return json({ error: "Method not allowed" }, {
    status: 405,
    headers: { Allow: allowed.join(", ") },
  });
}

export function withErrorHandling<TContext = { params: Record<string, string> }>(
  fn: (req: Request, context?: TContext) => Promise<Response>,
) {
  return async (req: Request, context?: TContext): Promise<Response> => {
    try {
      return await fn(req, context);
    } catch (err) {
      if (err instanceof HttpError) {
        return jsonError(err.message, err.status);
      }
      console.error("Unhandled error:", err);
      return jsonError("Internal server error", 500);
    }
  };
}

export function taskToDict(t: {
  id: number;
  userId: number;
  title: string;
  notes: string | null;
  estimatedPomodoros: number;
  completedPomodoros: number;
  isCompleted: boolean;
  position: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}) {
  return {
    id: t.id,
    user_id: t.userId,
    title: t.title,
    notes: t.notes,
    estimated_pomodoros: t.estimatedPomodoros,
    completed_pomodoros: t.completedPomodoros,
    is_completed: t.isCompleted,
    position: t.position,
    created_at: toIso(t.createdAt),
    updated_at: toIso(t.updatedAt),
  };
}

export function sessionToDict(s: {
  id: number;
  userId: number;
  taskId: number | null;
  sessionType: string;
  durationSeconds: number;
  completedAt: Date | string;
}) {
  return {
    id: s.id,
    user_id: s.userId,
    task_id: s.taskId,
    session_type: s.sessionType,
    duration_seconds: s.durationSeconds,
    completed_at: toIso(s.completedAt),
  };
}

export function settingsToDict(s: {
  id: number;
  userId: number;
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  cyclesUntilLongBreak: number;
  autoStart: boolean;
  soundEnabled: boolean;
  volume: number;
  theme: string;
  notificationsEnabled: boolean;
  updatedAt: Date | string;
}) {
  return {
    id: s.id,
    user_id: s.userId,
    work_duration: s.workDuration,
    short_break_duration: s.shortBreakDuration,
    long_break_duration: s.longBreakDuration,
    cycles_until_long_break: s.cyclesUntilLongBreak,
    auto_start: s.autoStart,
    sound_enabled: s.soundEnabled,
    volume: s.volume,
    theme: s.theme,
    notifications_enabled: s.notificationsEnabled,
    updated_at: toIso(s.updatedAt),
  };
}

function toIso(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  if (typeof d === "string") return d;
  return d.toISOString();
}
