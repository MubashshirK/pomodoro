import { withErrorHandling, json, parseJson, jsonError } from "../../_lib/http.js";
import { createUser, getUserByEmail, isValidEmail, userToDict } from "../../_lib/auth.js";
import { HttpError, buildSessionCookie, readSession } from "../../_lib/session.js";
import { asString, optionalString, requireString } from "../../_lib/validation.js";

export default withErrorHandling(async (req: Request) => {
  if (req.method !== "POST") return jsonError("Method not allowed", 405, { allow: "POST" });
  const body = await parseJson<Record<string, unknown>>(req);

  const email = requireString(body, "email", 255).toLowerCase();
  if (!isValidEmail(email)) throw new HttpError(400, "Invalid email format");
  const password = requireString(body, "password", 200);
  if (password.length < 6) throw new HttpError(400, "Password must be at least 6 characters");
  const name = optionalString(body, "name", 100) ?? asString(body.name) ?? email.split("@")[0];

  const existing = await getUserByEmail(email);
  if (existing) throw new HttpError(409, "Email already registered");

  const user = await createUser({ email, name, password });
  const cookie = await buildSessionCookie({ userId: user.id });
  return json(
    { user: userToDict(user) },
    { status: 201, headers: { "Set-Cookie": cookie } },
  );
});
