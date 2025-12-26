# Käsekästchen Multiplayer Web Game — Requirements (MVP)

## Goal
Build an online, real-time, 2-player implementation of Käsekästchen (Dots-and-Boxes)
with user accounts, per-user theme/settings, and live gameplay.

## Scope (MVP)

### Website
- User registration (email, username, password)
- Login / logout
- Profile page (username)
- Settings page
  - Theme (light/dark, accent color, board style)
- Lobby
  - Create match (choose N×M)
  - Join match via link

### Gameplay
- Board defined by N×M dots
  - N: 11–19
  - M: 11–19
- Players take turns drawing one edge between adjacent dots
- Completing a 1×1 box:
  - Claims the box for the player (X or O)
  - Grants an extra move
- Game ends when all boxes are claimed
- Winner = player with most boxes (ties allowed)

### Realtime
- Server-authoritative state
- Live updates via WebSocket
- Reconnect restores current game state

## Non-goals (MVP)
- Rankings / matchmaking
- Spectators
- In-game chat
- More than 2 players

## Acceptance Criteria
- Two authenticated users can play a full match to completion
- Invalid or out-of-turn moves are rejected server-side
- Theme settings persist across sessions
- UI is responsive on desktop and mobile

## Glossary
- Dot: grid point
- Edge: line between two adjacent dots
- Box: 1×1 square bounded by four edges
