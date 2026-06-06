"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Timer,
} from "lucide-react";
import type { Session } from "next-auth";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "sidebar-collapsed";
const EXPANDED = 240;
const COLLAPSED = 64;

export function AppShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const width = collapsed ? COLLAPSED : EXPANDED;

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <div className="flex min-h-screen w-full">
        <aside
          aria-label="Primary"
          className={cn(
            "sticky top-0 hidden h-screen shrink-0 border-r bg-sidebar transition-[width] duration-200 ease-out md:flex md:flex-col",
          )}
          style={{ width }}
        >
          <Link
            href="/timer"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-5 py-3 font-semibold tracking-tight transition-colors hover:bg-sidebar-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              collapsed && "justify-center px-0",
            )}
            title={collapsed ? "Pomodoro Pro" : undefined}
            aria-label="Pomodoro Pro — go to timer"
          >
            <div className="flex items-center gap-2">
              <Timer className="h-7 w-7 shrink-0 text-work" />
              {!collapsed ? (
                <span className="truncate text-lg">Pomodoro Pro</span>
              ) : null}
            </div>
          </Link>
          <Separator />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SidebarNav collapsed={collapsed} />
          </div>
          <Separator />
          <div
            className={cn("shrink-0 p-2", collapsed && "flex justify-center px-2")}
          >
            <ThemeToggle expanded={!collapsed} />
          </div>
          <Separator />
          <div
            className={cn("shrink-0 p-2", collapsed && "flex justify-center px-2")}
          >
            <UserMenu name={session?.user?.name} email={session?.user?.email} isGuest={session?.user?.isGuest} expanded={!collapsed} />
          </div>
          <Separator />
          <div
            className={cn("shrink-0 p-2", collapsed && "flex justify-center")}
          >
            <Button
              variant="ghost"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand" : "Collapse"}
              className={cn(
                "h-10 w-full justify-start gap-2 px-3 text-sm font-medium",
                collapsed && "h-10 w-10 justify-center px-0",
              )}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4 shrink-0" />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4 shrink-0" />
                  <span>Collapse</span>
                </>
              )}
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
            <Link
              href="/timer"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Pomodoro Pro — go to timer"
            >
              <Timer className="h-7 w-7 shrink-0 text-work" />
              <span className="mt-0.5 truncate text-xl font-semibold tracking-tight">
                Pomodoro Pro
              </span>
            </Link>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open menu"
                className="-mr-2 ml-auto h-10 w-10"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
          </header>
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="mx-auto flex h-full w-full max-w-5xl flex-col px-4 pt-3 pb-4 sm:px-6 sm:py-6">
              {children}
            </div>
          </main>
        </div>
      </div>

      <SheetContent side="right" className="flex w-64 flex-col p-0">
        <SheetHeader className="pb-2 pl-3 pr-5 pt-4">
          <SheetTitle className="text-xl">
            <Link
              href="/timer"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-md transition-colors hover:bg-sidebar-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Pomodoro Pro — go to timer"
            >
              <Timer className="mt-0.5 h-6 w-6 text-work" />
              <span className="mt-0.5">Pomodoro Pro</span>
            </Link>
          </SheetTitle>
        </SheetHeader>
        <Separator />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarNav onNavigate={() => setMobileOpen(false)} size="lg" />
        </div>
        <Separator />
        <div className="shrink-0 p-2">
          <ThemeToggle expanded />
        </div>
        <Separator />
        <div className="shrink-0 px-2 py-0.5">
          <UserMenu name={session?.user?.name} email={session?.user?.email} isGuest={session?.user?.isGuest} expanded />
        </div>
        <Separator />
        <div className="shrink-0 px-4 py-1 text-center text-[11px] text-muted-foreground">
          <span>Built by — Mubashshir Khan</span>
        </div>
      </SheetContent>
    </Sheet>
  );
}
