import { cn } from "@/lib/utils";
import { colorVarFor } from "@/store/timer-store";
import type { SessionType } from "@/types";

type Props = {
  remainingMs: number;
  totalMs: number;
  sessionType: SessionType;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
  className?: string;
};

export function TimerRing({
  remainingMs,
  totalMs,
  sessionType,
  size = 320,
  strokeWidth = 10,
  children,
  className,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = Math.max(1, totalMs);
  const progress = Math.max(0, Math.min(1, (totalMs - remainingMs) / safeTotal));
  const offset = circumference * (1 - progress);
  const color = colorVarFor(sessionType);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="timer"
      aria-live="polite"
      aria-label={`${sessionType} timer`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          style={{ stroke: "hsl(var(--border))" }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            stroke: color,
            transition: "stroke-dashoffset 250ms linear",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
