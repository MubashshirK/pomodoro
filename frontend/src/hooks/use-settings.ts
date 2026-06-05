import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { AppSettings } from "@/types";
import { getErrorMessage } from "@/hooks/use-auth";

export const settingsKeys = {
  all: ["settings"] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: () => api.get<{ settings: AppSettings }>("/settings"),
    staleTime: 60_000,
  });
}

export type SettingsPatch = Partial<Omit<AppSettings, "id" | "updated_at">> & {
  // Internal flag — stripped before sending, suppresses the success toast.
  _silent?: boolean;
};

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: SettingsPatch) => {
      const { _silent, ...rest } = patch;
      void _silent;
      return api.put<{ settings: AppSettings }>("/settings", rest);
    },
    onSuccess: (data, patch) => {
      qc.setQueryData(settingsKeys.all, data);
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      // Suppress the toast for theme-only updates — the topbar/sidebar
      // toggle is an implicit save, not a form submit.
      const keys = Object.keys(patch).filter((k) => k !== "_silent");
      const isThemeOnly = keys.length === 1 && keys[0] === "theme";
      if (!patch._silent && !isThemeOnly) toast.success("Settings saved");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Failed to save settings"));
    },
  });
}
