# Testing Documentation
**Version:** 1.0

## 1. Strategy
Test pure game rules at unit level, service/database behavior at integration level, REST contracts with API tests, Socket.IO authorization and privacy with multi-client tests, and complete journeys with browser automation. Every confirmed requirement must map to one or more tests.

## 2. Test layers and tools
- Unit: Vitest for role distribution, Fisher-Yates properties, vote counting, tie resolution, win checks, scoring idempotency.
- API: Supertest for validation, authorization, response allowlists.
- Database: isolated test database for indexes, uniqueness, persistence, atomicity.
- Realtime: Socket.IO test clients for room membership, private events, ordering, duplicate commands.
- E2E: Playwright with at least 3 browser contexts; expand to 6+ for multi-imposter scenarios.
- Security: negative tests for forged IDs, unauthorized events, payload abuse, rate limits.
- Visual/accessibility: responsive viewport matrix and automated accessibility scans, followed by manual keyboard/screen-reader review.

## 3. Core test cases
| ID | Scenario | Expected result | Priority |
|---|---|---|---|
| TC-001 | Create room | Unique code and Host seat created | P0 |
| TC-002 | Join invalid code | Safe not-found error | P1 |
| TC-003 | Duplicate normalized name | Join/rename rejected | P1 |
| TC-004 | Start with fewer than 3 | Rejected | P0 |
| TC-005 | Default imposter distribution | 3–5:1, 6–8:2, 9–12:3 | P0 |
| TC-006 | Custom count leaves no Innocent | Rejected | P0 |
| TC-007 | Private assignment | Each client receives own word only | P0 |
| TC-008 | Host is assigned role | Host gets one normal role/word | P0 |
| TC-009 | Speaking order | Server order includes Host and persists | P0 |
| TC-010 | Duplicate mark spoken | Second action rejected/idempotently acknowledged | P1 |
| TC-011 | Host starts vote early | Rejected until all active spoken | P0 |
| TC-012 | Non-host starts vote | Forbidden | P0 |
| TC-013 | Self vote | Rejected | P0 |
| TC-014 | Duplicate vote | Rejected; first vote immutable | P0 |
| TC-015 | Vote privacy | Targets hidden before all votes | P0 |
| TC-016 | Unique highest vote | Correct player eliminated | P0 |
| TC-017 | Top tie | No player eliminated | P0 |
| TC-018 | Eliminated player acts | Speak/vote rejected | P0 |
| TC-019 | Innocents win | Trigger when no Imposters remain | P0 |
| TC-020 | Imposters win | Trigger when imposters >= innocents | P0 |
| TC-021 | Scoring | Winning team +10 once; losing team 0 | P0 |
| TC-022 | Rematch | Game state reset; cumulative scores retained | P0 |
| TC-023 | Eliminated Host | No speaking/voting; permitted Host controls remain | P0 |
| TC-024 | Reconnect | Only authorized seat snapshot delivered | P1 |
| TC-025 | Word-pair import | Reject invalid/reversed duplicate records | P1 |
| TC-026 | Public DTO audit | No roles/words/hints/vote targets leaked | P0 |

## 4. Property and edge testing
- Role assignment always produces configured imposter count and at least one Innocent.
- Speaking order contains each eligible player exactly once.
- Vote totals equal accepted vote count.
- A tie never eliminates a player.
- Scoring is invariant under retry and duplicate completion event.
- Rematch clears game-specific state but preserves scores.
- Concurrent submissions from one voter produce at most one accepted vote.
- Concurrent Host commands cannot move phase twice.

## 5. Privacy tests
Capture all REST responses, room broadcasts, reconnect snapshots, logs, and client-visible state. Assert no unassigned secret word, unrevealed role, internal hint, raw vote target, session token, or private identifier is leaked.

## 6. Release gate
Do not release with failing P0 tests, unresolved critical privacy defects, broken reconnect authorization, duplicate scoring, or invalid game state transitions. Record test environment, build, results, and known issues.
