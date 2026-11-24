# Open Product and Technical Questions
**Status:** Decisions required before final implementation. Recommendations are not approved rules.

| ID | Question | Recommended default | Affected docs | Status |
|---|---|---|---|---|
| OQ-001 | What happens when a player disconnects during a game? | Keep seat temporarily; define grace period and active status | PRD, Workflow, State, API | Open |
| OQ-002 | Does game pause if connected count falls below minimum mid-game? | Do not silently pause; define explicit reconnect/grace policy | PRD, State, Game Logic | Open |
| OQ-003 | Can Host close room during active game? | Require confirmation and define whether game aborts | PRD, API, Permissions | Open |
| OQ-004 | What if Host disconnects? | Host ownership remains fixed; reconnect Host session rather than transfer | PRD, Security, Workflow | Open |
| OQ-005 | Can disconnected player reclaim same seat? | Yes only with verified session identity | TRD, Security, API | Proposed |
| OQ-006 | How handle disconnect after vote submission? | Preserve accepted immutable vote | Game Logic, API | Proposed |
| OQ-007 | How long retain room/game history? | Define retention and deletion policy before production | Database, Security | Open |
| OQ-008 | Maximum display-name length? | Choose a documented limit and Unicode normalization policy | PRD, Database, UI | Open |
| OQ-009 | Which categories ship in MVP? | Curated category allowlist from approved dataset | PRD, Dataset | Proposed |
| OQ-010 | Custom word submissions? | Exclude from MVP; admin-reviewed import only | PRD, Security | Proposed |
| OQ-011 | Are discussion/voting timers included? | No mandatory timers in MVP | PRD, UI, TRD | Proposed |
| OQ-012 | Guest sessions or persistent accounts? | Guest session for MVP, subject to product approval | TRD, Security | Open |
| OQ-013 | Audio preferences personal or Host-controlled? | Personal preferences per client | PRD, UI | Proposed |
| OQ-014 | Exact supported player maximum? | Existing distribution table defines 3–12; confirm whether >12 is unsupported | PRD, TRD | Open |
| OQ-015 | Approved schema field `relatedness` range? | 0–1 numeric scale | Database, Dataset | Proposed |
| OQ-016 | CSV `tags` encoding? | JSON array in database; deterministic delimiter/escaping in CSV | Database, Importer | Proposed |

Do not convert Proposed recommendations into finalized behavior without approval. The finalized game rules elsewhere in this package remain binding.
