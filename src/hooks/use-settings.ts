import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { AppSettings } from "@/types";

export const settingsKeys = {
  all: ["settings"] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: () => api.get<{ settings: AppSettings }>("/api/settings"),
    staleTime: 30_000,
  });
}

export type SettingsPatch = Partial<Omit<AppSettings, "id" | "updated_at">> & {
  _silent?: boolean;
};

function getErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (err instanceof Error) return err.message;
  return fallback;
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: SettingsPatch) => {
      const { _silent: _silent, ...rest } = patch;
      void _silent;
      return api.patch<{ settings: AppSettings }>("/api/settings", rest);
    },
    onSuccess: (data, patch) => {
      qc.setQueryData(settingsKeys.all, data);
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      const keys = Object.keys(patch).filter((k) => k !== "_silent");
      const isThemeOnly = keys.length === 1 && keys[0] === "theme";
      if (!patch._silent && !isThemeOnly) toast.success("Settings saved");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Failed to save settings"));
    },
  });
}
