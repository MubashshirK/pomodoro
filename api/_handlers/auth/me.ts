import { withErrorHandling, json, jsonError } from "../../_lib/http.js";
import { getUserById, userToDict } from "../../_lib/auth.js";
import { readSession, requireUserId, HttpError } from "../../_lib/session.js";
import { db } from "../../_lib/db.js";
import { users } from "../../../lib/schema.js";
import { eq } from "drizzle-orm";

export default withErrorHandling(async (req: Request) => {
  const session = await readSession(req);
  const userId = requireUserId(session);

  if (req.method === "GET") {
    const user = await getUserById(userId);
    if (!user) throw new HttpError(404, "User not found");
    return json({ user: userToDict(user) });
  }

  if (req.method === "DELETE") {
    await db.delete(users).where(eq(users.id, userId));
    return json({ ok: true });
  }

  return jsonError("Method not allowed", 405, { allow: "GET, DELETE" });
});
