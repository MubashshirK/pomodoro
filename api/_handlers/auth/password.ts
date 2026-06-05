import { withErrorHandling, json, jsonError, parseJson } from "../../_lib/http.js";
import { getUserById, hashPassword, verifyPassword } from "../../_lib/auth.js";
import { readSession, requireUserId, HttpError } from "../../_lib/session.js";
import { db } from "../../_lib/db.js";
import { users } from "../../../lib/schema.js";
import { eq } from "drizzle-orm";
import { requireString } from "../../_lib/validation.js";

export default withErrorHandling(async (req: Request) => {
  if (req.method !== "PUT") return jsonError("Method not allowed", 405, { allow: "PUT" });
  const session = await readSession(req);
  const userId = requireUserId(session);

  const body = await parseJson<Record<string, unknown>>(req);
  const currentPassword = requireString(body, "current_password", 200);
  const newPassword = requireString(body, "new_password", 200);
  if (newPassword.length < 6) throw new HttpError(400, "New password must be at least 6 characters");
  if (newPassword === currentPassword) throw new HttpError(400, "New password must differ from current");

  const user = await getUserById(userId);
  if (!user) throw new HttpError(404, "User not found");
  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) throw new HttpError(401, "Current password is incorrect");

  const newHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userId));
  return json({ ok: true });
});
