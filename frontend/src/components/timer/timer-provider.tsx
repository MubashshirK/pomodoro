import { useMemo, type ReactNode } from "react";
import { useTimer } from "@/hooks/use-timer";
import { TimerActionsContext, type TimerActions } from "@/components/timer/timer-context";

export function TimerProvider({ children }: { children: ReactNode }) {
  const actions: TimerActions = useTimer();
  const value = useMemo(() => actions, [actions]);
  return (
    <TimerActionsContext.Provider value={value}>
      {children}
    </TimerActionsContext.Provider>
  );
}
