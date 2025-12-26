# Security Checklist (MVP)

## Authentication
- Password hashing: argon2 (preferred) or bcrypt
- httpOnly cookies for auth/session
- Secure + SameSite flags in production

## API Hardening
- Rate limit login/register
- Validate all inputs (REST + WebSocket)
- Generic auth errors (no account enumeration)

## WebSocket
- Authenticate on connect
- Validate every payload
- Enforce turn order server-side

## Data
- Never store plaintext passwords
- Store minimal PII (email, username)
- Do not log secrets or tokens

## Integrity
- Server-authoritative game logic
- Persist all accepted moves
