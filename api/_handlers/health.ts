import { withErrorHandling, json, jsonError } from "../_lib/http.js";
import { sql } from "drizzle-orm";
import { db } from "../_lib/db.js";

export default withErrorHandling(async (_req: Request) => {
  try {
    const result = await db.execute(sql`select 1 as ok`);
    const ok = (result.rows[0] as { ok?: number } | undefined)?.ok === 1;
    return json({ status: ok ? "ok" : "degraded", db: ok ? "ok" : "unknown" });
  } catch (err) {
    console.error("health: db check failed", err);
    return jsonError("Database unavailable", 503);
  }
});
