import * as schema from "../../lib/schema.js";

const isVercel =
  process.env.VERCEL === "1" ||
  !!process.env.POSTGRES_URL_NON_POOLING ||
  !!process.env.VERCEL_ENV;

const mod = isVercel
  ? await import("./db.vercel.js")
  : await import("./db.local.js");

export const db = mod.db as unknown as ReturnType<typeof import("drizzle-orm/vercel-postgres").drizzle>;
export { schema };
