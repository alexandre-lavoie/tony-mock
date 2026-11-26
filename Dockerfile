# syntax=docker/dockerfile:1

FROM node:24-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

FROM base AS pruner

COPY . .

RUN pnpm dlx turbo@2.11.13 prune @influencial/web --docker

FROM base AS dependencies

COPY --from=pruner /app/out/json/ ./

RUN pnpm install --frozen-lockfile

FROM dependencies AS builder

COPY --from=pruner /app/out/full/ ./
COPY --from=pruner /app/tsconfig.base.json ./tsconfig.base.json

RUN pnpm turbo build --filter=@influencial/web

FROM node:24-alpine AS runner

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
