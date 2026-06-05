import { withErrorHandling, json, jsonError, parseJson, taskToDict } from "../_lib/http.js";
import { readSession, requireUserId, HttpError } from "../_lib/session.js";
import { db } from "../_lib/db.js";
import { tasks } from "../../lib/schema.js";
import { eq, and, sql } from "drizzle-orm";
import { optionalString, optionalNumber, optionalBool } from "../_lib/validation.js";

export default withErrorHandling<{ params: Record<string, string> }>(async (req, context) => {
  const session = await readSession(req);
  const userId = requireUserId(session);
  const id = Number(context!.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "Invalid task id");

  if (req.method === "GET") {
    const rows = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);
    if (!rows[0]) throw new HttpError(404, "Task not found");
    return json({ task: taskToDict(rows[0]) });
  }

  if (req.method === "PUT") {
    const body = await parseJson<Record<string, unknown>>(req);
    const updates: Record<string, unknown> = {};
    if ("title" in body) {
      const t = body.title;
      if (typeof t !== "string" || t.length === 0 || t.length > 500) {
        throw new HttpError(400, "title must be 1-500 characters");
      }
      updates.title = t;
    }
    const notes = optionalString(body, "notes", 5000);
    if (notes !== undefined) updates.notes = notes;
    const est = optionalNumber(body, "estimated_pomodoros", 1, 50);
    if (est !== undefined) updates.estimatedPomodoros = est;
    const completed = optionalNumber(body, "completed_pomodoros", 0, 1_000_000);
    if (completed !== undefined) updates.completedPomodoros = completed;
    const isComp = optionalBool(body, "is_completed");
    if (isComp !== undefined) updates.isCompleted = isComp;

    if (Object.keys(updates).length === 0) throw new HttpError(400, "No fields to update");

    updates.updatedAt = new Date();

    const rows = await db
      .update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    if (!rows[0]) throw new HttpError(404, "Task not found");
    return json({ task: taskToDict(rows[0]) });
  }

  if (req.method === "DELETE") {
    const rows = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning({ id: tasks.id });
    if (rows.length === 0) throw new HttpError(404, "Task not found");
    return json({ ok: true });
  }

  return jsonError("Method not allowed", 405, { allow: "GET, PUT, DELETE" });
});
