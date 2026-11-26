import type {
  HealthResponse,
  MessageResponse,
  UsersResponse,
} from "@influencial/contracts";
import cors from "cors";
import express from "express";

import { database } from "./database";

const app = express();
const port = Number(process.env.PORT ?? 3001);

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
    users: users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
    })),
  } satisfies UsersResponse;

  response.json(body);
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
