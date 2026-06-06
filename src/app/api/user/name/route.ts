import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

export const runtime = "nodejs";

const nameSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").max(80, "Name is too long"),
});

export async function PATCH(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch (resp) {
    return resp as Response;
  }

  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = nameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name },
  });

  return NextResponse.json({ ok: true, name: parsed.data.name });
}
