import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { toApiTask } from "@/lib/api-mappers";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    await prisma.task.updateMany({
      where: {
        userId: user.id,
        isCompleted: false,
        completedPomodoros: { gte: prisma.task.fields.estimatedPomodoros },
      },
      data: { isCompleted: true },
    });
    const rows = await prisma.task.findMany({
      where: { userId: user.id },
      orderBy: { position: "asc" },
    });
    return NextResponse.json({ tasks: rows.map(toApiTask) });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Failed to load tasks" },
      { status: 500 },
    );
  }
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  notes: z.string().max(2000).nullable().optional(),
  estimated_pomodoros: z.number().int().min(1).max(50).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { title, notes, estimated_pomodoros } = parsed.data;

    const last = await prisma.task.findFirst({
      where: { userId: user.id },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const nextPos = (last?.position ?? 0) + 1;

    const row = await prisma.task.create({
      data: {
        userId: user.id,
        title: title.trim(),
        notes: notes?.trim() || null,
        estimatedPomodoros: estimated_pomodoros ?? 1,
        position: nextPos,
      },
    });
    return NextResponse.json({ task: toApiTask(row) }, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}
