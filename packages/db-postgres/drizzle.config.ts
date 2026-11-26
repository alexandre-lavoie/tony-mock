import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url:
      process.env.POSTGRES_DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/influencial",
  },
});
