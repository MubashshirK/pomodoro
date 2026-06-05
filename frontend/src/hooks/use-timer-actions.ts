import { useContext } from "react";
import {
  TimerActionsContext,
  type TimerActions,
} from "@/components/timer/timer-context";

export function useTimerActions(): TimerActions {
  const ctx = useContext(TimerActionsContext);
  if (!ctx) {
    throw new Error("useTimerActions must be used within a TimerProvider");
  }
  return ctx;
}
