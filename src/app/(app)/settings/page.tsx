"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Bell,
  Heart,
  Loader2,
  Music,
  Palette,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  Sparkles,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { useTheme } from "@/hooks/use-theme";
import { soundManager } from "@/lib/sound";
import { humanizeMinutes } from "@/lib/format";

const schema = z.object({
  work_duration: z.number().int().min(1).max(180),
  short_break_duration: z.number().int().min(1).max(60),
  long_break_duration: z.number().int().min(1).max(120),
  cycles_until_long_break: z.number().int().min(2).max(8),
  auto_start: z.boolean(),
  sound_enabled: z.boolean(),
  volume: z.number().int().min(0).max(100),
  theme: z.enum(["light", "dark", "system"]),
  notifications_enabled: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = {
  work_duration: 25,
  short_break_duration: 5,
  long_break_duration: 15,
  cycles_until_long_break: 4,
  auto_start: false,
  sound_enabled: true,
  volume: 80,
  theme: "system",
  notifications_enabled: true,
};

export default function SettingsPage() {
  const { data, isLoading, isError, error } = useSettings();
  const update = useUpdateSettings();
  const { theme, setTheme } = useTheme();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (data?.settings) {
      const s = data.settings;
      form.reset({
        work_duration: s.work_duration,
        short_break_duration: s.short_break_duration,
        long_break_duration: s.long_break_duration,
        cycles_until_long_break: s.cycles_until_long_break,
        auto_start: s.auto_start,
        sound_enabled: s.sound_enabled,
        volume: s.volume,
        theme: theme,
        notifications_enabled: s.notifications_enabled,
      });
    }
  }, [data, form, theme]);

  useEffect(() => {
    form.setValue("theme", theme, { shouldDirty: false });
  }, [theme, form]);

  const watchSound = useWatch({ control: form.control, name: "sound_enabled" });
  const watchTheme = useWatch({ control: form.control, name: "theme" });

  async function onSubmit(values: FormValues) {
    await update.mutateAsync(values);
    soundManager.setMuted(!values.sound_enabled);
    soundManager.setVolume(values.volume / 100);
    if (theme !== values.theme) setTheme(values.theme);
  }

  async function resetTimerToDefaults() {
    const values: FormValues = {
      ...form.getValues(),
      work_duration: DEFAULTS.work_duration,
      short_break_duration: DEFAULTS.short_break_duration,
      long_break_duration: DEFAULTS.long_break_duration,
      cycles_until_long_break: DEFAULTS.cycles_until_long_break,
    };
    form.reset(values);
    await update.mutateAsync({ ...values, _silent: true });
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Settings</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Couldn't load settings:{" "}
            {error instanceof Error ? error.message : "unknown error"}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Durations, sound, and notifications.
          </p>
        </div>
        <Button
          type="button"
          onClick={form.handleSubmit(onSubmit)}
          disabled={isLoading || update.isPending}
          className="ml-auto gap-1.5"
        >
          {update.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2 text-base">
                <Timer className="h-4 w-4 text-work" />
                Timer
              </CardTitle>
              <CardDescription>
                Lengths are saved in minutes. The timer picks them up immediately.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetTimerToDefaults}
              disabled={isLoading || update.isPending}
              className="gap-1.5 text-muted-foreground"
            >
              {update.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              Reset to defaults
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <DurationField
            label="Work"
            value={form.watch("work_duration")}
            onChange={(v) => form.setValue("work_duration", v, { shouldDirty: true })}
            min={1}
            max={180}
            step={1}
            disabled={isLoading}
          />
          <Separator />
          <DurationField
            label="Short break"
            value={form.watch("short_break_duration")}
            onChange={(v) => form.setValue("short_break_duration", v, { shouldDirty: true })}
            min={1}
            max={60}
            step={1}
            disabled={isLoading}
            accent="shortBreak"
          />
          <Separator />
          <DurationField
            label="Long break"
            value={form.watch("long_break_duration")}
            onChange={(v) => form.setValue("long_break_duration", v, { shouldDirty: true })}
            min={1}
            max={120}
            step={1}
            disabled={isLoading}
            accent="longBreak"
          />
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="cycles_until_long_break">
                Cycles until long break
              </Label>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                {form.watch("cycles_until_long_break")}
              </span>
            </div>
            <Slider
              id="cycles_until_long_break"
              min={2}
              max={8}
              step={1}
              value={[form.watch("cycles_until_long_break")]}
              onValueChange={(v) =>
                form.setValue("cycles_until_long_break", v[0] ?? 4, {
                  shouldDirty: true,
                })
              }
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              How many work sessions before a long break.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <SettingsIcon className="h-4 w-4" />
            Behavior
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SwitchRow
            id="auto_start"
            label="Auto-start next session"
            description="Begin a break or work session automatically when the previous one ends."
            checked={form.watch("auto_start")}
            onCheckedChange={(v) =>
              form.setValue("auto_start", v, { shouldDirty: true })
            }
            disabled={isLoading}
          />
          <Separator />
          <SwitchRow
            id="notifications_enabled"
            label="Browser notifications"
            description="Show a system notification when a session ends."
            checked={form.watch("notifications_enabled")}
            onCheckedChange={(v) =>
              form.setValue("notifications_enabled", v, { shouldDirty: true })
            }
            disabled={isLoading}
            icon={<Bell className="h-4 w-4" />}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Music className="h-4 w-4" />
            Sound
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SwitchRow
            id="sound_enabled"
            label="Sound effects"
            description="Play tones on session start and end."
            checked={watchSound}
            onCheckedChange={(v) =>
              form.setValue("sound_enabled", v, { shouldDirty: true })
            }
            disabled={isLoading}
          />
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="volume">Volume</Label>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                {form.watch("volume")}%
              </span>
            </div>
            <Slider
              id="volume"
              min={0}
              max={100}
              step={1}
              value={[form.watch("volume")]}
              onValueChange={(v) =>
                form.setValue("volume", v[0] ?? 0, { shouldDirty: true })
              }
              disabled={isLoading || !watchSound}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />
            Appearance
          </CardTitle>
          <CardDescription>
            Changes apply immediately. Saved on form submit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={watchTheme}
              onValueChange={(v) => {
                const next = v as FormValues["theme"];
                form.setValue("theme", next, { shouldDirty: true });
                setTheme(next);
              }}
              disabled={isLoading}
            >
              <SelectTrigger id="theme" className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-work" />
            About
          </CardTitle>
          <CardDescription>
            Pomodoro Pro — a modern Pomodoro timer for deep work.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span>Designed, built, and shipped with</span>
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
            <span>by</span>
            <span className="font-medium text-foreground">Mubashshir Khan</span>
          </p>
          <p className="text-xs">
            CS50 Final Project · Next.js 16 + React 19
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function DurationField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  disabled,
  accent,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  accent?: "work" | "shortBreak" | "longBreak";
}) {
  const id = `duration-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span
          className={
            accent
              ? `font-mono text-sm tabular-nums text-${accent}`
              : "font-mono text-sm tabular-nums text-muted-foreground"
          }
        >
          {humanizeMinutes(value)}
        </span>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? min)}
        disabled={disabled}
      />
    </div>
  );
}

function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  icon,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="flex items-center gap-2">
          {icon}
          {label}
        </Label>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}
