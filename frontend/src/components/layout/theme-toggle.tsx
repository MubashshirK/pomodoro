import { useTheme } from "@/hooks/use-theme";
import { useUpdateSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Theme } from "@/components/theme-context";

interface ThemeToggleProps {
  expanded?: boolean;
}

const themeOptions: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

export function ThemeToggle({ expanded = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const updateSettings = useUpdateSettings();

  function pick(t: Theme) {
    setTheme(t);
    updateSettings.mutate({ theme: t });
  }

  const current = themeOptions.find((t) => t.value === theme) ?? themeOptions[2];
  const CurrentIcon = current.Icon;

  if (!expanded) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Theme (${current.label})`}
            title={`Theme: ${current.label}`}
            className="h-9 w-9"
          >
            <CurrentIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="right" sideOffset={8} className="w-40">
          {themeOptions.map(({ value, label, Icon }) => (
            <DropdownMenuItem key={value} onSelect={() => pick(value)}>
              <Icon className="mr-2 h-4 w-4" />
              {label}
              {theme === value && <span className="ml-auto text-xs">✓</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="flex w-full items-center gap-1 rounded-lg bg-muted p-1"
    >
      {themeOptions.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => pick(value)}
            title={label}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
