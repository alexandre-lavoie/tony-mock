import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

export * from "./schema";

export function createDatabase(url: string) {
  const client = createClient({ url });

  return drizzle(client, { schema });
}
