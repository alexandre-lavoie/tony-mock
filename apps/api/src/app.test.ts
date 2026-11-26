import type { CreateUserRequest } from "@influencial/contracts";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "./app";
import type { DatabaseAdapter, FollowEdge } from "./database";

type DatabaseUser = Awaited<ReturnType<DatabaseAdapter["createUser"]>>;

function createTestDatabase(initialUsers: CreateUserRequest[] = []) {
  const users: DatabaseUser[] = initialUsers.map((user, index) => ({
    id: index + 1,
    username: user.username,
    displayName: user.displayName ?? null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  }));
  const follows: FollowEdge[] = [];

  const database: DatabaseAdapter = {
    dialect: "sqlite",
    createFollow: async (followerId, followingId) => {
      if (
        follows.some(
          (follow) =>
            follow.followerId === followerId &&
            follow.followingId === followingId,
        )
      ) {
        return undefined;
      }

      const follow = {
        followerId,
        followingId,
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
      };
      follows.push(follow);
      return follow;
    },
    createUser: async (input) => {
      const user = {
        id: Math.max(0, ...users.map(({ id }) => id)) + 1,
        username: input.username,
        displayName: input.displayName ?? null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      };
      users.push(user);
      return user;
    },
    deleteFollow: async (followerId, followingId) => {
      const index = follows.findIndex(
        (follow) =>
          follow.followerId === followerId &&
          follow.followingId === followingId,
      );

      if (index === -1) {
        return false;
      }

      follows.splice(index, 1);
      return true;
    },
    deleteUser: async (id) => {
      const index = users.findIndex((user) => user.id === id);

      if (index === -1) {
        return false;
      }

      users.splice(index, 1);

      for (
        let followIndex = follows.length - 1;
        followIndex >= 0;
        followIndex -= 1
      ) {
        const follow = follows[followIndex];

        if (follow?.followerId === id || follow?.followingId === id) {
          follows.splice(followIndex, 1);
        }
      }

      return true;
    },
    findUserById: async (id) => users.find((user) => user.id === id),
    findUserByUsername: async (username) =>
      users.find((user) => user.username === username),
    listFollowerIds: async (followingId) =>
      follows
        .filter((follow) => follow.followingId === followingId)
        .map((follow) => follow.followerId),
    listFollowEdges: async () => [...follows],
    listFollowingIds: async (followerId) =>
      follows
        .filter((follow) => follow.followerId === followerId)
        .map((follow) => follow.followingId),
    listUsers: async () => [...users],
  };

  return database;
}

describe("API", () => {
  it("creates and deletes a user", async () => {
    const app = createApp(createTestDatabase());
    const created = await request(app)
      .post("/api/users")
      .send({ username: "alex", displayName: "Alex" });

    expect(created.status).toBe(201);
    expect(created.body.user).toMatchObject({
      id: 1,
      username: "alex",
      displayName: "Alex",
    });

    expect((await request(app).delete("/api/users/1")).status).toBe(204);
    expect((await request(app).get("/api/users/1")).status).toBe(404);
  });

  it("rejects duplicate usernames", async () => {
    const app = createApp(createTestDatabase([{ username: "alex" }]));
    const response = await request(app)
      .post("/api/users")
      .send({ username: "alex" });

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/already in use/i);
  });

  it("logs in without validating the password", async () => {
    const app = createApp(
      createTestDatabase([{ username: "alex", displayName: "Alex" }]),
    );
    const response = await request(app)
      .post("/login")
      .send({ username: "alex", password: "wrong" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: { id: 1, username: "alex", displayName: "Alex" },
    });
  });

  it("creates and removes follow relationships", async () => {
    const app = createApp(
      createTestDatabase([{ username: "alex" }, { username: "blake" }]),
    );

    expect((await request(app).post("/users/1/follow/2")).status).toBe(201);
    expect((await request(app).get("/users/1/following")).body).toEqual({
      followerIds: [],
      followingIds: [2],
    });
    expect((await request(app).delete("/users/1/follow/2")).status).toBe(204);
  });

  it("prevents cycles and calculates recursive influence", async () => {
    const app = createApp(
      createTestDatabase([
        { username: "alex" },
        { username: "blake" },
        { username: "cameron" },
      ]),
    );

    await request(app).post("/users/2/follow/1").expect(201);
    await request(app).post("/users/3/follow/2").expect(201);

    const cycle = await request(app).post("/users/1/follow/3");
    expect(cycle.status).toBe(409);
    expect(cycle.body.error).toMatch(/cycle/i);

    expect((await request(app).get("/users/1/influence")).body).toEqual({
      score: 2,
    });

    const followers = await request(app).get("/users/1/influence/followers");
    expect(followers.body.followers).toMatchObject([
      { id: 2, depth: 1 },
      { id: 3, depth: 2 },
    ]);
  });
});
