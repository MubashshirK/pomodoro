import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { Task } from "@/types";

export const taskKeys = {
  all: ["tasks"] as const,
  list: () => [...taskKeys.all, "list"] as const,
};

export function useTasks() {
  return useQuery({
    queryKey: taskKeys.list(),
    queryFn: () => api.get<{ tasks: Task[] }>("/api/tasks"),
    staleTime: 30_000,
  });
}

type CreateInput = {
  title: string;
  notes?: string | null;
  estimated_pomodoros?: number;
};

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInput) =>
      api.post<{ task: Task }>("/api/tasks", input).then((r) => r.task),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      toast.success("Task created");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not create task");
    },
  });
}

type UpdateInput = {
  id: number;
  patch: Partial<Pick<Task, "title" | "notes" | "estimated_pomodoros" | "is_completed">>;
};

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: UpdateInput) =>
      api.patch<{ task: Task }>(`/api/tasks/${id}`, patch).then((r) => r.task),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not update task");
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.delete<{ message: string }>(`/api/tasks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Task deleted");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not delete task");
    },
  });
}

export function useReorderTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (order: number[]) =>
      api.post<{ message: string }>("/api/tasks/reorder", { order }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not reorder tasks");
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
