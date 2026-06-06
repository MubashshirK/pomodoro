"use client";

import { AppShell } from "@/components/layout/app-shell";
import { TimerProvider } from "@/components/timer/timer-provider";
import type { Session } from "next-auth";

export function AppLayoutShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <TimerProvider>
      <AppShell session={session}>{children}</AppShell>
    </TimerProvider>
  );
}
