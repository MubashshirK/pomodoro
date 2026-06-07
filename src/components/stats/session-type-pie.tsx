import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { StatsBySessionType } from "@/types";

type Props = {
  byType: StatsBySessionType;
};

type Slice = {
  name: string;
  value: number;
  key: keyof StatsBySessionType;
  color: string;
};

const LABEL: Record<keyof StatsBySessionType, string> = {
  work: "Work",
  shortBreak: "Short break",
  longBreak: "Long break",
};

const COLOR: Record<keyof StatsBySessionType, string> = {
  work: "hsl(142 40% 45%)",
  shortBreak: "hsl(210 45% 52%)",
  longBreak: "hsl(0 55% 50%)",
};

export function SessionTypePie({ byType }: Props) {
  const data: Slice[] = (Object.keys(byType) as (keyof StatsBySessionType)[])
    .map((k) => ({ name: LABEL[k], value: byType[k], key: k, color: COLOR[k] }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = data.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No sessions logged yet
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="88%"
              paddingAngle={3}
              stroke="hsl(var(--background))"
              strokeWidth={3}
              labelLine={false}
              isAnimationActive={false}
            >
              {data.map((s) => (
                <Cell key={s.key} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Total
          </span>
          <span className="font-mono text-2xl font-semibold tabular-nums leading-none">
            {total}
          </span>
          <span className="mt-1 text-[10px] text-muted-foreground">
            {total === 1 ? "session" : "sessions"}
          </span>
        </div>
      </div>

      <ul className="flex w-full flex-col gap-1.5">
        {data.map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <li
              key={s.key}
              className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted"
                  aria-hidden
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                </span>
                <span className="truncate text-muted-foreground">{s.name}</span>
              </div>
              <div className="flex shrink-0 items-baseline gap-1.5">
                <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                  {s.value}
                </span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {pct}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
