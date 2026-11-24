# Game Logic and Authoritative Algorithms

## 1. Imposter count
Default function:
- if players 3–5: 1
- if 6–8: 2
- if 9–12: 3
- reject unsupported roster sizes unless product limits are expanded.
For custom count, require integer >=1 and `< playerCount` so at least one Innocent remains.

## 2. Role assignment
Use server cryptographic randomness to shuffle roster or sample unique Imposter indices. Assign exactly configured count. All other players are Innocents. Map Innocent→`word1`, Imposter→`word2`. Persist mapping before sending private events.

## 3. Word selection
Filter `isActive`, category, difficulty, and supported `wordLanguage`. Select uniformly from eligible candidates unless a future weighted strategy is approved. If no candidate exists, reject start with a safe configuration error; do not silently select a mismatched pair.

## 4. Speaking order
Use Fisher-Yates with a cryptographically secure random source. Persist one order per game. Each round traverses that order but skips eliminated players. Do not reshuffle between rounds.

## 5. Speaking completion
Accept only if phase is SPEAKING, player is active, and player has not already marked spoken in current round. Once all active players have marked spoken, transition to DISCUSSION.

## 6. Voting
Eligible voters are active players at voting start. Reject self-target, inactive target, non-active voter, duplicate vote, wrong round, or wrong phase. Persist immutable vote. Do not publish target until all eligible votes are recorded.

## 7. Resolution
Count target IDs. If no votes or malformed state, fail closed and log a safe integrity error. Find maximum count. If multiple targets share maximum, tie: no elimination. If exactly one, eliminate that player and reveal role.

## 8. Victory
After every completed voting round:
- if remaining Imposters == 0 → INNOCENTS win;
- else if remaining Imposters >= remaining Innocents → IMPOSTERS win;
- else continue.
Use counts of non-eliminated players only.

## 9. Scoring
On first completed transition, for each player assigned to winning team add 10. Others add 0. Guard with `scoreAwardedAt` or equivalent atomic marker. Never award per round.

## 10. Rematch
Create a new game ID and reset assignments, words, votes, speaking completion, eliminations, round number, and per-game flags. Preserve room player identities and cumulative scores. Generate a new word pair and new speaking order.
