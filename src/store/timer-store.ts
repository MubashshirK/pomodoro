import { create } from "zustand";
import type { AppSettings, SessionType, Task } from "@/types";
import { minutesToMs } from "@/lib/format";

export type TimerStatus = "idle" | "running" | "paused" | "completed";

export type ActiveTaskSummary = Pick<
  Task,
  "id" | "title" | "estimated_pomodoros" | "completed_pomodoros" | "is_completed"
> | null;

type TimerState = {
  // Session
  sessionType: SessionType;
  status: TimerStatus;
  totalMs: number;
  remainingMs: number;
  completedCycles: number;

  // Active task
  activeTask: ActiveTaskSummary;

  // Settings mirror
  settings: AppSettings | null;

  // Actions
  setSessionType: (t: SessionType) => void;
  setStatus: (s: TimerStatus) => void;
  setRemaining: (ms: number) => void;
  setTotal: (ms: number) => void;
  hydrateSettings: (s: AppSettings) => void;
  setActiveTask: (task: ActiveTaskSummary) => void;
  incrementCompletedCycles: () => void;
  resetCycles: () => void;
};

export const useTimerStore = create<TimerState>((set) => ({
  sessionType: "work",
  status: "idle",
  totalMs: minutesToMs(25),
  remainingMs: minutesToMs(25),
  completedCycles: 0,
  activeTask: null,
  settings: null,

  setSessionType: (sessionType) =>
    set((s) => {
      const totalMs = durationFor(sessionType, s.settings);
      return {
        sessionType,
        status: "idle",
        totalMs,
        remainingMs: totalMs,
      };
    }),

  setStatus: (status) => set({ status }),
  setRemaining: (remainingMs) => set({ remainingMs }),
  setTotal: (totalMs) => set({ totalMs, remainingMs: totalMs }),

  hydrateSettings: (settings) =>
    set((s) => {
      const totalMs = durationFor(s.sessionType, settings);
      // If a session is in progress, only sync the settings and totalMs —
      // the current run keeps its remainingMs and status. The new duration
      // will apply to the next session.
      if (s.status === "running" || s.status === "paused") {
        return { settings, totalMs };
      }
      return { settings, totalMs, remainingMs: totalMs, status: "idle" };
    }),

  setActiveTask: (activeTask) => set({ activeTask }),
  incrementCompletedCycles: () =>
    set((s) => ({ completedCycles: s.completedCycles + 1 })),
  resetCycles: () => set({ completedCycles: 0 }),
}));

export function durationFor(
  sessionType: SessionType,
  settings: AppSettings | null,
): number {
  if (!settings) {
    return sessionType === "work"
      ? minutesToMs(25)
      : sessionType === "shortBreak"
        ? minutesToMs(5)
        : minutesToMs(15);
  }
  const minutes =
    sessionType === "work"
      ? settings.work_duration
      : sessionType === "shortBreak"
        ? settings.short_break_duration
        : settings.long_break_duration;
  return minutesToMs(minutes);
}

export function sessionLabel(t: SessionType): string {
  return t === "work" ? "Focus" : t === "shortBreak" ? "Short Break" : "Long Break";
}

export function colorVarFor(t: SessionType): string {
  return t === "work"
    ? "var(--work)"
    : t === "shortBreak"
      ? "var(--short-break)"
      : "var(--long-break)";
}
