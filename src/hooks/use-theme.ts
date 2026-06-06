"use client";

import { useTheme as useNextTheme } from "next-themes";

export type Theme = "dark" | "light" | "system";

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  return {
    theme: (theme ?? "system") as Theme,
    resolvedTheme: (resolvedTheme ?? "light") as "dark" | "light",
    setTheme: (next: Theme) => {
      setTheme(next);
    },
  };
}
