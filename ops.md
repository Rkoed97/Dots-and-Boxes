# Ops Notes — docker-compose + Apache

## Public URL
https://deskbuddy.cc/dots-and-boxes/

## Containers
- web  → Next.js (port 3000 internal)
- api  → NestJS  (port 3001 internal)
- db   → PostgreSQL

## Reverse proxy routing
Apache maps:
- /dots-and-boxes/      → web:3000
- /dots-and-boxes/api/  → api:3001
- /dots-and-boxes/ws/   → api:3001 (WebSocket)

## Environment variables
Frontend:
- NEXT_PUBLIC_BASE_PATH=/dots-and-boxes
- NEXT_PUBLIC_API_BASE=/dots-and-boxes/api
- NEXT_PUBLIC_WS_PATH=/dots-and-boxes/ws

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
