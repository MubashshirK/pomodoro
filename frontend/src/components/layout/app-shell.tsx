import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  ChevronUp,
  KeyRound,
  Loader2,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Timer,
  Trash2,
  UserCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChangePasswordDialog } from "@/components/account/change-password-dialog";
import { ChangeUsernameDialog } from "@/components/account/change-username-dialog";
import { DeleteAccountDialog } from "@/components/account/delete-account-dialog";
import { useMe, useLogout, getErrorMessage } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "sidebar-collapsed";
const EXPANDED = 240;
const COLLAPSED = 64;

export function AppShell() {
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
          <div
            className={cn(
              "flex shrink-0 items-center gap-2 px-5 py-3 font-semibold tracking-tight",
              collapsed && "justify-center px-0",
            )}
            title={collapsed ? "Pomodoro Pro" : undefined}
          >
            <div className="flex items-center gap-2">
              <Timer className="h-7 w-7 shrink-0 text-work" />
              {!collapsed ? <span className="truncate text-lg">Pomodoro Pro</span> : null}
            </div>
          </div>
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
          <SidebarUserMenu expanded={!collapsed} />
          <Separator />
          <div
            className={cn(
              "shrink-0 p-2",
              collapsed && "flex justify-center",
            )}
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
            <div className="flex items-center gap-2">
              <Timer className="h-7 w-7 shrink-0 text-work" />
              <span className="mt-0.5 truncate text-xl font-semibold tracking-tight">
                Pomodoro Pro
              </span>
            </div>
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
            <div className="mx-auto flex h-full w-full max-w-5xl flex-col px-4 pt-10 pb-4 sm:px-6 sm:py-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <SheetContent side="right" className="flex w-64 flex-col p-0">
        <SheetHeader className="pb-2 pl-3 pr-5 pt-4">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Timer className="mt-0.5 h-6 w-6 text-work" />
            <span className="mt-0.5">Pomodoro Pro</span>
          </SheetTitle>
        </SheetHeader>
        <Separator />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </div>
          <Separator />
          <div className="shrink-0 p-2">
            <ThemeToggle expanded />
          </div>
          <Separator />
          <div className="shrink-0 pb-3">
            <SidebarUserMenu expanded onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
    </Sheet>
  );
}

function SidebarUserMenu({
  expanded,
  onNavigate,
}: {
  expanded: boolean;
  onNavigate?: () => void;
}) {
  const { data, isLoading } = useMe();

  const user = data?.user;
  const email = user?.email ?? "";
  const displayName = (user?.name ?? "").trim() || email.split("@")[0];
  const initials = displayName.slice(0, 2).toUpperCase() || "?";

  if (isLoading) {
    return (
      <div className="flex shrink-0 items-center gap-2 p-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  if (!expanded) {
    return (
      <div className="flex shrink-0 justify-center py-2">
        <UserDropdownTrigger
          initials={initials}
          email={email}
          name={displayName}
          onClose={onNavigate}
        />
      </div>
    );
  }

  return (
    <div className="shrink-0 p-2">
      <UserDropdownTrigger
        initials={initials}
        email={email}
        name={displayName}
        onClose={onNavigate}
        expanded
      />
    </div>
  );
}

function UserDropdownTrigger({
  initials,
  email,
  name,
  onClose,
  expanded = false,
}: {
  initials: string;
  email: string;
  name: string;
  onClose?: () => void;
  expanded?: boolean;
}) {
  const navigate = useNavigate();
  const logout = useLogout();
  const [usernameOpen, setUsernameOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout.mutateAsync();
      toast.success("Logged out");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not log out"));
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {expanded ? (
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg border border-border/60 bg-sidebar px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Account menu for ${email}`}
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary text-[11px] text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
            <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
        ) : (
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-sidebar-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Account menu for ${email}`}
            title={`${name} (${email})`}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-[11px] text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side={expanded ? "top" : "right"}
        sideOffset={expanded ? 4 : 8}
        className="w-56"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setUsernameOpen(true)}>
          <UserCircle2 className="mr-2 h-4 w-4" />
          Change username
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setPasswordOpen(true)}>
          <KeyRound className="mr-2 h-4 w-4" />
          Change password
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            onClose?.();
            handleLogout();
          }}
          disabled={logout.isPending}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => setDeleteOpen(true)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete account
        </DropdownMenuItem>
      </DropdownMenuContent>

      <ChangeUsernameDialog
        open={usernameOpen}
        onOpenChange={setUsernameOpen}
        currentName={name}
      />
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
      <DeleteAccountDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        email={email}
      />
    </DropdownMenu>
  );
}

