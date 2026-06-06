"use client";

import { useMemo, useState } from "react";
import { Plus, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskList } from "@/components/tasks/task-list";
import { TaskFilters, type TaskFilter } from "@/components/tasks/task-filters";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskEmptyState } from "@/components/tasks/task-empty-state";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useReorderTasks,
} from "@/hooks/use-tasks";
import type { Task } from "@/types";

export default function TasksPage() {
  const { data, isLoading } = useTasks();
  const create = useCreateTask();
  const update = useUpdateTask();
  const remove = useDeleteTask();
  const reorder = useReorderTasks();

  const [filter, setFilter] = useState<TaskFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const tasks = useMemo(() => data?.tasks ?? [], [data?.tasks]);
  const counts = useMemo(
    () => ({
      all: tasks.length,
      active: tasks.filter((t) => !t.is_completed).length,
      completed: tasks.filter((t) => t.is_completed).length,
    }),
    [tasks],
  );

  const visibleTasks = useMemo(() => {
    if (filter === "active") return tasks.filter((t) => !t.is_completed);
    if (filter === "completed") return tasks.filter((t) => t.is_completed);
    return tasks;
  }, [tasks, filter]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(task: Task) {
    setEditing(task);
    setDialogOpen(true);
  }

  const onSubmit = async (values: {
    title: string;
    notes: string | null;
    estimated_pomodoros: number;
  }) => {
    if (editing) {
      await update.mutateAsync({ id: editing.id, patch: values });
    } else {
      await create.mutateAsync(values);
    }
  };

  const onDelete = async (task: Task) => {
    setDeletingId(task.id);
    try {
      await remove.mutateAsync(task.id);
    } finally {
      setDeletingId(null);
    }
  };

  const onToggleComplete = (task: Task, next: boolean) => {
    update.mutate({ id: task.id, patch: { is_completed: next } });
  };

  const onReorder = (newOrder: (number | string)[]) => {
    const ids = newOrder.map((id) => (typeof id === "string" ? Number.parseInt(id, 10) : id));
    reorder.mutate(ids);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Plan your work, one pomodoro at a time.
          </p>
        </div>
        <Button onClick={openCreate} className="ml-auto gap-1">
          <Plus className="h-4 w-4" />
          New task
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <TaskFilters value={filter} onChange={setFilter} counts={counts} />
        {filter === "all" ? (
          <p className="text-xs text-muted-foreground">
            <ListTodo className="mr-1 inline h-3 w-3" />
            Drag the handle to reorder
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border bg-muted/30"
            />
          ))}
        </div>
      ) : visibleTasks.length === 0 ? (
        <TaskEmptyState filter={filter} onAdd={openCreate} />
      ) : (
        <TaskList
          tasks={visibleTasks}
          onReorder={onReorder}
          onEdit={openEdit}
          onDelete={onDelete}
          onToggleComplete={onToggleComplete}
          deletingId={deletingId}
          draggingEnabled={filter === "all"}
        />
      )}

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editing}
        onSubmit={onSubmit}
        submitting={create.isPending || update.isPending}
      />
    </div>
  );
}
