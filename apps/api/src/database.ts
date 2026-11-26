import "dotenv/config";

import type {
  CreateUserRequest,
  DatabaseDialect,
  Follow,
  User,
} from "@influencial/contracts";
import { and, eq } from "drizzle-orm";

type DatabaseUser = Omit<User, "createdAt"> & { createdAt: Date };
type DatabaseFollow = Omit<Follow, "createdAt"> & { createdAt: Date };

export type DatabaseAdapter = {
  dialect: DatabaseDialect;
  createFollow: (
    followerId: number,
    followingId: number,
  ) => Promise<DatabaseFollow | undefined>;
  createUser: (input: CreateUserRequest) => Promise<DatabaseUser>;
  deleteFollow: (followerId: number, followingId: number) => Promise<boolean>;
  deleteUser: (id: number) => Promise<boolean>;
  findUserById: (id: number) => Promise<DatabaseUser | undefined>;
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
    const { createDatabase, follows, users } =
      await import("@influencial/db-postgres");
    const db = createDatabase();

    return {
      dialect,
      createFollow: async (followerId, followingId) => {
        const [follow] = await db
          .insert(follows)
          .values({ followerId, followingId })
          .onConflictDoNothing()
          .returning();

        return follow;
      },
      createUser: async (input) => {
        const [user] = await db.insert(users).values(input).returning();

        if (!user) {
          throw new Error("Failed to create user.");
        }

        return user;
      },
      deleteFollow: async (followerId, followingId) => {
        const deleted = await db
          .delete(follows)
          .where(
            and(
              eq(follows.followerId, followerId),
              eq(follows.followingId, followingId),
            ),
          )
          .returning({ followerId: follows.followerId });

        return deleted.length > 0;
      },
      deleteUser: async (id) => {
        const deleted = await db
          .delete(users)
          .where(eq(users.id, id))
          .returning({ id: users.id });

        return deleted.length > 0;
      },
      findUserById: async (id) => {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1);

        return user;
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

  const { createDatabase, follows, users } =
    await import("@influencial/db-sqlite");
  const db = createDatabase();

  return {
    dialect,
    createFollow: async (followerId, followingId) => {
      const [follow] = await db
        .insert(follows)
        .values({ followerId, followingId })
        .onConflictDoNothing()
        .returning();

      return follow;
    },
    createUser: async (input) => {
      const [user] = await db.insert(users).values(input).returning();

      if (!user) {
        throw new Error("Failed to create user.");
      }

      return user;
    },
    deleteFollow: async (followerId, followingId) => {
      const deleted = await db
        .delete(follows)
        .where(
          and(
            eq(follows.followerId, followerId),
            eq(follows.followingId, followingId),
          ),
        )
        .returning({ followerId: follows.followerId });

      return deleted.length > 0;
    },
    deleteUser: async (id) => {
      const deleted = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning({ id: users.id });

      return deleted.length > 0;
    },
    findUserById: async (id) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return user;
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
