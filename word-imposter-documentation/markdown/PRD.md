# Product Requirements Document (PRD)
**Product:** Word Imposter  
**Version:** 1.0 | **Status:** Draft for implementation review

## 1. Product summary
Word Imposter is a private-room, real-time social deduction game. Most players receive one shared secret word (Innocents); Imposters receive a different but related word. Players describe their words in a fixed speaking order, discuss, and vote. The server determines eliminations, team victory, scoring, and room leaderboard state.

## 2. Problem, vision, and goals
**Problem:** Casual groups need a low-friction party game that works across personal devices without requiring a physical moderator or exposing secret information.  
**Vision:** A fast-to-join, mobile-first party game with understandable rules, reliable synchronization, and culturally relevant word pairs.  
**Goals:** private room creation/joining; secure role delivery; authoritative multiplayer state; repeatable rounds; cumulative room scoring; accessible responsive UI; curated Indian-context dataset.

## 3. Non-goals for MVP
Persistent social profiles, public matchmaking, chat moderation beyond basic input controls, ranked global matchmaking, payments, voice/video calling, and mandatory timed turns are outside the confirmed MVP unless separately approved.

## 4. Users and personas
- **Room creator / Host:** creates a room, participates as a player, starts games and voting, manages permitted room controls.
- **Joining player:** joins with a code/link, chooses a unique room display name, plays according to assigned role.
- **Eliminated participant:** remains in the room as a spectator, sees public events/results and leaderboard, but cannot speak or vote.
- **Potential non-player spectator:** not finalized; do not implement without a product decision.

## 5. Core user journeys
1. Host creates room → receives code/link → shares invitation.
2. Players join → choose unique names → wait in Lobby.
3. Host configures valid settings → starts game.
4. Server selects an eligible word pair, assigns roles and words, shuffles speaking order, persists game state.
5. Each player privately views their own role/word.
6. Active players mark their speaking turn complete in persisted order.
7. After all active players speak, Host starts discussion-to-voting transition by initiating voting.
8. Eligible players submit one immutable vote each; votes remain hidden until all eligible votes are received.
9. Server reveals aggregate results, applies tie/elimination rule, reveals only eliminated player's role, checks victory.
10. If no winner, next round uses the same speaking order; if game ends, score winning team once and update cumulative leaderboard.
11. Host may start a rematch; game-specific state resets while room scores persist.

## 6. Functional requirements
| ID | Priority | Requirement |
|---|---|---|
| FR-001 | Must | Create a private room with unique code and invitation URL. |
| FR-002 | Must | Join by code or invitation URL after server validation. |
| FR-003 | Must | Enforce unique normalized display names per room. |
| FR-004 | Must | Host participates and receives a normal private role/word assignment. |
| FR-005 | Must | Validate player count and imposter count before game start. |
| FR-006 | Must | Assign Innocents one common word and Imposters the paired word. |
| FR-007 | Must | Deliver only each player's own role and word privately. |
| FR-008 | Must | Generate and persist one unbiased speaking order per game. |
| FR-009 | Must | Require every active player to mark spoken once per round. |
| FR-010 | Must | Permit voting initiation only by Host after all active players speak. |
| FR-011 | Must | Accept exactly one vote from each active player; prohibit self-vote and vote changes. |
| FR-012 | Must | Keep votes hidden until all eligible votes are submitted. |
| FR-013 | Must | Eliminate unique highest-vote player; eliminate nobody on a top tie. |
| FR-014 | Must | Reveal eliminated player's role and retain eliminated player in room. |
| FR-015 | Must | Apply finalized team win conditions after every completed vote. |
| FR-016 | Must | Award +10 to every winning-team member exactly once per game. |
| FR-017 | Must | Maintain cumulative room leaderboard across rematches. |
| FR-018 | Must | Support rematch and reset game-specific state without resetting room scores. |
| FR-019 | Must | Support spectator permissions and eliminated Host controls. |
| FR-020 | Must | Support responsive mobile, tablet, and desktop interfaces. |
| FR-021 | Must | Select word pairs by active status, category, difficulty, and language. |
| FR-022 | Should | Provide sound and animation preferences without blocking gameplay. |

## 7. Business rules
- Minimum initial player count is 3.
- Default imposters: 3–5 players → 1; 6–8 → 2; 9–12 → 3.
- Custom imposter count must leave at least one Innocent.
- Host never receives privileged access to secret assignments.
- Speaking order includes Host and remains fixed for the game.
- Eliminated players cannot speak or vote.
- Innocents win when no Imposters remain.
- Imposters win when remaining Imposters >= remaining Innocents.
- Winning-team members, including previously eliminated members, receive +10; losing team receives 0.
- Points are awarded once at game completion, not after each round.

## 8. Settings and content
Settings include player limits, imposter count, difficulty (Easy/Medium/Hard), word category, and optional presentation preferences. Discussion/voting timers are not mandatory. Timer behavior, if introduced, requires approval. Word-pair data must follow the approved schema in DATABASE_DESIGN.md and dataset contract.

## 9. Non-functional requirements
- **Security:** server-authoritative state; private role/word delivery; authorization on every state-changing operation.
- **Consistency:** serialize or atomically guard competing game actions to prevent duplicate votes, double scoring, and invalid phase changes.
- **Reliability:** reconnecting clients receive an authorized state snapshot; server restart recovery behavior must be defined and tested.
- **Performance:** define measurable latency and capacity targets during deployment planning; do not claim untested targets.
- **Accessibility:** keyboard operability, visible focus, semantic labels, sufficient contrast, reduced-motion support.
- **Responsive:** no horizontal overflow at supported viewport sizes.
- **Observability:** structured logs with correlation IDs; never log secret words, roles, tokens, or raw vote choices unnecessarily.

## 10. MVP scope and future scope
**MVP:** private rooms, guest/session identity, lobby, settings, roles, word delivery, speaking, discussion, voting, elimination, win checks, scoring, leaderboard, rematch, core sound/animation toggles, curated dataset.  
**Future:** persistent accounts, public matchmaking, analytics dashboard, custom word submissions, localization expansion, optional timers, advanced moderation.

## 11. Risks and mitigations
- Secret leakage → private socket events and response allowlists.
- Race conditions → server-side phase guards, transactions/atomic updates, idempotency.
- Disconnect ambiguity → document in OPEN_QUESTIONS.md before final implementation.
- Poor pair quality → automated duplicate checks plus human review.
- WebSocket hosting mismatch → persistent backend with WebSocket support.
- Audio autoplay denial → user-initiated audio enablement and silent fallback.

## 12. Success measures
Track room creation success, join success, game-start completion, round completion, rematch rate, disconnect/reconnect recovery, invalid-action rate, and dataset rejection rate. Define analytics consent and retention before collecting identifiable telemetry.

## 13. Traceability
Requirement IDs in this document map to acceptance criteria `AC-*`, test cases `TC-*`, API/socket contracts in API_DOCUMENTATION.md, and data entities in DATABASE_DESIGN.md.
