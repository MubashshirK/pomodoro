import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { toApiSettings } from "@/lib/api-mappers";

export const runtime = "nodejs";

const SETTINGS_DEFAULTS = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesUntilLongBreak: 4,
  autoStart: false,
  soundEnabled: true,
  volume: 80,
  theme: "system",
  notificationsEnabled: true,
} as const;

export async function GET() {
  try {
    const user = await requireUser();
    let row = await prisma.appSettings.findUnique({
      where: { userId: user.id },
    });
    if (!row) {
      row = await prisma.appSettings.create({
        data: { userId: user.id, ...SETTINGS_DEFAULTS },
      });
    }
    return NextResponse.json({ settings: toApiSettings(row) });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 },
    );
  }
}

const patchSchema = z
  .object({
    work_duration: z.number().int().min(1).max(180).optional(),
    short_break_duration: z.number().int().min(1).max(60).optional(),
    long_break_duration: z.number().int().min(1).max(120).optional(),
    cycles_until_long_break: z.number().int().min(2).max(8).optional(),
    auto_start: z.boolean().optional(),
    sound_enabled: z.boolean().optional(),
    volume: z.number().int().min(0).max(100).optional(),
    theme: z.enum(["light", "dark", "system"]).optional(),
    notifications_enabled: z.boolean().optional(),
  })
  .strict();

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const p = parsed.data;
    const data: Record<string, unknown> = {};
    if (p.work_duration !== undefined) data.workDuration = p.work_duration;
    if (p.short_break_duration !== undefined)
      data.shortBreakDuration = p.short_break_duration;
    if (p.long_break_duration !== undefined)
      data.longBreakDuration = p.long_break_duration;
    if (p.cycles_until_long_break !== undefined)
      data.cyclesUntilLongBreak = p.cycles_until_long_break;
    if (p.auto_start !== undefined) data.autoStart = p.auto_start;
    if (p.sound_enabled !== undefined) data.soundEnabled = p.sound_enabled;
    if (p.volume !== undefined) data.volume = p.volume;
    if (p.theme !== undefined) data.theme = p.theme;
    if (p.notifications_enabled !== undefined)
      data.notificationsEnabled = p.notifications_enabled;

    const row = await prisma.appSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...SETTINGS_DEFAULTS, ...data },
      update: data,
    });
    return NextResponse.json({ settings: toApiSettings(row) });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
