# Acceptance Criteria
**Version:** 1.0 | Use Given/When/Then format

## Room and lobby
- **AC-001 (FR-001):** Given a valid session, when the user creates a room, then the server creates a unique room code and Host seat.
- **AC-002 (FR-002):** Given an open room with capacity, when a player joins with a valid code, then the player appears in the live roster.
- **AC-003 (FR-003):** Given a name already used in the room after normalization, when another player submits the same name, then the server rejects it.
- **AC-004 (FR-005):** Given fewer than three eligible connected players, when Host starts, then the game does not start and a safe reason is returned.

## Roles and words
- **AC-005 (FR-006):** Given valid settings, when game initialization succeeds, then configured Imposters receive word2 and Innocents receive word1.
- **AC-006 (FR-007):** Given multiple players, when assignments are delivered, then each player receives only their own role and word.
- **AC-007 (FR-004):** Given Host starts a game, then Host receives an ordinary player assignment and cannot inspect others' assignments.
- **AC-008 (FR-008):** Given a new game, then server-generated speaking order contains every initially active player once and remains fixed for that game.

## Speaking and voting
- **AC-009 (FR-009):** Given an active player whose turn is pending, when they mark spoken, then server records completion once.
- **AC-010 (FR-010):** Given at least one active player has not spoken, when Host starts voting, then server rejects the command.
- **AC-011 (FR-011):** Given an active eligible voter, when they vote for another active player, then one immutable vote is accepted.
- **AC-012 (FR-011):** Given a player votes for themselves or submits a second vote, then server rejects the invalid action.
- **AC-013 (FR-012):** Given incomplete voting, then no client receives vote targets or result totals.
- **AC-014 (FR-013):** Given all eligible votes are received, when one player has unique highest count, then that player is eliminated.
- **AC-015 (FR-013):** Given a tie for highest count, then nobody is eliminated and another round begins if no win condition is met.

## Victory and scoring
- **AC-016 (FR-015):** Given all Imposters are eliminated, then Innocents win.
- **AC-017 (FR-015):** Given remaining Imposters are greater than or equal to remaining Innocents, then Imposters win.
- **AC-018 (FR-016):** Given a completed game, then each winning-team member including eliminated members receives +10 exactly once; losing team receives zero.
- **AC-019 (FR-017):** Given a completed game, then cumulative room leaderboard reflects awarded scores and includes active and eliminated players.

## Rematch and privacy
- **AC-020 (FR-018):** Given a completed game, when Host starts rematch, then game-specific state resets and cumulative room scores remain.
- **AC-021 (FR-019):** Given an eliminated player, when they attempt to speak or vote, then server rejects the action.
- **AC-022 (FR-019):** Given an eliminated Host, then Host may use permitted Host controls but cannot speak or vote.
- **AC-023 (NFR-001):** Given any public snapshot or broadcast, then no unrevealed role, private word, hint, session token, or private vote target is exposed.

## UX and deployment
- **AC-024 (FR-020):** Given supported viewport sizes, then screens remain usable without horizontal page overflow.
- **AC-025 (FR-022):** Given browser autoplay restrictions, then gameplay continues even if audio cannot play.
- **AC-026 (NFR-002):** Given a backend restart/reconnect, then clients receive only an authorized state snapshot and cannot mutate stale state.
