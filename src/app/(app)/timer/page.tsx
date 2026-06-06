"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, Coffee, Flame, Repeat } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TimerRing } from "@/components/timer/timer-ring";
import { TimerDisplay } from "@/components/timer/timer-display";
import { SessionTypeSwitch } from "@/components/timer/session-type-switch";
import { TimerControls } from "@/components/timer/timer-controls";
import { ActiveTaskCard } from "@/components/timer/active-task-card";
import { useTimerState, useNotificationPermission } from "@/hooks/use-timer";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useStats } from "@/hooks/use-stats";
import { sessionLabel, colorVarFor } from "@/store/timer-store";
import { cn } from "@/lib/utils";

export default function TimerPage() {
  const { sessionType, status, totalMs, remainingMs, completedCycles, settings } =
    useTimerState();
  useKeyboardShortcuts();
  const notifPerm = useNotificationPermission();
  const { data: stats } = useStats("day");
  const streak = stats?.current_streak ?? 0;

  const [ringSize, setRingSize] = useState(260);
  useEffect(() => {
    const update = () => setRingSize(window.innerWidth < 640 ? 210 : 260);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const notifPermMutateRef = useRef(notifPerm.mutate);
  useEffect(() => {
    notifPermMutateRef.current = notifPerm.mutate;
  }, [notifPerm.mutate]);

  useEffect(() => {
    if (
      status === "running" &&
      settings?.notifications_enabled &&
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      notifPermMutateRef.current();
    }
  }, [status, settings?.notifications_enabled]);

  const cyclesLimit = settings?.cycles_until_long_break ?? 4;
  const cycleNumber = (completedCycles % cyclesLimit) + 1;
  const accent = colorVarFor(sessionType);

  return (
    <div className="flex h-full flex-col gap-2 sm:gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Timer
          </h1>
          <p className="hidden text-sm text-muted-foreground sm:block">
            Focus, take a break, repeat.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(
              "gap-1.5 rounded-full px-2.5 font-medium",
              streak > 0
                ? "bg-work/15 text-work hover:bg-work/20"
                : "bg-muted text-muted-foreground hover:bg-muted",
            )}
            title={
              streak === 0
                ? "Start a session to begin a streak"
                : streak === 1
                  ? "1 day in a row"
                  : `${streak} days in a row`
            }
          >
            <Flame className="h-3 w-3 shrink-0" />
            <span>
              <span className="font-mono tabular-nums">{streak}</span>{" "}
              {streak === 1 ? "day" : "days"}
            </span>
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <Repeat className="h-3 w-3" />
            <span>
              Cycle{" "}
              <span className="font-mono tabular-nums">
                {cycleNumber} / {cyclesLimit}
              </span>
            </span>
          </Badge>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-3 sm:gap-4">
        <SessionTypeSwitch />

        <Card className="overflow-hidden border-border/60">
          <CardContent className="flex flex-col items-center gap-1 py-4 sm:py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={sessionType}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider"
                style={{ color: accent }}
              >
                {sessionType !== "work" ? (
                  <Coffee className="h-3.5 w-3.5" />
                ) : null}
                {sessionLabel(sessionType)}
              </motion.div>
            </AnimatePresence>

            <TimerRing
              remainingMs={remainingMs}
              totalMs={totalMs}
              sessionType={sessionType}
              size={ringSize}
              strokeWidth={8}
              className="my-1 sm:my-2"
            >
              <TimerDisplay ms={remainingMs} compact={ringSize < 240} />
            </TimerRing>

            <TimerControls />
          </CardContent>
        </Card>

        <ActiveTaskCard />

        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground">
          <div className="hidden items-center gap-2 sm:flex">
            <Keyboard className="h-3 w-3" />
            <span>
              <kbd className="rounded border bg-background px-1 py-0.5">Space</kbd>{" "}
              play
            </span>
            <span>
              <kbd className="rounded border bg-background px-1 py-0.5">R</kbd> reset
            </span>
            <span>
              <kbd className="rounded border bg-background px-1 py-0.5">S</kbd> skip
            </span>
          </div>
          <Link
            href="/tasks"
            className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Manage tasks →
          </Link>
        </div>
      </div>
    </div>
  );
}
