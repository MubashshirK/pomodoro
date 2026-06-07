import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { StatsBySessionType } from "@/types";
import { humanizeSeconds } from "@/lib/format";

type Props = {
  byType: StatsBySessionType;
  focusSeconds?: { work?: number; shortBreak?: number; longBreak?: number };
};

type SliceKey = keyof StatsBySessionType;
type Slice = {
  key: SliceKey;
  name: string;
  short: string;
  value: number;
  color: string;
  ringClass: string;
  softClass: string;
};

const META: Record<SliceKey, { name: string; short: string; ringClass: string; softClass: string }> = {
  work: {
    name: "Work",
    short: "Work",
    ringClass: "text-work",
    softClass: "bg-work/15",
  },
  shortBreak: {
    name: "Short break",
    short: "Short",
    ringClass: "text-shortBreak",
    softClass: "bg-shortBreak/15",
  },
  longBreak: {
    name: "Long break",
    short: "Long",
    ringClass: "text-longBreak",
    softClass: "bg-longBreak/15",
  },
};

export function SessionTypePie({ byType, focusSeconds }: Props) {
  const total = (Object.keys(byType) as SliceKey[]).reduce(
    (sum, k) => sum + byType[k],
    0,
  );

  const slices: Slice[] = (Object.keys(byType) as SliceKey[])
    .map((k) => ({
      key: k,
      name: META[k].name,
      short: META[k].short,
      value: byType[k],
      color: `var(--${k === "work" ? "work" : k === "shortBreak" ? "short-break" : "long-break"})`,
      ringClass: META[k].ringClass,
      softClass: META[k].softClass,
    }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);

  if (total === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No sessions logged yet
      </div>
    );
  }

  const chartData = slices.map((s) => ({ name: s.name, value: s.value }));
  const dominant = slices[0];
  const totalFocusSeconds = slices.reduce((sum, s) => {
    const seconds = focusSeconds?.[s.key] ?? 0;
    return sum + seconds;
  }, 0);

  return (
    <div className="flex flex-col gap-5 pt-1 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative mx-auto h-44 w-44 shrink-0 sm:mx-0 sm:h-48 sm:w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              stroke="var(--background)"
              strokeWidth={3}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
              cornerRadius={4}
            >
              {slices.map((s) => (
                <Cell key={s.key} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Total
          </span>
          <span className="font-mono text-3xl font-semibold tabular-nums leading-none">
            {total}
          </span>
          <span className="mt-1 text-[10px] text-muted-foreground">
            {total === 1 ? "session" : "sessions"}
          </span>
        </div>
      </div>

      <ul className="flex min-w-0 flex-1 flex-col gap-3">
        {slices.map((s) => {
          const pct = total > 0 ? (s.value / total) * 100 : 0;
          const seconds = focusSeconds?.[s.key] ?? 0;
          const timeLabel = seconds > 0 ? humanizeSeconds(seconds) : null;
          return (
            <li
              key={s.key}
              className="group flex flex-col gap-1.5 rounded-md"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${s.softClass}`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${s.ringClass}`}
                      style={{ backgroundColor: s.color }}
                    />
                  </span>
                  <span className="truncate text-sm font-medium">{s.name}</span>
                </div>
                <div className="flex shrink-0 items-baseline gap-1.5">
                  <span className="font-mono text-sm font-semibold tabular-nums">
                    {s.value}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {Math.round(pct)}%
                  </span>
                </div>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: s.color,
                  }}
                />
              </div>
              {timeLabel ? (
                <p className="text-[11px] text-muted-foreground">
                  {timeLabel}
                  {s.key === dominant?.key && totalFocusSeconds > 0 ? (
                    <span className="ml-1.5 text-muted-foreground/70">
                      · most of your time
                    </span>
                  ) : null}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
