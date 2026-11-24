# Error Handling
**Version:** 1.0

## 1. Error envelope
All API and socket errors should use `{ code, message, correlationId, details? }`. `details` must contain only safe validation hints, never private game data.

## 2. Error categories
- Validation: malformed payload, invalid enum, invalid name.
- Authentication: missing/expired/invalid session.
- Authorization: not Host, not room member, eliminated actor.
- Not found: room/game/player not found.
- Conflict: wrong phase, duplicate vote, duplicate name, room full, stale version.
- Rate limit: repeated room creation/join attempts.
- Dependency: database unavailable, socket adapter unavailable.
- Internal: unexpected failure with generic user message.

## 3. Stable error codes
`INVALID_PAYLOAD`, `UNAUTHENTICATED`, `FORBIDDEN`, `ROOM_NOT_FOUND`, `ROOM_CLOSED`, `ROOM_FULL`, `DUPLICATE_NAME`, `MIN_PLAYERS_NOT_MET`, `INVALID_SETTINGS`, `NO_WORD_PAIR_AVAILABLE`, `INVALID_GAME_PHASE`, `NOT_HOST`, `PLAYER_ELIMINATED`, `SELF_VOTE_NOT_ALLOWED`, `VOTE_ALREADY_SUBMITTED`, `VOTING_NOT_COMPLETE`, `STALE_GAME_VERSION`, `RATE_LIMITED`, `INTERNAL_ERROR`.

## 4. Client behavior
Show actionable, non-technical messages. Preserve user input where safe. Retry only transient errors and use idempotency keys. On stale state or reconnect, fetch authorized snapshot. Never optimistically display an elimination, winner, vote result, or score before server confirmation.

## 5. Logging
Log timestamp, severity, correlation ID, route/event, safe actor/room references, error code, and latency. Redact credentials, secret words, roles, vote targets, and personal data. Do not log complete socket payloads by default.
