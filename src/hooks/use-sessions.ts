import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { PomodoroSessionLog, SessionType } from "@/types";
import { taskKeys } from "@/hooks/use-tasks";

type LogSessionInput = {
  session_type: SessionType;
  duration_seconds: number;
  task_id?: number | null;
};

export function useLogSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LogSessionInput) =>
      api.post<{ session: PomodoroSessionLog }>("/api/sessions", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
