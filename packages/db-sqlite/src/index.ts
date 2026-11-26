import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

export * from "./schema";

export function createDatabase(
  url = process.env.DATABASE_URL ?? "file:local.db",
) {
  const client = createClient({ url });

  return drizzle(client, { schema });
}

export const db = createDatabase();
