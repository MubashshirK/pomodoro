import { withErrorHandling, json } from "../_lib/http.js";
import { clearSessionCookie } from "../_lib/session.js";

export default withErrorHandling(async (_req: Request) => {
  return json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
});
