import { withErrorHandling, json } from "./_lib/http.js";
import { readSession, requireUserId } from "./_lib/session.js";
import { computeStats, parsePeriod, parseTzOffset } from "./_lib/stats.js";

export default withErrorHandling(async (req: Request) => {
  const session = await readSession(req);
  const userId = requireUserId(session);

  const url = new URL(req.url);
  const period = parsePeriod(url.searchParams.get("period"));
  const tzOffset = parseTzOffset(url.searchParams.get("tz_offset"));

  const stats = await computeStats(userId, period, tzOffset);
  return json(stats);
});
