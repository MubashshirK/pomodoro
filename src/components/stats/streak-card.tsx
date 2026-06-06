import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  streak: number;
};

export function StreakCard({ streak }: Props) {
  const label =
    streak === 0
      ? "Start a session to begin a streak"
      : streak === 1
        ? "1 day in a row"
        : `${streak} days in a row`;
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-lg",
            streak > 0 ? "bg-work/15 text-work" : "bg-muted text-muted-foreground",
          )}
        >
          <Flame className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Current streak
          </p>
          <p className="text-2xl font-semibold tabular-nums">{streak}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
