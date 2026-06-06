"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { UpdateNameDialog } from "@/components/layout/update-name-dialog";
import { ChangePasswordDialog } from "@/components/layout/change-password-dialog";
import { DeleteAccountDialog } from "@/components/layout/delete-account-dialog";

function getInitials(name?: string | null, isGuest?: boolean): string {
  if (isGuest && !name) return "G";
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserMenu({
  name,
  email,
  isGuest,
  expanded,
}: {
  name?: string | null;
  email?: string | null;
  isGuest?: boolean;
  expanded: boolean;
}) {
  const initials = getInitials(name, isGuest);
  const displayName = name || (isGuest ? "Guest" : "Account");

  if (!expanded) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Account menu"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full bg-work/15 text-xs font-semibold text-work",
              "transition-colors hover:bg-work/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {initials}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="right" sideOffset={8} className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium">{displayName}</p>
            {email ? (
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            ) : null}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <UpdateNameDialog currentName={name} email={email} />
          </DropdownMenuItem>
          {isGuest ? null : (
            <DropdownMenuItem asChild>
              <ChangePasswordDialog />
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => signOut({ callbackUrl: "/sign-in" })}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <DeleteAccountDialog />
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
              "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors",
              "hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-work/15 text-[11px] font-semibold text-work">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            {email ? (
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            ) : null}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{displayName}</p>
          {email ? (
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <UpdateNameDialog currentName={name} email={email} />
        </DropdownMenuItem>
        {isGuest ? null : (
          <DropdownMenuItem asChild>
            <ChangePasswordDialog />
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => signOut({ callbackUrl: "/sign-in" })}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <DeleteAccountDialog />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
