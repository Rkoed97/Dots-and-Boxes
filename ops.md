# Ops Notes — docker-compose + reverse proxy

## Public URL
https://your-domain.example/

## Containers
- web  → Next.js (port 3000 internal)
- api  → NestJS  (port 3001 internal)
- db   → PostgreSQL

## Reverse proxy routing
Map root and service paths:
- /           → web:3000
- /api/       → api:3001
- /ws/        → api:3001 (WebSocket)

## Environment variables
Frontend:
- NEXT_PUBLIC_API_BASE=/api (default)
- NEXT_PUBLIC_WS_PATH=/ws (default)

Backend:
- DATABASE_URL
- AUTH_SECRET
- REST prefix: /api
- WS path: /ws

## Scaling note
If API is scaled horizontally:
- Add Redis
- Use Socket.IO Redis adapter
- Move active match state out of memory
