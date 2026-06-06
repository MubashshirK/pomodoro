import { useMutation, useQueryClient } from "@tanstack/react-query";
import { localData } from "@/lib/local-data";
import type { SessionType, Task } from "@/types";
import { taskKeys } from "@/hooks/use-tasks";

type LogSessionInput = {
  session_type: SessionType;
  duration_seconds: number;
  task_id?: number | null;
};

export function useLogSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LogSessionInput) => localData.logSession(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export type { LogSessionInput, Task };
