"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Timer,
  ListTodo,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

const items: NavItem[] = [
  { to: "/timer", label: "Timer", icon: Timer },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav({
  onNavigate,
  collapsed = false,
  size = "default",
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  size?: "default" | "lg";
}) {
  const pathname = usePathname();
  const isLg = size === "lg";

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const isActive =
          item.to === "/timer"
            ? pathname === "/timer"
            : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            href={item.to}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            aria-label={item.label}
            className={cn(
              "flex items-center rounded-lg font-medium transition-colors",
              isLg
                ? "gap-3 px-4 py-3 text-base"
                : "gap-3 px-3 py-2 text-sm",
              collapsed && "justify-center px-0",
              isActive
                ? "bg-sidebar-accent text-sidebar-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <Icon className={cn("shrink-0", isLg ? "h-5 w-5" : "h-4 w-4")} />
            {!collapsed ? <span className="truncate">{item.label}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
