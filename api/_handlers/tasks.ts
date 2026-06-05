import { withErrorHandling, json, jsonError, parseJson, taskToDict } from "../_lib/http.js";
import { readSession, requireUserId, HttpError } from "../_lib/session.js";
import { db } from "../_lib/db.js";
import { tasks } from "../../lib/schema.js";
import { asc, eq, sql } from "drizzle-orm";
import { optionalString, optionalNumber, requireString } from "../_lib/validation.js";

export default withErrorHandling(async (req: Request) => {
  const session = await readSession(req);
  const userId = requireUserId(session);

  if (req.method === "GET") {
    const rows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(asc(tasks.position), asc(tasks.id));
    return json({ tasks: rows.map(taskToDict) });
  }

  if (req.method === "POST") {
    const body = await parseJson<Record<string, unknown>>(req);
    const title = requireString(body, "title", 500);
    const notes = optionalString(body, "notes", 5000) ?? null;
    const estimated = optionalNumber(body, "estimated_pomodoros", 1, 50) ?? 1;

    const maxRows = await db
      .select({ m: sql<number>`coalesce(max(${tasks.position}), 0)::float8` })
      .from(tasks)
      .where(eq(tasks.userId, userId));
    const nextPos = (maxRows[0]?.m ?? 0) + 1.0;

    const rows = await db
      .insert(tasks)
      .values({
        userId,
        title,
        notes,
        estimatedPomodoros: estimated,
        position: nextPos,
      })
      .returning();
    return json({ task: taskToDict(rows[0]) }, { status: 201 });
  }

  return jsonError("Method not allowed", 405, { allow: "GET, POST" });
});
