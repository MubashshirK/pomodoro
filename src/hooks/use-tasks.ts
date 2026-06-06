import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { localData } from "@/lib/local-data";
import type { Task } from "@/types";

export const taskKeys = {
  all: ["tasks"] as const,
  list: () => [...taskKeys.all, "list"] as const,
};

export function useTasks() {
  return useQuery({
    queryKey: taskKeys.list(),
    queryFn: () => ({ tasks: localData.listTasks() }),
    staleTime: Infinity,
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
    mutationFn: async (input: CreateInput) => localData.addTask(input),
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
    mutationFn: async ({ id, patch }: UpdateInput) => localData.updateTask(id, patch),
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
    mutationFn: async (id: number) => {
      localData.deleteTask(id);
      return { message: "ok" };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      qc.invalidateQueries({ queryKey: ["stats"] });
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
    mutationFn: async (order: number[]) => localData.reorderTasks(order),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: (err) => {
      toast.error((err as Error).message || "Could not reorder tasks");
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
