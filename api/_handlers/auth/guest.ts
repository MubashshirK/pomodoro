import { withErrorHandling, json, jsonError } from "../../_lib/http.js";
import { createUser, userToDict } from "../../_lib/auth.js";
import { buildSessionCookie } from "../../_lib/session.js";

function randomGuestName(): string {
  return `Guest-${Math.random().toString(36).slice(2, 8)}`;
}

function randomGuestEmail(): string {
  const id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  return `guest-${id}@guest.local`;
}

export default withErrorHandling(async (req: Request) => {
  if (req.method !== "POST") return jsonError("Method not allowed", 405, { allow: "POST" });
  const password = Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14);
  const user = await createUser({
    email: randomGuestEmail(),
    name: randomGuestName(),
    password,
  });
  const cookie = await buildSessionCookie({ userId: user.id });
  return json(
    { user: userToDict(user) },
    { status: 201, headers: { "Set-Cookie": cookie } },
  );
});
