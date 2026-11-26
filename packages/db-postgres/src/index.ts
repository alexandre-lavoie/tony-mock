import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export * from "./schema";

export function createDatabase(url: string) {
  const client = postgres(url);

  return drizzle(client, { schema });
}
