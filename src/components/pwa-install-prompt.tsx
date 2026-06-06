"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const STORAGE_KEY = "pwa-install-dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "1") return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible || !deferred) return null;

  async function accept() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
    setDeferred(null);
  }

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
    setDeferred(null);
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-lg border bg-card p-3 shadow-lg">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-work/15 text-work">
        <Download className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium">Install Pomodoro Pro</p>
        <p className="truncate text-xs text-muted-foreground">
          Add it to your home screen.
        </p>
      </div>
      <Button size="sm" onClick={accept}>
        Install
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={dismiss}
        aria-label="Dismiss"
        className="h-7 w-7"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
