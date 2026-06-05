import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../../lib/schema.js";

const dataDir = process.env.PGLITE_DIR ?? "./.pglite";
const client = new PGlite(dataDir);
export const db = drizzle(client, { schema });
export { schema };
