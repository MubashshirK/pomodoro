import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CheckCircle2,
  Circle,
  GripVertical,
  MoreVertical,
  Pencil,
  Play,
  Target,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTimerStore } from "@/store/timer-store";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

type Props = {
  task: Task;
  draggable: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => Promise<unknown> | unknown;
  onToggleComplete: (task: Task, next: boolean) => void;
  deleting?: boolean;
};

export function TaskItem({
  task,
  draggable,
  onEdit,
  onDelete,
  onToggleComplete,
  deleting,
}: Props) {
  const activeTask = useTimerStore((s) => s.activeTask);
  const setActiveTask = useTimerStore((s) => s.setActiveTask);
  const isActive = activeTask?.id === task.id;

  const sortable = useSortable({ id: task.id, disabled: !draggable });
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortable;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const pct = Math.min(
    100,
    Math.round(
      (task.completed_pomodoros / Math.max(1, task.estimated_pomodoros)) * 100,
    ),
  );
  const done = task.completed_pomodoros >= task.estimated_pomodoros;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors",
        isActive && "border-work/50 bg-work/5",
        task.is_completed && "opacity-70",
        isDragging && "shadow-lg ring-1 ring-work/40",
      )}
    >
      {draggable ? (
        <button
          type="button"
          className="touch-none rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      ) : (
        <span className="w-6" />
      )}

      <Checkbox
        checked={task.is_completed}
        onCheckedChange={(v) => onToggleComplete(task, v === true)}
        aria-label={task.is_completed ? "Mark as active" : "Mark as complete"}
        className="h-5 w-5"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {task.is_completed ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
          ) : isActive ? (
            <Target className="h-3.5 w-3.5 shrink-0 text-work" />
          ) : (
            <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          )}
          <span
            className={cn(
              "truncate text-sm font-medium",
              task.is_completed && "line-through text-muted-foreground",
            )}
          >
            {task.title}
          </span>
        </div>
        {task.notes && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {task.notes}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-2">
          <Progress value={pct} className="h-1 w-20 shrink-0 sm:w-32" />
          <span className="shrink-0 text-xs text-muted-foreground">
            {task.completed_pomodoros} / {task.estimated_pomodoros}
          </span>
        </div>
      </div>

      {!task.is_completed && !isActive ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            setActiveTask({
              id: task.id,
              title: task.title,
              estimated_pomodoros: task.estimated_pomodoros,
              completed_pomodoros: task.completed_pomodoros,
              is_completed: task.is_completed,
            })
          }
          className="gap-1"
        >
          <Play className="h-3 w-3 fill-current" />
          Focus
        </Button>
      ) : isActive ? (
        <button
          type="button"
          onClick={() => setActiveTask(null)}
          title="Click to un-activate"
          aria-label="Un-activate task"
          className="flex items-center gap-1 rounded-full bg-work/15 px-2.5 py-0.5 text-xs font-medium text-work transition-colors hover:bg-work/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Active
          <X className="h-3 w-3" />
        </button>
      ) : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Task actions"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {!task.is_completed && !isActive ? (
            <DropdownMenuItem
              onClick={() =>
                setActiveTask({
                  id: task.id,
                  title: task.title,
                  estimated_pomodoros: task.estimated_pomodoros,
                  completed_pomodoros: task.completed_pomodoros,
                  is_completed: task.is_completed,
                })
              }
            >
              <Play className="h-4 w-4" />
              Set as active
            </DropdownMenuItem>
          ) : isActive ? (
            <DropdownMenuItem onClick={() => setActiveTask(null)}>
              <XCircle className="h-4 w-4" />
              Unset as active
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onClick={() => onEdit(task)}>
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                <AlertDialogDescription>
                  <span className="font-medium text-foreground">
                    "{task.title}"
                  </span>{" "}
                  and its {pluralize(task.completed_pomodoros, "logged pomodoro")}{" "}
                  will be removed. This can't be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(task)}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
