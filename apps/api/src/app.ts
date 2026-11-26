import type {
  CreateUserRequest,
  ErrorResponse,
  Follow,
  FollowingResponse,
  FollowResponse,
  HealthResponse,
  InfluenceResponse,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  RecursiveFollowersResponse,
  User,
  UserResponse,
  UsersResponse,
} from "@influencial/contracts";
import cors from "cors";
import express from "express";

import type { DatabaseAdapter } from "./database";
import {
  calculateInfluenceScore,
  calculateInfluenceScores,
  calculateRecursiveFollowerDepths,
} from "./influence";

function serializeUser(
  user: Omit<User, "createdAt"> & { createdAt: Date },
): User {
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
  };
}

function serializeFollow(
  follow: Omit<Follow, "createdAt"> & { createdAt: Date },
): Follow {
  return {
    ...follow,
    createdAt: follow.createdAt.toISOString(),
  };
}

function parseId(value: string): number | undefined {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

async function wouldCreateFollowCycle(
  database: DatabaseAdapter,
  followerId: number,
  followingId: number,
): Promise<boolean> {
  const pending = [followingId];
  const visited = new Set<number>();

  while (pending.length > 0) {
    const userId = pending.shift();

    if (userId === undefined || visited.has(userId)) {
      continue;
    }

    if (userId === followerId) {
      return true;
    }

    visited.add(userId);
    pending.push(...(await database.listFollowingIds(userId)));
  }

  return false;
}

function parseCreateUserRequest(value: unknown): CreateUserRequest | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const { username, displayName } = value as Record<string, unknown>;

  if (typeof username !== "string") {
    return undefined;
  }

  const normalizedUsername = username.trim();

  if (normalizedUsername.length === 0 || normalizedUsername.length > 50) {
    return undefined;
  }

  if (
    displayName !== undefined &&
    displayName !== null &&
    typeof displayName !== "string"
  ) {
    return undefined;
  }

  if (typeof displayName === "string" && displayName.length > 100) {
    return undefined;
  }

  return {
    username: normalizedUsername,
    displayName,
  };
}

function parseLoginRequest(value: unknown): LoginRequest | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const { username, password } = value as Record<string, unknown>;

  if (typeof username !== "string" || username.trim().length === 0) {
    return undefined;
  }

  if (password !== undefined && typeof password !== "string") {
    return undefined;
  }

  return { username: username.trim(), password };
}

