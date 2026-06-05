import { withErrorHandling, json, jsonError, parseJson, sessionToDict } from "../_lib/http.js";
import { readSession, requireUserId, HttpError } from "../_lib/session.js";
import { db } from "../_lib/db.js";
import { pomodoroSessions, tasks } from "../../lib/schema.js";
import { and, desc, eq, sql } from "drizzle-orm";
import { asNumber, inSet, optionalNumber, requireNumber } from "../_lib/validation.js";

const SESSION_TYPES = ["work", "shortBreak", "longBreak"] as const;
type SessionType = (typeof SESSION_TYPES)[number];

export default withErrorHandling(async (req: Request) => {
  const session = await readSession(req);
  const userId = requireUserId(session);

  if (req.method === "GET") {
    const url = new URL(req.url);
    const limitRaw = asNumber(url.searchParams.get("limit")) ?? 100;
    const limit = Math.max(1, Math.min(500, Math.trunc(limitRaw)));
    const rows = await db
      .select()
      .from(pomodoroSessions)
      .where(eq(pomodoroSessions.userId, userId))
      .orderBy(desc(pomodoroSessions.completedAt))
      .limit(limit);
    return json({ sessions: rows.map(sessionToDict) });
  }

  if (req.method === "POST") {
    const body = await parseJson<Record<string, unknown>>(req);
    const sessionType = inSet(body.session_type, SESSION_TYPES, "session_type") as SessionType;
    const durationSeconds = requireNumber(body, "duration_seconds", 1, 3600);
    const taskId = optionalNumber(body, "task_id", 1, 2_147_483_647);
    const completedAt = body.completed_at;
    let completedAtDate: Date | undefined;
    if (completedAt !== undefined && completedAt !== null) {
      if (typeof completedAt !== "string") {
        throw new HttpError(400, "completed_at must be an ISO timestamp string");
      }
      const d = new Date(completedAt);
      if (Number.isNaN(d.getTime())) throw new HttpError(400, "completed_at is not a valid date");
      completedAtDate = d;
    }

    if (taskId !== undefined) {
      const owned = await db
        .select({ id: tasks.id })
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
        .limit(1);
      if (!owned[0]) throw new HttpError(404, "Task not found");
    }

    const insertValues: {
      userId: number;
      sessionType: SessionType;
      durationSeconds: number;
      taskId?: number;
      completedAt?: Date;
    } = {
      userId,
      sessionType,
      durationSeconds,
    };
    if (taskId !== undefined) insertValues.taskId = taskId;
    if (completedAtDate) insertValues.completedAt = completedAtDate;

    const rows = await db
      .insert(pomodoroSessions)
      .values(insertValues)
      .returning();

    if (taskId !== undefined && sessionType === "work") {
      await db
        .update(tasks)
        .set({
          completedPomodoros: sql`${tasks.completedPomodoros} + 1`,
          updatedAt: new Date(),
        })
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
    }

    return json({ session: sessionToDict(rows[0]) }, { status: 201 });
  }

  return jsonError("Method not allowed", 405, { allow: "GET, POST" });
});
