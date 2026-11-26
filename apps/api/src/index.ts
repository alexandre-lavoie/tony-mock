import type {
  CreateUserRequest,
  ErrorResponse,
  HealthResponse,
  MessageResponse,
  User,
  UserResponse,
  UsersResponse,
} from "@influencial/contracts";
import cors from "cors";
import express from "express";

import { database } from "./database";

const app = express();
const port = Number(process.env.PORT ?? 3001);

function serializeUser(
  user: Omit<User, "createdAt"> & { createdAt: Date },
): User {
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
  };
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

app.get("/api/users", async (_request, response) => {
  const users = await database.listUsers();
  const body = {
    users: users.map(serializeUser),
  } satisfies UsersResponse;

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
  const id = Number(request.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
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

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
