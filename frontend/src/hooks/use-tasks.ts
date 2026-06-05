import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Task } from "@/types";

export const taskKeys = {
  all: ["tasks"] as const,
  list: () => [...taskKeys.all, "list"] as const,
};

export function useTasks() {
  return useQuery({
    queryKey: taskKeys.list(),
    queryFn: () => api.get<{ tasks: Task[] }>("/tasks"),
    staleTime: 15_000,
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
      api.post<{ task: Task }>("/tasks", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      toast.success("Task created");
    },
    onError: (err) => {
      toast.error((err as Error).message || "Could not create task");
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
      api.put<{ task: Task }>(`/tasks/${id}`, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: (err) => {
      toast.error((err as Error).message || "Could not update task");
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<{ message: string }>(`/tasks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      toast.success("Task deleted");
    },
    onError: (err) => {
      toast.error((err as Error).message || "Could not delete task");
    },
  });
}

export function useReorderTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (order: number[]) =>
      api.post<{ tasks: Task[] }>("/tasks/reorder", { order }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: (err) => {
      toast.error((err as Error).message || "Could not reorder tasks");
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
