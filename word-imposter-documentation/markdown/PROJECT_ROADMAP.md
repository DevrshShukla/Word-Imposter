# Project Roadmap
**Version:** 1.0 | Estimates are relative and must be re-estimated by the implementation team.

## Phase 1 — Foundation
Objectives: repository, TypeScript conventions, lint/typecheck, environment setup. Deliverables: client/server skeleton, README, CI checks. Depends on: approved stack. Exit: both apps build and run locally.

## Phase 2 — Data and domain model
Objectives: MongoDB models, indexes, word-pair importer, validation. Deliverables: schema, seed/import scripts, dataset report. Exit: approved sample records import and invalid records reject.

## Phase 3 — Rooms and lobby
Objectives: create/join, unique code, sessions, names, live roster, settings. Exit: 3+ clients can join and receive consistent lobby state.

## Phase 4 — Realtime foundation
Objectives: authenticated Socket.IO, room/private channels, reconnect snapshot, event acknowledgements. Exit: unauthorized clients cannot join private channels.

## Phase 5 — Game initialization
Objectives: settings validation, pair selection, role distribution, fixed speaking order, private delivery. Exit: privacy tests pass for all clients including Host.

## Phase 6 — Speaking and discussion
Objectives: speaking order, mark-as-spoken, phase guard, Host discussion/voting control. Exit: voting cannot start early.

## Phase 7 — Voting and elimination
Objectives: immutable votes, hidden target data, aggregate reveal, tie behavior, elimination. Exit: concurrency and tie tests pass.

## Phase 8 — Victory and scoring
Objectives: team checks, once-only score award, leaderboard. Exit: all win-condition and retry tests pass.

## Phase 9 — Rematch and room lifecycle
Objectives: game reset, score persistence, room close, between-game states. Exit: rematch does not leak old assignments or reset scores.

## Phase 10 — UX polish
Objectives: responsive screens, role animation, audio controls, accessibility. Exit: supported viewport and reduced-motion checks pass.

## Phase 11 — Dataset expansion
Objectives: import and quality review of 1,500+ approved pairs. Exit: no duplicate/reversed pair IDs, quality report and human review completed.

## Phase 12 — QA and security
Objectives: E2E, load, authorization, privacy, abuse tests. Exit: P0 test suite passes and no open critical vulnerabilities.

## Phase 13 — Production deployment
Objectives: staging/prod environments, monitoring, backup/restore, rollback. Exit: smoke tests pass and operational runbook is available.

## MVP boundary
MVP ends when core room-to-game-to-rematch journey is secure, tested, and deployed. Persistent accounts, public matchmaking, optional timers, user-generated word submissions, and advanced analytics remain post-MVP unless explicitly approved.
