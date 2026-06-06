"use client";

import { signOut } from "next-auth/react";
import { LogOut, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function UserMenu({
  name,
  email,
  expanded,
}: {
  name?: string | null;
  email?: string | null;
  expanded: boolean;
}) {
  if (!expanded) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Account menu"
            className="h-9 w-9"
          >
            <UserIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="right" sideOffset={8} className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium">{name || "Account"}</p>
            {email ? (
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            ) : null}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/sign-in" })}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
            "hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-work/15 text-work">
            <UserIcon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {name || "Account"}
            </p>
            {email ? (
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            ) : null}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{name || "Account"}</p>
          {email ? (
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/sign-in" })}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
