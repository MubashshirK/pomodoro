import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

export const runtime = "nodejs";

export async function DELETE() {
  let user;
  try {
    user = await requireUser();
  } catch (resp) {
    return resp as Response;
  }

  await prisma.user.delete({ where: { id: user.id } });

  return NextResponse.json({ ok: true });
}
