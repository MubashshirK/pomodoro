import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type TaskFilter = "all" | "active" | "completed";

type Props = {
  value: TaskFilter;
  onChange: (value: TaskFilter) => void;
  counts: { all: number; active: number; completed: number };
};

export function TaskFilters({ value, onChange, counts }: Props) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as TaskFilter)}>
      <TabsList>
        {(["all", "active", "completed"] as const).map((k) => (
          <TabsTrigger key={k} value={k} className="gap-1.5">
            <span
              className={cn(
                "rounded-full px-1.5 font-mono text-[10px] tabular-nums",
                value === k
                  ? "bg-foreground/10 text-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {counts[k]}
            </span>
            {k === "all" ? "All" : k === "active" ? "Active" : "Completed"}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
