import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTimerStore, colorVarFor } from "@/store/timer-store";
import { useTimerActions } from "@/hooks/use-timer-actions";
import type { SessionType } from "@/types";

const items: { value: SessionType; label: string }[] = [
  { value: "work", label: "Focus" },
  { value: "shortBreak", label: "Short" },
  { value: "longBreak", label: "Long" },
];

export function SessionTypeSwitch() {
  const sessionType = useTimerStore((s) => s.sessionType);
  const status = useTimerStore((s) => s.status);
  const { switchSession } = useTimerActions();
  const disabled = status === "running" || status === "paused";

  return (
    <Tabs
      value={sessionType}
      onValueChange={(v) => switchSession(v as SessionType)}
    >
      <TabsList className="grid h-11 w-full grid-cols-3 items-center justify-center p-1.5">
        {items.map((it) => {
          const active = it.value === sessionType;
          return (
            <TabsTrigger
              key={it.value}
              value={it.value}
              disabled={disabled && !active}
              className="h-full w-full items-center justify-center gap-2"
            >
              <span
                className="inline-block h-2 w-2 rounded-full transition-opacity"
                style={{
                  background: colorVarFor(it.value),
                  opacity: active ? 1 : 0.5,
                }}
              />
              <span className="-ml-5">{it.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
