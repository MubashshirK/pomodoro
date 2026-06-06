import { NextResponse } from "next/server";
import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const GUEST_EMAIL_PREFIX = "guest-";

function randomPassword(): string {
  return randomBytes(18).toString("base64url");
}

export async function POST() {
  const email = `${GUEST_EMAIL_PREFIX}${randomUUID()}@guest.local`;
  const password = randomPassword();
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { email, passwordHash, name: null, isGuest: true },
  });

  return NextResponse.json({ email, password });
}
