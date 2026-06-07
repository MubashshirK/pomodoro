import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "work" | "shortBreak" | "longBreak";
};

const toneClass: Record<NonNullable<Props["tone"]>, string> = {
  default: "text-foreground",
  work: "text-work",
  shortBreak: "text-shortBreak",
  longBreak: "text-longBreak",
};

export function StatCard({ icon: Icon, label, value, hint, tone = "default" }: Props) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted sm:h-11 sm:w-11",
            toneClass[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
            {label}
          </p>
          <p className="truncate font-mono text-xl font-semibold tabular-nums sm:text-2xl">
            {value}
          </p>
          {hint ? (
            <p className="text-xs leading-snug text-muted-foreground line-clamp-2">
              {hint}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
