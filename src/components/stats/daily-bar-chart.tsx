import { format, parseISO } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StatsPerDay } from "@/types";
import { humanizeSeconds } from "@/lib/format";

type Props = {
  data: StatsPerDay[];
  period: "day" | "week" | "month";
};

type Datum = { label: string; minutes: number; count: number };

function buildData(perDay: StatsPerDay[]): Datum[] {
  return perDay.map((d) => ({
    label: format(parseISO(d.date), "MMM d"),
    minutes: Math.round(d.focus_seconds / 60),
    count: d.count,
  }));
}

function xAxisInterval(period: "day" | "week" | "month"): number {
  if (period === "month") return 4;
  if (period === "week") return 0;
  return 0;
}

export function DailyBarChart({ data, period }: Props) {
  const chartData = buildData(data);
  const hasData = chartData.some((d) => d.count > 0);

  return (
    <div className="h-80 w-full">
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
            barCategoryGap="22%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-border"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
              fontSize={11}
              interval={xAxisInterval(period)}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
              fontSize={11}
              width={40}
              label={{
                value: "min",
                angle: -90,
                position: "insideLeft",
                offset: 14,
                className: "fill-muted-foreground",
                fontSize: 11,
              }}
            />
            <Tooltip
              cursor={false}
              contentStyle={{
                background: "hsl(var(--tooltip-bg))",
                border: "1px solid hsl(var(--border) / 0.5)",
                borderRadius: 8,
                fontSize: 12,
                color: "hsl(var(--tooltip-fg))",
                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                padding: "6px 10px",
              }}
              labelStyle={{ color: "hsl(var(--tooltip-fg))", fontWeight: 600, marginBottom: 2 }}
              itemStyle={{ color: "hsl(var(--tooltip-fg))", padding: 0 }}
              formatter={(value: number, key: string) => {
                if (key === "minutes") {
                  return [`${value} min (${humanizeSeconds(value * 60)})`, "Focus"];
                }
                return [value, "Pomodoros"];
              }}
            />
            <Bar
              dataKey="minutes"
              fill="hsl(var(--bar))"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          No focus time yet
        </div>
      )}
    </div>
  );
}
