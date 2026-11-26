import "dotenv/config";

import type {
  CreateUserRequest,
  DatabaseDialect,
  User,
} from "@influencial/contracts";
import { eq } from "drizzle-orm";

type DatabaseUser = Omit<User, "createdAt"> & { createdAt: Date };

export type DatabaseAdapter = {
  dialect: DatabaseDialect;
  createUser: (input: CreateUserRequest) => Promise<DatabaseUser>;
  deleteUser: (id: number) => Promise<boolean>;
  findUserByUsername: (username: string) => Promise<DatabaseUser | undefined>;
  listUsers: () => Promise<DatabaseUser[]>;
};

function getDatabaseDialect(): DatabaseDialect {
  const databaseUrl = (
    process.env.DATABASE_URL ?? "file:local.db"
  ).toLowerCase();

  return databaseUrl.startsWith("postgres://") ||
    databaseUrl.startsWith("postgresql://")
    ? "postgresql"
    : "sqlite";
}

async function createDatabaseAdapter(): Promise<DatabaseAdapter> {
  const dialect = getDatabaseDialect();

  if (dialect === "postgresql") {
    const { createDatabase, users } = await import("@influencial/db-postgres");
    const db = createDatabase();

    return {
      dialect,
      createUser: async (input) => {
        const [user] = await db.insert(users).values(input).returning();

        if (!user) {
          throw new Error("Failed to create user.");
        }

        return user;
      },
      deleteUser: async (id) => {
        const deleted = await db
          .delete(users)
          .where(eq(users.id, id))
          .returning({ id: users.id });

        return deleted.length > 0;
      },
      findUserByUsername: async (username) => {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        return user;
      },
      listUsers: async () => db.select().from(users),
    };
  }

  const { createDatabase, users } = await import("@influencial/db-sqlite");
  const db = createDatabase();

  return {
    dialect,
    createUser: async (input) => {
      const [user] = await db.insert(users).values(input).returning();

      if (!user) {
        throw new Error("Failed to create user.");
      }

      return user;
    },
    deleteUser: async (id) => {
      const deleted = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning({ id: users.id });

      return deleted.length > 0;
    },
    findUserByUsername: async (username) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      return user;
    },
    listUsers: async () => db.select().from(users),
  };
}

export const database = await createDatabaseAdapter();
