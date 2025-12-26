# Architecture — Docker + Root Deployment

Public URL:
https://your-domain.example/

## Stack
- Frontend: Next.js + React + TypeScript
- Backend: NestJS + TypeScript
- Realtime: Socket.IO
- Database: PostgreSQL (Prisma)
- Optional: Redis (later scaling)

## Hosting
The application is served at the site root '/' on its own domain.

### Implications
- Next.js:
  - No basePath; assets served from '/'
- API exposed at:
  - https://your-domain.example/api/
- WebSocket exposed at:
  - wss://your-domain.example/ws/

A reverse proxy terminates TLS and forwards traffic to Docker containers.

## Repository layout (planned)
- apps/web        → Next.js frontend
- apps/api        → NestJS backend
- packages/shared → Shared TS types + game engine

## Authority model
- Server is authoritative for:
  - move validation
  - scoring
  - turn order
  - game end
- Clients only render server state.

## Edge encoding
Edge = { orientation, row, col }

- orientation: "H" | "V"
- H(r,c): (r,c) → (r,c+1)
- V(r,c): (r,c) → (r+1,c)

Box (r,c) is complete if:
- H(r,c), H(r+1,c), V(r,c), V(r,c+1)

## Persistence (MVP)
- Users
- UserSettings (JSONB theme)
- Matches (metadata)
- MatchMoves (audit log)

## Deployment
- docker-compose runs:
  - web
  - api
  - postgres
- Apache runs on host and proxies HTTPS traffic
