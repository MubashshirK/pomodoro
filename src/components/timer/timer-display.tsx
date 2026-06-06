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
        "font-mono font-semibold tabular-nums tracking-tight",
        compact ? "text-5xl" : "text-7xl",
        className,
      )}
    >
      {formatMs(ms)}
    </div>
  );
}
