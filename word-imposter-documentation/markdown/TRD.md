# Technical Requirements Document (TRD)
**Version:** 1.0 | **Status:** Draft

## 1. Baseline stack
- Client: React, TypeScript, Vite, Tailwind CSS, React Router, Zustand (or Redux Toolkit; choose one before implementation), Framer Motion, Socket.IO Client, React Hook Form, Zod.
- Server: Node.js, Express, TypeScript, Socket.IO, Zod validation, structured logger.
- Data: MongoDB, Mongoose.
- Hosting: static frontend host; persistent Node.js backend with WebSocket support; MongoDB Atlas.

Do not mix Zustand and Redux in MVP without a concrete need. Recommended baseline is Zustand for lightweight game/session state. Server state remains authoritative.

## 2. Runtime responsibilities
**Browser:** render UI, maintain transient presentation state, submit intent, display only authorized server snapshots. Never calculate authoritative outcomes.  
**API server:** validate identity, membership, permissions, settings, and REST operations.  
**Socket server:** authenticated room channels, private player channels, event validation, broadcast sanitized public state.  
**Game engine:** deterministic state transition functions; validate phase and eligibility; calculate votes, eliminations, victory, and scoring.  
**Database:** persist rooms, player seats, game state, word-pair catalogue, votes or vote aggregates, and audit-safe events as selected in database design.

## 3. Suggested packages
| Area | Package | Purpose |
|---|---|---|
| HTTP | express | REST API |
| Realtime | socket.io / socket.io-client | Bidirectional game events |
| ODM | mongoose | MongoDB models |
| Validation | zod | Runtime request/payload validation |
| Client routing | react-router-dom | Screen routing |
| Client state | zustand | UI/session state |
| Forms | react-hook-form | Form lifecycle |
| Animation | framer-motion | Role-card and transition animation |
| Logging | pino or equivalent | Structured logs |
| Security | helmet, rate-limit middleware | HTTP hardening and abuse controls |
| Testing | vitest, supertest, socket.io-client test harness, Playwright | Unit, API, realtime, E2E |

Confirm current compatible package versions at implementation time; this document intentionally does not pin versions.

## 4. API and realtime constraints
- Use a versioned REST prefix such as `/api/v1`.
- Validate all payloads on the server.
- Authenticate socket handshake using a secure session/token.
- Derive player identity from authenticated server session, never from a trusted client-supplied `playerId`.
- Use acknowledgements for commands that require immediate success/failure.
- Use server-generated event IDs and game version/sequence numbers to support deduplication and stale-state detection.
- Public broadcasts must be constructed from explicit allowlisted DTOs.

## 5. State and concurrency
Game transitions must be guarded by current state, game ID, actor identity, and expected version. Vote submission must be idempotent per player/game/round and immutable after acceptance. Score awarding must use a unique game completion marker or atomic conditional update to prevent duplicate +10 awards. Consider MongoDB transactions where deployment topology supports them; otherwise design atomic document updates and compensating behavior explicitly.

## 6. Error handling
Use stable machine-readable error codes, safe user messages, and correlation IDs. Distinguish validation, authorization, conflict, not-found, rate-limit, and internal errors. Never include secrets or other players' private data in error responses.

## 7. Performance and capacity
Set measurable targets after selecting expected concurrent rooms and deployment tier. Load-test concurrent Socket.IO connections, room broadcasts, database contention, and reconnect bursts. Avoid unsupported numerical claims in the absence of tests.

## 8. Browser and accessibility support
Test current stable Chrome, Edge, Firefox, and Safari; mobile Safari and Chrome on Android; tablet portrait/landscape. Respect reduced-motion preference and browser autoplay policies.

## 9. Project conventions
- TypeScript strict mode.
- Shared event and DTO contracts where practical.
- No `any` for game state or event payloads.
- Separate domain logic from transport handlers.
- Use UTC timestamps.
- Store enums centrally.
- Add tests for every state transition and permission boundary.
- Keep secrets in environment variables, never in source control.

## 10. Recommended repository layout
See README.md for the proposed client/server/dataset/documentation structure. Keep game engine pure where possible so it can be unit-tested without sockets or database dependencies.
