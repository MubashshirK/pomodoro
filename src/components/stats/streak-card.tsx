import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  streak: number;
  atRisk?: boolean;
};

export function StreakCard({ streak, atRisk = false }: Props) {
  const label =
    streak === 0
      ? "Start a session to begin a streak"
      : atRisk
        ? `Do a session today to keep your streak`
        : streak === 1
          ? "1 day in a row"
          : `${streak} days in a row`;
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11",
            atRisk
              ? "bg-muted text-muted-foreground"
              : streak > 0
                ? "bg-work/15 text-work"
                : "bg-muted text-muted-foreground",
          )}
        >
          <Flame className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
            {atRisk ? "Streak at risk" : "Current streak"}
          </p>
          <p className="truncate font-mono text-xl font-semibold tabular-nums sm:text-2xl">
            {streak}
          </p>
          <p className="text-xs leading-snug text-muted-foreground line-clamp-2">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
