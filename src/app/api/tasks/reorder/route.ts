import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

export const runtime = "nodejs";

const reorderSchema = z.object({
  order: z.array(z.number().int().positive()).min(1),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { order } = parsed.data;

    const tasks = await prisma.task.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    const ownedIds = new Set<number>(tasks.map((t: { id: number }) => t.id));
    if (order.length !== ownedIds.size || !order.every((id) => ownedIds.has(id))) {
      return NextResponse.json(
        { error: "Order list must contain exactly the user's task ids" },
        { status: 400 },
      );
    }

    await prisma.$transaction(
      order.map((id, idx) =>
        prisma.task.update({
          where: { id },
          data: { position: idx + 1 },
        }),
      ),
    );
    return NextResponse.json({ message: "ok" });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Failed to reorder tasks" },
      { status: 500 },
    );
  }
}
