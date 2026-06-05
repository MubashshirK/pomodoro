import { withErrorHandling, json, jsonError, parseJson, settingsToDict } from "../_lib/http.js";
import { readSession, requireUserId, HttpError } from "../_lib/session.js";
import { db } from "../_lib/db.js";
import { settings } from "../../lib/schema.js";
import { eq } from "drizzle-orm";
import { getOrCreateSettings } from "../_lib/auth.js";
import { inSet, optionalBool, optionalNumber } from "../_lib/validation.js";

const THEMES = ["light", "dark", "system"] as const;
type Theme = (typeof THEMES)[number];

export default withErrorHandling(async (req: Request) => {
  const session = await readSession(req);
  const userId = requireUserId(session);

  if (req.method === "GET") {
    const s = await getOrCreateSettings(userId);
    return json({ settings: settingsToDict(s) });
  }

  if (req.method === "PUT") {
    const body = await parseJson<Record<string, unknown>>(req);
    const updates: Record<string, unknown> = {};

    const work = optionalNumber(body, "work_duration", 1, 180);
    if (work !== undefined) updates.workDuration = work;
    const sb = optionalNumber(body, "short_break_duration", 1, 60);
    if (sb !== undefined) updates.shortBreakDuration = sb;
    const lb = optionalNumber(body, "long_break_duration", 1, 120);
    if (lb !== undefined) updates.longBreakDuration = lb;
    const cycles = optionalNumber(body, "cycles_until_long_break", 2, 8);
    if (cycles !== undefined) updates.cyclesUntilLongBreak = cycles;
    const auto = optionalBool(body, "auto_start");
    if (auto !== undefined) updates.autoStart = auto;
    const sound = optionalBool(body, "sound_enabled");
    if (sound !== undefined) updates.soundEnabled = sound;
    const vol = optionalNumber(body, "volume", 0, 100);
    if (vol !== undefined) updates.volume = vol;
    if ("theme" in body) {
      updates.theme = inSet(body.theme, THEMES, "theme") as Theme;
    }
    const notif = optionalBool(body, "notifications_enabled");
    if (notif !== undefined) updates.notificationsEnabled = notif;

    if (Object.keys(updates).length === 0) throw new HttpError(400, "No fields to update");
    updates.updatedAt = new Date();

    const rows = await db
      .update(settings)
      .set(updates)
      .where(eq(settings.userId, userId))
      .returning();
    if (!rows[0]) throw new HttpError(404, "Settings not found");
    return json({ settings: settingsToDict(rows[0]) });
  }

  return jsonError("Method not allowed", 405, { allow: "GET, PUT" });
});
