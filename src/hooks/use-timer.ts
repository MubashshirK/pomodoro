import { useCallback, useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useMutation } from "@tanstack/react-query";
import TimerWorker from "@/lib/timer-worker?worker";
import { useTimerStore, durationFor, sessionLabel } from "@/store/timer-store";
import { soundManager } from "@/lib/sound";
import { useSettings } from "@/hooks/use-settings";
import { useLogSession } from "@/hooks/use-sessions";
import type { SessionType } from "@/types";

type WorkerMsg =
  | { type: "tick"; remainingMs: number }
  | { type: "paused"; remainingMs: number }
  | { type: "done" }
  | { type: "reset_done" };

export function useTimer() {
  const workerRef = useRef<Worker | null>(null);
  const logSession = useLogSession();
  const settingsQuery = useSettings();
  const completedRef = useRef(false);
  const settingsRef = useRef(useTimerStore.getState().settings);
  const stateRef = useRef(useTimerStore.getState());

  useEffect(() => {
    return useTimerStore.subscribe((s) => {
      settingsRef.current = s.settings;
      stateRef.current = s;
    });
  }, []);

  // Hydrate settings into the store
  useEffect(() => {
    if (settingsQuery.data?.settings) {
      useTimerStore.getState().hydrateSettings(settingsQuery.data.settings);
    }
  }, [settingsQuery.data]);

  // Sync sound prefs
  useEffect(() => {
    const s = useTimerStore.getState().settings;
    if (!s) return;
    soundManager.setMuted(!s.sound_enabled);
    soundManager.setVolume(s.volume / 100);
  }, [settingsQuery.data]);

  // Preload sounds once
  useEffect(() => {
    soundManager.preload();
  }, []);

  // --- Callbacks (declared first so the worker effect can close over them) ---

  const postToWorker = useCallback((msg: unknown) => {
    workerRef.current?.postMessage(msg);
  }, []);

  const advanceToNextSession = useCallback(() => {
    const s = useTimerStore.getState();
    if (s.sessionType === "work") {
      const newCycles = s.completedCycles + 1;
      const limit = s.settings?.cycles_until_long_break ?? 4;
      const nextType = newCycles % limit === 0 ? "longBreak" : "shortBreak";
      s.incrementCompletedCycles();
      s.setSessionType(nextType);
    } else {
      s.setSessionType("work");
    }
  }, []);

  const start = useCallback(() => {
    const s = useTimerStore.getState();
    if (s.status === "running") return;
    completedRef.current = false;
    s.setStatus("running");
    postToWorker({ type: "start", durationMs: s.remainingMs });
    if (s.sessionType === "work") soundManager.play("work-start");
    else if (s.sessionType === "shortBreak") soundManager.play("break-start");
    else soundManager.play("break-start");
  }, [postToWorker]);

  const pause = useCallback(() => {
    postToWorker({ type: "pause" });
  }, [postToWorker]);

  const resume = useCallback(() => {
    const s = useTimerStore.getState();
    if (s.status !== "paused") return;
    completedRef.current = false;
    s.setStatus("running");
    postToWorker({ type: "start", durationMs: s.remainingMs });
    soundManager.play("resume-session");
  }, [postToWorker]);

  const reset = useCallback(() => {
    const s = useTimerStore.getState();
    s.setStatus("idle");
    s.setTotal(durationFor(s.sessionType, s.settings));
    postToWorker({ type: "reset" });
  }, [postToWorker]);

  const handleSessionComplete = useCallback(() => {
    const s = useTimerStore.getState();
    const totalSec = Math.round(s.totalMs / 1000);
    const taskId = s.activeTask?.id ?? null;

    s.setStatus("completed");
    s.setRemaining(0);
    soundManager.play("session-end");

    // Web Notification
    if (
      typeof Notification !== "undefined" &&
      s.settings?.notifications_enabled &&
      Notification.permission === "granted"
    ) {
      const label = sessionLabel(s.sessionType);
      const nextLabel =
        s.sessionType === "work"
          ? (s.completedCycles + 1) %
              (s.settings?.cycles_until_long_break ?? 4) ===
            0
            ? "long break"
            : "short break"
          : "focus";
      new Notification(`${label} complete`, {
        body: `Time for a ${nextLabel}.`,
        silent: true,
      });
    }

    // Log the session locally (all session types so stats are complete)
    logSession.mutate({
      session_type: s.sessionType,
      duration_seconds: totalSec,
      task_id: taskId,
    });

    // Schedule transition + auto-start
    const auto = s.settings?.auto_start ?? false;
    setTimeout(() => {
      advanceToNextSession();
      if (auto) {
        // Defer to next tick so the new state is committed
        setTimeout(() => start(), 50);
      }
    }, 250);
  }, [logSession, advanceToNextSession, start]);

  const skip = useCallback(() => {
    const s = useTimerStore.getState();
    if (s.status === "running" || s.status === "paused") {
      postToWorker({ type: "reset" });
    }
    completedRef.current = true; // suppress the 'done' branch
    advanceToNextSession();
  }, [postToWorker, advanceToNextSession]);

  const switchSession = useCallback(
    (next: SessionType) => {
      const s = useTimerStore.getState();
      if (s.status === "running" || s.status === "paused") return;
      s.setSessionType(next);
    },
    [],
  );

  const setActiveTaskId = useCallback((id: number | null) => {
    const s = useTimerStore.getState();
    if (id === null) {
      s.setActiveTask(null);
      return;
    }
    // We only carry a small summary; full task lives in useTasks cache.
    // The full summary is hydrated by the ActiveTaskCard using useTasks data.
  }, []);

  // --- Effects that close over callbacks (must be after callback declarations) ---

  // Keep latest handleSessionComplete in a ref so the worker effect can stay stable
  // (useLogSession from TanStack Query returns a new ref on every render, which
  // would otherwise tear down + recreate the worker on every state change).
  const handleSessionCompleteRef = useRef(handleSessionComplete);
  useEffect(() => {
    handleSessionCompleteRef.current = handleSessionComplete;
  }, [handleSessionComplete]);

  // Create worker once
  useEffect(() => {
    const w = new TimerWorker();
    workerRef.current = w;
    w.addEventListener("message", (e: MessageEvent<WorkerMsg>) => {
      const msg = e.data;
      const store = useTimerStore.getState();
      if (msg.type === "tick") {
        store.setRemaining(msg.remainingMs);
      } else if (msg.type === "paused") {
        store.setRemaining(msg.remainingMs);
        store.setStatus("paused");
      } else if (msg.type === "done") {
        if (completedRef.current) return;
        completedRef.current = true;
        handleSessionCompleteRef.current();
      } else if (msg.type === "reset_done") {
        // No-op
      }
    });
    return () => {
      w.terminate();
      workerRef.current = null;
    };
  }, []);

  // Tab title sync
  useEffect(() => {
    return useTimerStore.subscribe((s) => {
      if (typeof document === "undefined") return;
      if (s.status === "running" || s.status === "paused") {
        const mm = Math.floor(s.remainingMs / 60000);
        const ss = Math.floor((s.remainingMs % 60000) / 1000);
        document.title = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")} — ${sessionLabel(s.sessionType)}`;
      } else {
        document.title = "Pomodoro Pro";
      }
    });
  }, []);

  return {
    start,
    pause,
    resume,
    reset,
    skip,
    switchSession,
    setActiveTaskId,
  };
}

// Re-export selectors for convenience
export function useTimerState() {
  return useTimerStore(
    useShallow((s) => ({
      sessionType: s.sessionType,
      status: s.status,
      totalMs: s.totalMs,
      remainingMs: s.remainingMs,
      completedCycles: s.completedCycles,
      activeTask: s.activeTask,
      settings: s.settings,
    })),
  );
}

// Request notification permission lazily
export function useNotificationPermission() {
  return useMutation({
    mutationFn: async () => {
      if (typeof Notification === "undefined") return "unsupported" as const;
      if (Notification.permission === "granted") return "granted" as const;
      if (Notification.permission === "denied") return "denied" as const;
      const result = await Notification.requestPermission();
      return result;
    },
  });
}
