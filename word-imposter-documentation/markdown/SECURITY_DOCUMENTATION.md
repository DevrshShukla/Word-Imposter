# Security Documentation
**Version:** 1.0

## 1. Security objectives
Protect player identity/session, room membership, secret words, role assignments, private votes, and authoritative game outcomes. Ensure all client actions are treated as untrusted input.

## 2. Threat model
Assets: session credentials, room access, assignments, word pair, votes, scores, room state. Threat actors: curious player, malicious participant, unauthenticated outsider, automated abuser, compromised client. Trust boundaries: browser↔API, browser↔Socket.IO, application↔database.

## 3. Controls
- Authenticate REST and Socket.IO using secure, expiring session credentials.
- Derive player identity from verified session, not request body.
- Authorize every command by room membership, phase, role, and status.
- Validate payload shape, length, enums, and references with Zod.
- Rate-limit room creation, join attempts, and sensitive commands.
- Use TLS, secure cookie settings where cookie sessions are chosen, and strict CORS allowlists.
- Use Helmet and safe error envelopes.
- Prevent NoSQL injection by rejecting operator-shaped user input and using typed query construction.
- Render user names as text; sanitize/validate any rich content.
- Keep secrets in environment/secret manager.
- Use least-privilege database credentials and network restrictions.
- Do not log tokens, secret words, assignments, or vote targets.
- Use dependency scanning and patching.

## 4. Attack scenarios and defenses
| Attack | Required defense |
|---|---|
| Player requests another player's word | Private assignment endpoint/event checks authenticated player ID; no public assignment map |
| Client changes its role | Role assignment is generated and persisted server-side only |
| Player submits multiple votes | Unique voter/game/round constraint and phase guard |
| Eliminated player votes | Server checks elimination status at command time |
| Non-host starts voting | Server checks Host seat identity and all-spoken condition |
| Client forges game phase | Ignore client phase; transition only through domain service |
| Unauthorized room join | Validate code, capacity, status, session, and join policy |
| Malicious socket payload | Schema validation, size limits, rate limits, safe errors |
| Repeated room creation | Per-session/IP throttling and abuse monitoring |

## 5. Privacy-specific requirements
Public DTOs are allowlisted. Never serialize Mongoose documents directly. Private role/word events target one authenticated player channel. Vote targets stay private until all eligible votes arrive. Hints and both words remain server-side. Eliminated players receive only public projections and their own permitted history.

## 6. Session and lifecycle
Session persistence, guest identity recovery, expiry, and reconnect grace period require product decisions. Rotate/revoke credentials on suspicious activity. Do not place long-lived secrets in URLs.

## 7. Security testing
Include forged identity, unauthorized room channel, role enumeration, vote replay, self-vote, duplicate vote, phase manipulation, NoSQL operator injection, XSS display name, rate-limit bypass, and log leakage tests.
