import { withErrorHandling, json, jsonError, parseJson } from "../../_lib/http.js";
import { getUserById, userToDict } from "../../_lib/auth.js";
import { readSession, requireUserId, HttpError } from "../../_lib/session.js";
import { db } from "../../_lib/db.js";
import { users } from "../../../lib/schema.js";
import { eq } from "drizzle-orm";
import { asString, optionalString } from "../../_lib/validation.js";

export default withErrorHandling(async (req: Request) => {
  if (req.method !== "PUT") return jsonError("Method not allowed", 405, { allow: "PUT" });
  const session = await readSession(req);
  const userId = requireUserId(session);

  const body = await parseJson<Record<string, unknown>>(req);
  const nameResult = optionalString(body, "name", 100);
  if (nameResult === undefined) {
    const current = asString(body.name);
    if (current !== undefined) {
      const updated = await db
        .update(users)
        .set({ name: current })
        .where(eq(users.id, userId))
        .returning();
      if (!updated[0]) throw new HttpError(404, "User not found");
      return json({ user: userToDict(updated[0]) });
    }
    throw new HttpError(400, "name is required");
  }

  const updated = await db
    .update(users)
    .set({ name: nameResult })
    .where(eq(users.id, userId))
    .returning();
  if (!updated[0]) throw new HttpError(404, "User not found");
  return json({ user: userToDict(updated[0]) });
});
