import { CheckCircle2, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Task } from "@/types";

type Props = {
  tasks: Task[];
};

export function TaskLeaderboard({ tasks }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4 text-work" />
          Top tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            Complete a few pomodoros to see your leaderboard.
          </p>
        ) : (
          <ol className="space-y-3">
            {tasks.map((task, idx) => {
              const target = Math.max(1, task.estimated_pomodoros);
              const pct = Math.min(100, (task.completed_pomodoros / target) * 100);
              return (
                <li key={task.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-medium tabular-nums">
                        {idx + 1}
                      </span>
                      <span
                        className={
                          task.is_completed
                            ? "truncate text-sm text-muted-foreground line-through"
                            : "truncate text-sm"
                        }
                      >
                        {task.title}
                      </span>
                      {task.is_completed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-work" />
                      ) : null}
                    </div>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                      {task.completed_pomodoros}/{task.estimated_pomodoros}
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
