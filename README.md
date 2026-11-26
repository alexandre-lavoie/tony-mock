# Influencial

A platform to let others know you are better than them.

## Run locally with SQLite

Requires Node.js and pnpm.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
DATABASE_URL=file:../../local.db pnpm --filter @influencial/db-sqlite migrate
pnpm dev
```

Open http://localhost:3000. On first startup, the empty database is seeded with
demo users.

## Build the web app with Docker

```bash
docker build \
  -t influencial-web .

docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -e API_URL=http://host.docker.internal:3001 \
  -p 3000:3000 \
  influencial-web
```

Open http://localhost:3000. Set `API_URL` when running the container to point the
same image at a different API without rebuilding it.
