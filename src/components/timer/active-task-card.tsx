import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, X, Target, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTasks } from "@/hooks/use-tasks";
import { useTimerStore } from "@/store/timer-store";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

export function ActiveTaskCard() {
  const activeTask = useTimerStore((s) => s.activeTask);
  const setActiveTask = useTimerStore((s) => s.setActiveTask);
  const { data } = useTasks();
  const [open, setOpen] = useState(false);

  const tasks = (data?.tasks ?? []).filter((t) => !t.is_completed);

  useEffect(() => {
    if (!activeTask) return;
    const fresh = data?.tasks.find((t) => t.id === activeTask.id);
    if (!fresh) return;
    if (fresh.is_completed) {
      setActiveTask(null);
      return;
    }
    if (
      fresh.completed_pomodoros !== activeTask.completed_pomodoros ||
      fresh.estimated_pomodoros !== activeTask.estimated_pomodoros
    ) {
      setActiveTask({
        id: fresh.id,
        title: fresh.title,
        estimated_pomodoros: fresh.estimated_pomodoros,
        completed_pomodoros: fresh.completed_pomodoros,
        is_completed: fresh.is_completed,
      });
    }
  }, [data, activeTask, setActiveTask]);

  const setPick = (t: Task) => {
    setActiveTask({
      id: t.id,
      title: t.title,
      estimated_pomodoros: t.estimated_pomodoros,
      completed_pomodoros: t.completed_pomodoros,
      is_completed: t.is_completed,
    });
    setOpen(false);
  };

  const pct = activeTask
    ? Math.min(
        100,
        Math.round(
          (activeTask.completed_pomodoros /
            Math.max(1, activeTask.estimated_pomodoros)) *
            100,
        ),
      )
    : 0;
  const done =
    !!activeTask &&
    activeTask.completed_pomodoros >= activeTask.estimated_pomodoros;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!activeTask ? (
        <motion.div
          key="empty"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="rounded-xl border border-dashed bg-muted/30 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>No active task</span>
            </div>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1">
                  <ListTodo className="h-3.5 w-3.5" />
                  Choose
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-0">
                <TaskList tasks={tasks} onPick={setPick} />
              </PopoverContent>
            </Popover>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="active"
          layout
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "rounded-xl border bg-card p-4",
            done && "border-emerald-500/40 bg-emerald-500/5",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <Target className="h-4 w-4 shrink-0 text-work" />
              )}
              <span className="truncate text-sm font-medium">
                {activeTask.title}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="ghost" className="gap-1">
                    Change
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-0">
                  <TaskList
                    tasks={tasks}
                    currentId={activeTask.id}
                    onPick={setPick}
                  />
                </PopoverContent>
              </Popover>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setActiveTask(null)}
                aria-label="Clear active task"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <motion.div
            className="mt-3 space-y-1.5"
            initial={false}
            animate={{ opacity: 1 }}
          >
            <Progress value={pct} className="h-1.5" />
            <p className="text-xs text-muted-foreground">
              <span className="font-mono tabular-nums">
                {activeTask.completed_pomodoros}
              </span>{" "}
              of{" "}
              <span className="font-mono tabular-nums">
                {activeTask.estimated_pomodoros}
              </span>{" "}
              pomodoros
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TaskList({
  tasks,
  currentId,
  onPick,
}: {
  tasks: Task[];
  currentId?: number;
  onPick: (t: Task) => void;
}) {
  if (tasks.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No active tasks. Add some in the Tasks page.
      </div>
    );
  }
  return (
    <ScrollArea className="max-h-72">
      <ul className="p-1">
        {tasks.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onPick(t)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                currentId === t.id && "bg-accent text-accent-foreground",
              )}
            >
              <ListTodo className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate">{t.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}
