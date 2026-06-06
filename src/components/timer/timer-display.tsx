import { formatMs } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  ms: number;
  className?: string;
};

export function TimerDisplay({ ms, className }: Props) {
  return (
    <div
      className={cn(
        "font-mono text-7xl font-semibold tabular-nums tracking-tight",
        className,
      )}
    >
      {formatMs(ms)}
    </div>
  );
}
