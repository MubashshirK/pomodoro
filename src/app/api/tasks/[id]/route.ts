import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { toApiTask } from "@/lib/api-mappers";

export const runtime = "nodejs";

const patchSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    notes: z.string().max(2000).nullable().optional(),
    estimated_pomodoros: z.number().int().min(1).max(50).optional(),
    is_completed: z.boolean().optional(),
  })
  .strict();

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const taskId = Number.parseInt(id, 10);
    if (!Number.isFinite(taskId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

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
    if (p.title !== undefined) data.title = p.title.trim();
    if (p.notes !== undefined) data.notes = p.notes?.trim() || null;
    if (p.estimated_pomodoros !== undefined)
      data.estimatedPomodoros = p.estimated_pomodoros;
    if (p.is_completed !== undefined) data.isCompleted = p.is_completed;

    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    const row = await prisma.task.update({
      where: { id: taskId },
      data,
    });
    return NextResponse.json({ task: toApiTask(row) });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const taskId = Number.parseInt(id, 10);
    if (!Number.isFinite(taskId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    await prisma.task.delete({ where: { id: taskId } });
    return NextResponse.json({ message: "deleted" });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}