export function createApp(database: DatabaseAdapter) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_request, response) => {
    const body = {
      status: "ok",
      database: database.dialect,
    } satisfies HealthResponse;

    response.json(body);
  });

  app.get("/api/message", (_request, response) => {
    const body = { message: "Hello from the API!" } satisfies MessageResponse;

    response.json(body);
  });

  app.post("/login", async (request, response) => {
    const input = parseLoginRequest(request.body);

    if (!input) {
      const body = { error: "A username is required." } satisfies ErrorResponse;

      response.status(400).json(body);
      return;
    }

    const user = await database.findUserByUsername(input.username);

    if (!user) {
      const body = { error: "User not found." } satisfies ErrorResponse;

      response.status(404).json(body);
      return;
    }

    const body = {
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
    } satisfies LoginResponse;

    response.json(body);
  });

  app.get("/api/users", async (_request, response) => {
    const users = await database.listUsers();
    const influenceScores = calculateInfluenceScores(
      users.map(({ id }) => id),
      await database.listFollowEdges(),
    );
    const body = {
      users: users.map((user) => ({
        ...serializeUser(user),
        influenceScore: influenceScores.get(user.id) ?? 0,
      })),
    } satisfies UsersResponse;

    response.json(body);
  });

  app.get("/api/users/:id", async (request, response) => {
    const id = parseId(request.params.id);

    if (!id) {
      const body = { error: "Invalid user ID." } satisfies ErrorResponse;

      response.status(400).json(body);
      return;
    }

    const user = await database.findUserById(id);

    if (!user) {
      const body = { error: "User not found." } satisfies ErrorResponse;

      response.status(404).json(body);
      return;
    }

    const body = { user: serializeUser(user) } satisfies UserResponse;

    response.json(body);
  });

  app.post("/api/users", async (request, response) => {
    const input = parseCreateUserRequest(request.body);

    if (!input) {
      const body = {
        error: "A username between 1 and 50 characters is required.",
      } satisfies ErrorResponse;

      response.status(400).json(body);
      return;
    }

    if (await database.findUserByUsername(input.username)) {
      const body = {
        error: "That username is already in use.",
      } satisfies ErrorResponse;

      response.status(409).json(body);
      return;
    }

    const user = await database.createUser(input);
    const body = { user: serializeUser(user) } satisfies UserResponse;

    response.status(201).json(body);
  });

  app.delete("/api/users/:id", async (request, response) => {
    const id = parseId(request.params.id);

    if (!id) {
      const body = { error: "Invalid user ID." } satisfies ErrorResponse;

      response.status(400).json(body);
      return;
    }

    if (!(await database.deleteUser(id))) {
      const body = { error: "User not found." } satisfies ErrorResponse;

      response.status(404).json(body);
      return;
    }

    response.status(204).send();
  });

  app.post(
    "/users/:followerId/follow/:followingId",
    async (request, response) => {
      const followerId = parseId(request.params.followerId);
      const followingId = parseId(request.params.followingId);

      if (!followerId || !followingId) {
        const body = { error: "Invalid user ID." } satisfies ErrorResponse;

        response.status(400).json(body);
        return;
      }

      if (followerId === followingId) {
        const body = {
          error: "A user cannot follow itself.",
        } satisfies ErrorResponse;

        response.status(400).json(body);
        return;
      }

      const [follower, following] = await Promise.all([
        database.findUserById(followerId),
        database.findUserById(followingId),
      ]);

      if (!follower || !following) {
        const body = { error: "User not found." } satisfies ErrorResponse;

        response.status(404).json(body);
        return;
      }

      if (await wouldCreateFollowCycle(database, followerId, followingId)) {
        const body = {
          error: "This follow would create a cycle.",
        } satisfies ErrorResponse;

        response.status(409).json(body);
        return;
      }

      const follow = await database.createFollow(followerId, followingId);

      if (!follow) {
        const body = {
          error: "The user is already following that user.",
        } satisfies ErrorResponse;

        response.status(409).json(body);
        return;
      }

      const body = { follow: serializeFollow(follow) } satisfies FollowResponse;

      response.status(201).json(body);
    },
  );

  app.get("/users/:followerId/following", async (request, response) => {
    const followerId = parseId(request.params.followerId);

    if (!followerId) {
      const body = { error: "Invalid user ID." } satisfies ErrorResponse;

      response.status(400).json(body);
      return;
    }

    if (!(await database.findUserById(followerId))) {
      const body = { error: "User not found." } satisfies ErrorResponse;

      response.status(404).json(body);
      return;
    }

    const [followerIds, followingIds] = await Promise.all([
      database.listFollowerIds(followerId),
      database.listFollowingIds(followerId),
    ]);
    const body = { followerIds, followingIds } satisfies FollowingResponse;

    response.json(body);
  });

  app.get("/users/:id/influence", async (request, response) => {
    const id = parseId(request.params.id);

    if (!id) {
      const body = { error: "Invalid user ID." } satisfies ErrorResponse;

      response.status(400).json(body);
      return;
    }

    if (!(await database.findUserById(id))) {
      const body = { error: "User not found." } satisfies ErrorResponse;

      response.status(404).json(body);
      return;
    }

    const body = {
      score: await calculateInfluenceScore(id, database.listFollowerIds),
    } satisfies InfluenceResponse;

    response.json(body);
  });

  app.get("/users/:id/influence/followers", async (request, response) => {
    const id = parseId(request.params.id);

    if (!id) {
      const body = { error: "Invalid user ID." } satisfies ErrorResponse;

      response.status(400).json(body);
      return;
    }

    if (!(await database.findUserById(id))) {
      const body = { error: "User not found." } satisfies ErrorResponse;

      response.status(404).json(body);
      return;
    }

    const [users, followEdges] = await Promise.all([
      database.listUsers(),
      database.listFollowEdges(),
    ]);
    const followerDepths = calculateRecursiveFollowerDepths(id, followEdges);
    const followers = users
      .filter((user) => followerDepths.has(user.id))
      .map((user) => ({
        ...serializeUser(user),
        depth: followerDepths.get(user.id) as number,
      }))
      .sort(
        (left, right) =>
          left.depth - right.depth ||
          left.username.localeCompare(right.username),
      );
    const body = { followers } satisfies RecursiveFollowersResponse;

    response.json(body);
  });

  app.delete(
    "/users/:followerId/follow/:followingId",
    async (request, response) => {
      const followerId = parseId(request.params.followerId);
      const followingId = parseId(request.params.followingId);

      if (!followerId || !followingId) {
        const body = { error: "Invalid user ID." } satisfies ErrorResponse;

        response.status(400).json(body);
        return;
      }

      if (!(await database.deleteFollow(followerId, followingId))) {
        const body = { error: "Follow not found." } satisfies ErrorResponse;

        response.status(404).json(body);
        return;
      }

      response.status(204).send();
    },
  );

  return app;
}
