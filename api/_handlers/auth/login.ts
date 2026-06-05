import { withErrorHandling, json, parseJson, jsonError } from "../../_lib/http.js";
import { getUserByEmail, verifyPassword, userToDict } from "../../_lib/auth.js";
import { HttpError, buildSessionCookie } from "../../_lib/session.js";
import { requireString } from "../../_lib/validation.js";

export default withErrorHandling(async (req: Request) => {
  if (req.method !== "POST") return jsonError("Method not allowed", 405, { allow: "POST" });
  const body = await parseJson<Record<string, unknown>>(req);
  const email = requireString(body, "email", 255).toLowerCase();
  const password = requireString(body, "password", 200);

  const user = await getUserByEmail(email);
  if (!user) throw new HttpError(401, "Invalid email or password");
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new HttpError(401, "Invalid email or password");

  const cookie = await buildSessionCookie({ userId: user.id });
  return json({ user: userToDict(user) }, { headers: { "Set-Cookie": cookie } });
});
