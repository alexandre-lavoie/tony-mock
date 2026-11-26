import "dotenv/config";

import type { DatabaseDialect, User } from "@influencial/contracts";

type DatabaseUser = Omit<User, "createdAt"> & { createdAt: Date };

export type DatabaseAdapter = {
  dialect: DatabaseDialect;
  listUsers: () => Promise<DatabaseUser[]>;
};

function getDatabaseDialect(): DatabaseDialect {
  const configuredDialect = process.env.DATABASE_DIALECT?.toLowerCase();

  if (!configuredDialect) {
    return process.env.POSTGRES_DATABASE_URL ? "postgresql" : "sqlite";
  }

  if (configuredDialect === "sqlite") {
    return "sqlite";
  }

  if (configuredDialect === "postgres" || configuredDialect === "postgresql") {
    return "postgresql";
  }

  throw new Error(
    `Unsupported DATABASE_DIALECT "${configuredDialect}". Use sqlite or postgresql.`,
  );
}

async function createDatabaseAdapter(): Promise<DatabaseAdapter> {
  const dialect = getDatabaseDialect();

  if (dialect === "postgresql") {
    const { createDatabase, users } = await import("@influencial/db-postgres");
    const db = createDatabase();

    return {
      dialect,
      listUsers: async () => db.select().from(users),
    };
  }

  const { createDatabase, users } = await import("@influencial/db-sqlite");
  const db = createDatabase();

  return {
    dialect,
    listUsers: async () => db.select().from(users),
  };
}

export const database = await createDatabaseAdapter();
