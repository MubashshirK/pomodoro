import { useEffect } from "react";
import { useTimer } from "@/hooks/use-timer";
import { useTimerStore } from "@/store/timer-store";
import type { SessionType } from "@/types";

const TYPING_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function useKeyboardShortcuts() {
  const { start, pause, resume, reset, skip, switchSession } = useTimer();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (TYPING_TAGS.has(target.tagName) || target.isContentEditable)) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const k = e.key.toLowerCase();
      if (k === " " || e.code === "Space") {
        e.preventDefault();
        const status = useTimerStore.getState().status;
        if (status === "idle") start();
        else if (status === "running") pause();
        else if (status === "paused") resume();
        return;
      }
      if (k === "r") {
        e.preventDefault();
        reset();
        return;
      }
      if (k === "s") {
        e.preventDefault();
        skip();
        return;
      }
      if (["1", "2", "3"].includes(k)) {
        e.preventDefault();
        if (useTimerStore.getState().status === "idle") {
          const map: Record<string, SessionType> = {
            "1": "work",
            "2": "shortBreak",
            "3": "longBreak",
          };
          switchSession(map[k]);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [start, pause, resume, reset, skip, switchSession]);
}
