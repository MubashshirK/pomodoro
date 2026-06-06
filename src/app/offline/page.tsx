import { Timer } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <Timer className="h-12 w-12 text-work" />
      <h1 className="text-2xl font-semibold tracking-tight">You're offline</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        We couldn't reach the network. Reconnect to sync your tasks and
        sessions.
      </p>
    </div>
  );
}
