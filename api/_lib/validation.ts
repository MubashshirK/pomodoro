import { HttpError } from "./session.js";

export function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

export function asNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return undefined;
}

export function asBool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  return undefined;
}

export function requireString(body: Record<string, unknown>, key: string, max = 255): string {
  const v = asString(body[key]);
  if (!v) throw new HttpError(400, `${key} is required`);
  if (v.length > max) throw new HttpError(400, `${key} must be ≤ ${max} characters`);
  return v;
}

export function optionalString(body: Record<string, unknown>, key: string, max = 5000): string | null | undefined {
  if (!(key in body)) return undefined;
  const v = body[key];
  if (v === null) return null;
  const s = asString(v);
  if (s === undefined) throw new HttpError(400, `${key} must be a string or null`);
  if (s.length > max) throw new HttpError(400, `${key} must be ≤ ${max} characters`);
  return s;
}

export function requireNumber(body: Record<string, unknown>, key: string, min: number, max: number): number {
  const v = asNumber(body[key]);
  if (v === undefined) throw new HttpError(400, `${key} is required`);
  if (v < min || v > max) throw new HttpError(400, `${key} must be between ${min} and ${max}`);
  return v;
}

export function optionalNumber(body: Record<string, unknown>, key: string, min: number, max: number): number | undefined {
  if (!(key in body)) return undefined;
  const v = asNumber(body[key]);
  if (v === undefined) throw new HttpError(400, `${key} must be a number`);
  if (v < min || v > max) throw new HttpError(400, `${key} must be between ${min} and ${max}`);
  return v;
}

export function requireBool(body: Record<string, unknown>, key: string): boolean {
  const v = body[key];
  if (typeof v !== "boolean") throw new HttpError(400, `${key} must be a boolean`);
  return v;
}

export function optionalBool(body: Record<string, unknown>, key: string): boolean | undefined {
  if (!(key in body)) return undefined;
  const v = body[key];
  if (typeof v !== "boolean") throw new HttpError(400, `${key} must be a boolean`);
  return v;
}

export function inSet<T extends string>(v: unknown, set: readonly T[], name: string): T {
  if (typeof v !== "string" || !(set as readonly string[]).includes(v)) {
    throw new HttpError(400, `${name} must be one of: ${set.join(", ")}`);
  }
  return v as T;
}
