# Architecture — Docker + Apache Subpath Deployment

Public URL:
https://deskbuddy.cc/dots-and-boxes/

## Stack
- Frontend: Next.js + React + TypeScript
- Backend: NestJS + TypeScript
- Realtime: Socket.IO
- Database: PostgreSQL (Prisma)
- Optional: Redis (later scaling)

## Key constraint: Subpath hosting
The application is served under `/dots-and-boxes/`, not `/`.

### Implications
- Next.js:
  - basePath: "/dots-and-boxes"
  - assetPrefix: "/dots-and-boxes/"
- API exposed at:
  - https://deskbuddy.cc/dots-and-boxes/api/
- WebSocket exposed at:
  - wss://deskbuddy.cc/dots-and-boxes/ws/

Apache reverse-proxies these paths to Docker containers.

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
