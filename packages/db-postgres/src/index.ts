import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.js";

export * from "./schema.js";

export function createDatabase(
  url = process.env.POSTGRES_DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/influencial",
) {
  const client = postgres(url);

  return drizzle(client, { schema });
}

export const db = createDatabase();
