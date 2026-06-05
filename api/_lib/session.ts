import { sealData, unsealData } from "iron-session";
import type { SessionData } from "./types.js";

export const COOKIE_NAME = "pomodoro_session";

function getPassword(): string {
  const pwd = process.env.IRON_SESSION_PASSWORD;
  if (!pwd || pwd.length < 32) {
    throw new Error(
      "IRON_SESSION_PASSWORD must be set and at least 32 characters long",
    );
  }
  return pwd;
}

function parseCookieHeader(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

export async function readSession(req: Request): Promise<SessionData> {
  const cookies = parseCookieHeader(req.headers.get("cookie"));
  const sealed = cookies[COOKIE_NAME];
  if (!sealed) return {};
  try {
    return (await unsealData<SessionData>(sealed, {
      password: getPassword(),
    })) ?? {};
  } catch {
    return {};
  }
}

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

function baseCookieAttrs(): string {
  const parts = [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (isProd()) parts.push("Secure");
  return parts.join("; ");
}

export async function buildSessionCookie(data: SessionData): Promise<string> {
  const sealed = await sealData(data, { password: getPassword() });
  const attrs = baseCookieAttrs().replace(`${COOKIE_NAME}=`, "");
  return `${COOKIE_NAME}=${encodeURIComponent(sealed)}; ${attrs}`;
}

export function clearSessionCookie(): string {
  return `${baseCookieAttrs()}; Max-Age=0`;
}

export function requireUserId(session: SessionData): number {
  if (typeof session.userId !== "number") {
    throw new HttpError(401, "Authentication required");
  }
  return session.userId;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
