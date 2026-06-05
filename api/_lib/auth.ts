import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./db.js";
import { users, settings } from "../../lib/schema.js";
import type { User, Settings } from "../../lib/schema.js";

const BCRYPT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 255;
}

export async function getUserById(id: number): Promise<User | null> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return rows[0] ?? null;
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
}): Promise<User> {
  const passwordHash = await hashPassword(input.password);
  const rows = await db
    .insert(users)
    .values({
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash,
    })
    .returning();
  return rows[0];
}

export async function getOrCreateSettings(userId: number): Promise<Settings> {
  const existing = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, userId))
    .limit(1);
  if (existing[0]) return existing[0];
  const rows = await db
    .insert(settings)
    .values({ userId })
    .returning();
  return rows[0];
}

export function userToDict(u: User) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    created_at: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
  };
}
