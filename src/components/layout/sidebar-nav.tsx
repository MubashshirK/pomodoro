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
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

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
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              collapsed && "justify-center px-0",
              isActive
                ? "bg-sidebar-accent text-sidebar-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed ? <span className="truncate">{item.label}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
