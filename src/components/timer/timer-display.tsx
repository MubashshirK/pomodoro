import { formatMs } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  ms: number;
  className?: string;
  compact?: boolean;
};

export function TimerDisplay({ ms, className, compact }: Props) {
  return (
    <div
      className={cn(
        "font-dseg font-bold tabular-nums leading-none tracking-tight",
        compact ? "text-6xl" : "text-7xl",
        className,
      )}
      style={{ fontFamily: "var(--font-dseg)" }}
    >
      {formatMs(ms)}
    </div>
  );
}
