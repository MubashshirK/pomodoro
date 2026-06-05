import { withErrorHandling, json, jsonError, sessionToDict } from "../_lib/http.js";
import { readSession, requireUserId, HttpError } from "../_lib/session.js";
import { db } from "../_lib/db.js";
import { pomodoroSessions } from "../../lib/schema.js";
import { and, eq } from "drizzle-orm";

export default withErrorHandling<{ params: Record<string, string> }>(async (req, context) => {
  const session = await readSession(req);
  const userId = requireUserId(session);
  const id = Number(context!.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "Invalid session id");

  if (req.method === "GET") {
    const rows = await db
      .select()
      .from(pomodoroSessions)
      .where(and(eq(pomodoroSessions.id, id), eq(pomodoroSessions.userId, userId)))
      .limit(1);
    if (!rows[0]) throw new HttpError(404, "Session not found");
    return json({ session: sessionToDict(rows[0]) });
  }

  if (req.method === "DELETE") {
    const rows = await db
      .delete(pomodoroSessions)
      .where(and(eq(pomodoroSessions.id, id), eq(pomodoroSessions.userId, userId)))
      .returning({ id: pomodoroSessions.id });
    if (rows.length === 0) throw new HttpError(404, "Session not found");
    return json({ ok: true });
  }

  return jsonError("Method not allowed", 405, { allow: "GET, DELETE" });
});
