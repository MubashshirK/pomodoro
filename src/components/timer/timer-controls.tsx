import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTimerActions } from "@/hooks/use-timer-actions";
import { useTimerStore } from "@/store/timer-store";

export function TimerControls() {
  const status = useTimerStore((s) => s.status);
  const { start, pause, resume, reset, skip } = useTimerActions();

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {status === "idle" || status === "completed" ? (
        <Button
          size="lg"
          onClick={start}
          className="min-w-32 gap-2"
          aria-label="Start timer"
        >
          <Play className="h-4 w-4 fill-current" />
          Start
        </Button>
      ) : null}
      {status === "running" ? (
        <Button
          size="lg"
          variant="secondary"
          onClick={pause}
          className="min-w-32 gap-2"
          aria-label="Pause timer"
        >
          <Pause className="h-4 w-4" />
          Pause
        </Button>
      ) : null}
      {status === "paused" ? (
        <Button
          size="lg"
          onClick={resume}
          className="min-w-32 gap-2"
          aria-label="Resume timer"
        >
          <Play className="h-4 w-4 fill-current" />
          Resume
        </Button>
      ) : null}
      <Button
        size="lg"
        variant="outline"
        onClick={reset}
        disabled={status === "idle"}
        className="gap-2"
        aria-label="Reset timer"
      >
        <RotateCcw className="h-4 w-4" />
        Reset
      </Button>
      <Button
        size="lg"
        variant="ghost"
        onClick={skip}
        disabled={status === "idle" && false}
        className="gap-2"
        aria-label="Skip to next session"
      >
        <SkipForward className="h-4 w-4" />
        Skip
      </Button>
    </div>
  );
}
