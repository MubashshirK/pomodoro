import { withErrorHandling, json, jsonError, parseJson } from "../_lib/http.js";
import { readSession, requireUserId, HttpError } from "../_lib/session.js";
import { db } from "../_lib/db.js";
import { tasks } from "../../lib/schema.js";
import { and, eq } from "drizzle-orm";

export default withErrorHandling(async (req: Request) => {
  if (req.method !== "POST") return jsonError("Method not allowed", 405, { allow: "POST" });
  const session = await readSession(req);
  const userId = requireUserId(session);

  const body = await parseJson<Record<string, unknown>>(req);
  const taskIds = body.task_ids;
  if (!Array.isArray(taskIds)) throw new HttpError(400, "task_ids must be a list");
  for (const id of taskIds) {
    if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
      throw new HttpError(400, "task_ids must contain positive integers");
    }
  }

  for (let i = 0; i < taskIds.length; i++) {
    const id = taskIds[i] as number;
    await db
      .update(tasks)
      .set({ position: i, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  }

  return json({ ok: true });
});
