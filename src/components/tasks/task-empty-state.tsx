import { ListTodo, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  filter: "all" | "active" | "completed";
  onAdd: () => void;
};

export function TaskEmptyState({ filter, onAdd }: Props) {
  if (filter === "active") {
    return (
      <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center">
        <ListTodo className="mx-auto h-8 w-8 text-muted-foreground" />
        <h3 className="mt-3 font-medium">No active tasks</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          You've finished everything. Time to plan the next thing.
        </p>
        <Button onClick={onAdd} className="mt-4 gap-1">
          <Plus className="h-4 w-4" />
          Add a task
        </Button>
      </div>
    );
  }
  if (filter === "completed") {
    return (
      <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center">
        <ListTodo className="mx-auto h-8 w-8 text-muted-foreground" />
        <h3 className="mt-3 font-medium">Nothing completed yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Tasks you mark as complete will show up here.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center">
      <ListTodo className="mx-auto h-8 w-8 text-muted-foreground" />
      <h3 className="mt-3 font-medium">No tasks yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Plan your work. Each task tracks its own pomodoros.
      </p>
      <Button onClick={onAdd} className="mt-4 gap-1">
        <Plus className="h-4 w-4" />
        Create your first task
      </Button>
    </div>
  );
}
