import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { toApiSession } from "@/lib/api-mappers";

export const runtime = "nodejs";

const SESSION_TYPES = ["work", "shortBreak", "longBreak"] as const;

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const where: { userId: number; completedAt?: { gte?: Date; lte?: Date } } = {
      userId: user.id,
    };
    if (from || to) {
      where.completedAt = {};
      if (from) where.completedAt.gte = new Date(from);
      if (to) where.completedAt.lte = new Date(to);
    }
    const rows = await prisma.pomodoroSessionLog.findMany({
      where,
      orderBy: { completedAt: "desc" },
    });
    return NextResponse.json({ sessions: rows.map(toApiSession) });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Failed to load sessions" },
      { status: 500 },
    );
  }
}

const logSchema = z.object({
  session_type: z.enum(SESSION_TYPES),
  duration_seconds: z.number().int().min(1).max(24 * 60 * 60),
  task_id: z.number().int().positive().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = logSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { session_type, duration_seconds, task_id } = parsed.data;

    if (task_id != null) {
      const owned = await prisma.task.findFirst({
        where: { id: task_id, userId: user.id },
        select: { id: true },
      });
      if (!owned) {
        return NextResponse.json(
          { error: "Task not found" },
          { status: 400 },
        );
      }
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const row = await tx.pomodoroSessionLog.create({
        data: {
          userId: user.id,
          taskId: task_id ?? null,
          sessionType: session_type,
          durationSeconds: duration_seconds,
        },
      });
      if (session_type === "work" && task_id != null) {
        await tx.task.update({
          where: { id: task_id },
          data: { completedPomodoros: { increment: 1 } },
        });
      }
      return row;
    });
    return NextResponse.json({ session: toApiSession(result) }, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Failed to log session" },
      { status: 500 },
    );
  }
}
