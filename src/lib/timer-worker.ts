type WorkerInMessage =
  | { type: "start"; durationMs: number }
  | { type: "pause" }
  | { type: "reset" };

type WorkerOutMessage =
  | { type: "tick"; remainingMs: number }
  | { type: "paused"; remainingMs: number }
  | { type: "done" }
  | { type: "reset_done" };

let endTime: number | null = null;
let interval: ReturnType<typeof setInterval> | null = null;

function clearTick() {
  if (interval !== null) {
    clearInterval(interval);
    interval = null;
  }
}

function post(msg: WorkerOutMessage) {
  (self as unknown as Worker).postMessage(msg);
}

self.addEventListener("message", (e: MessageEvent<WorkerInMessage>) => {
  const msg = e.data;
  if (msg.type === "start") {
    clearTick();
    endTime = Date.now() + Math.max(0, msg.durationMs);
    interval = setInterval(() => {
      if (endTime === null) return;
      const remaining = Math.max(0, endTime - Date.now());
      post({ type: "tick", remainingMs: remaining });
      if (remaining <= 0) {
        clearTick();
        endTime = null;
        post({ type: "done" });
      }
    }, 250);
  } else if (msg.type === "pause") {
    if (endTime !== null) {
      const remaining = Math.max(0, endTime - Date.now());
      clearTick();
      endTime = null;
      post({ type: "paused", remainingMs: remaining });
    } else {
      post({ type: "paused", remainingMs: 0 });
    }
  } else if (msg.type === "reset") {
    clearTick();
    endTime = null;
    post({ type: "reset_done" });
  }
});
