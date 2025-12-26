# Dots & Boxes Monorepo

This repository is a pnpm workspaces monorepo scaffold for the Dots & Boxes project.

## Prerequisites
- Node.js 20+
- pnpm (see https://pnpm.io/installation)

## Install
```
pnpm install
```

## Development
Run all app dev scripts concurrently:
```
pnpm dev
```

- apps/web: Next.js frontend
- apps/api: NestJS backend
- packages/shared: Pure TypeScript shared logic

## Local Database (PostgreSQL via docker-compose)
Prereqs: Docker + Docker Compose.

1) Start Postgres (mapped to localhost:5432):
```
docker compose up -d db
```

2) Configure API env (from example):
```
cp apps/api/.env.example apps/api/.env
```

3) Install deps and generate Prisma client:
```
pnpm install
pnpm --filter api prisma:generate
```

4) Run initial migration and seed:
```
pnpm --filter api prisma:migrate -- --name init
pnpm --filter api seed
```

5) (Optional) Open Prisma Studio:
```
pnpm --filter api prisma:studio
```

6) Start API and Web for dev:
```
pnpm dev
```
API: http://localhost:4000/api/health
DB check: http://localhost:4000/api/db-check
WS: ws://localhost:4000/ws

## Workspace Layout
- apps/web
- apps/api
- packages/shared

## Deployment (Docker Compose + Apache proxy)

1) Build images:
```
docker compose build
```

2) Start stack:
```
docker compose up -d
```

Services start on an internal network only (no published ports). Healthchecks ensure:
- db is ready via pg_isready
- api healthy when http://api:3001/api/health returns 200
- web healthy when http://web:3000/dots-and-boxes returns 200

3) Reverse proxy (Apache) for a subpath /dots-and-boxes on your domain (e.g., https://deskbuddy.cc/dots-and-boxes):

Enable required modules: proxy, proxy_http, proxy_wstunnel, headers.

Example VirtualHost snippet:
```
# Serve Next.js UI under /dots-and-boxes
ProxyPass        /dots-and-boxes           http://127.0.0.1:3000/dots-and-boxes
ProxyPassReverse /dots-and-boxes           http://127.0.0.1:3000/dots-and-boxes

# Forward REST API under /dots-and-boxes/api -> Nest at /api
ProxyPass        /dots-and-boxes/api       http://127.0.0.1:3001/api
ProxyPassReverse /dots-and-boxes/api       http://127.0.0.1:3001/api

# Forward WebSocket gateway under /dots-and-boxes/ws -> Nest at /ws
ProxyPass        /dots-and-boxes/ws        ws://127.0.0.1:3001/ws
ProxyPassReverse /dots-and-boxes/ws        ws://127.0.0.1:3001/ws

# Optional: allow WebSocket upgrade
RewriteEngine On
RewriteCond %{HTTP:Upgrade} =websocket [NC]
RewriteRule /dots-and-boxes/ws/(.*) ws://127.0.0.1:3001/ws/$1 [P,L]
```

4) Environment variables
- API (apps/api):
  - DATABASE_URL=postgresql://dots:dots_change_me@db:5432/dots
  - CORS_ORIGIN=https://deskbuddy.cc (or your dev origin)
  - PORT=3001 (default)
- Web (apps/web):
  - NEXT_PUBLIC_BASE_PATH=/dots-and-boxes
  - NEXT_PUBLIC_API_BASE=/dots-and-boxes/api
  - NEXT_PUBLIC_WS_PATH=/dots-and-boxes/ws

5) Verify
- API health: https://deskbuddy.cc/dots-and-boxes/api/health
- API version: https://deskbuddy.cc/dots-and-boxes/api/version (or /api/health/version also available)
- Web root: https://deskbuddy.cc/dots-and-boxes/

If you cannot publish ports, rely on the reverse proxy only. The docker-compose healthchecks ensure containers are healthy.
