import { createContext } from "react";

export type TimerActions = {
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
  switchSession: (next: "work" | "shortBreak" | "longBreak") => void;
  setActiveTaskId: (id: number | null) => void;
};

export const TimerActionsContext = createContext<TimerActions | null>(null);
