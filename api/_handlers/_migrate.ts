import { withErrorHandling, json, jsonError } from "../_lib/http.js";
import { sql } from "drizzle-orm";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { db } from "../_lib/db.js";

async function listMigrations(): Promise<string[]> {
  const dir = join(process.cwd(), "drizzle");
  try {
    const entries = await readdir(dir);
    return entries.filter((f) => f.endsWith(".sql")).sort();
  } catch {
    return [];
  }
}

export default withErrorHandling(async (req: Request) => {
  if (req.method !== "POST") return jsonError("Method not allowed", 405, { allow: "POST" });
  const files = await listMigrations();
  const applied: string[] = [];

  await db.execute(sql`
    create table if not exists _migrations (
      name text primary key,
      applied_at timestamp not null default now()
    )
  `);

  for (const file of files) {
    const exists = await db.execute(sql`select 1 from _migrations where name = ${file}`);
    if (exists.rows.length > 0) continue;

    const path = join(process.cwd(), "drizzle", file);
    const ddl = await readFile(path, "utf8");
    const statements = ddl
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      try {
        await db.execute(sql.raw(stmt));
      } catch (err) {
        console.error(`migration ${file} failed on statement:`, stmt.slice(0, 200), err);
        throw err;
      }
    }

    await db.execute(sql`insert into _migrations (name) values (${file})`);
    applied.push(file);
  }

  return json({ ok: true, applied, total: files.length });
});
