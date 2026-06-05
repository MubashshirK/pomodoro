import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { StatsBySessionType } from "@/types";

type Props = {
  byType: StatsBySessionType;
};

type Slice = { name: string; value: number; key: keyof StatsBySessionType; color: string };

const LABEL: Record<keyof StatsBySessionType, string> = {
  work: "Work",
  shortBreak: "Short break",
  longBreak: "Long break",
};

const COLOR: Record<keyof StatsBySessionType, string> = {
  work: "hsl(var(--bar))",
  shortBreak: "hsl(var(--bar))",
  longBreak: "hsl(var(--bar))",
};

function PieTooltip({
  active,
  payload,
  coordinate,
}: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0 || !coordinate) return null;
  const { x, y } = coordinate;
  if (typeof x !== "number" || typeof y !== "number") return null;
  const entry = payload[0];
  const label = entry.name;
  const value = entry.value as number;
  return (
    <div
      className="pointer-events-none absolute z-50 rounded-lg border border-border/50 px-3 py-2 text-sm shadow-lg whitespace-nowrap"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, calc(-100% - 14px))",
        transition: "transform 120ms ease-out, left 120ms ease-out, top 120ms ease-out",
        background: "hsl(var(--tooltip-bg))",
        color: "hsl(var(--tooltip-fg))",
      }}
    >
      <div className="font-semibold">{label}</div>
      <div className="text-muted-foreground">{value} sessions</div>
    </div>
  );
}

export function SessionTypePie({ byType }: Props) {
  const data: Slice[] = (Object.keys(byType) as (keyof StatsBySessionType)[])
    .map((k) => ({ name: LABEL[k], value: byType[k], key: k, color: COLOR[k] }))
    .filter((s) => s.value > 0);
  const total = data.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No sessions logged yet
      </div>
    );
  }

  return (
    <div className="flex h-72 w-full flex-col">
      <div className="relative min-h-0 flex-1 overflow-visible">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="48%"
              outerRadius="82%"
              paddingAngle={3}
              stroke="var(--background)"
              strokeWidth={2}
              label={({ percent }) =>
                percent > 0.08 ? `${Math.round(percent * 100)}%` : null
              }
              labelLine={false}
              isAnimationActive={false}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={<PieTooltip />}
              cursor={{ fill: "hsl(var(--tooltip-fg))", fillOpacity: 0.08 }}
              isAnimationActive={false}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pb-1 text-sm">
        {data.map((entry) => {
          const pct = Math.round((entry.value / total) * 100);
          return (
            <li key={entry.key} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/5 dark:ring-white/10"
                style={{ background: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="font-medium tabular-nums">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
