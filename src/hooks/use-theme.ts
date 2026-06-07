"use client";

import { useEffect, useState } from "react";
import { useTheme as useNextTheme } from "next-themes";

export type Theme = "dark" | "light" | "system";

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    theme: mounted ? ((theme ?? "system") as Theme) : ("system" as Theme),
    resolvedTheme: (resolvedTheme ?? "light") as "dark" | "light",
    setTheme: (next: Theme) => {
      setTheme(next);
    },
  };
}
