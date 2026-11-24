# Game Rules
This document is the canonical concise rule reference. Refer to PRD.md for full requirements.

## Teams and words
Innocents share `word1`; Imposters receive related `word2`. Roles and words are private. Host participates like everyone else.

## Player distribution
3–5 players: 1 Imposter. 6–8: 2. 9–12: 3. Minimum players: 3. Custom counts must leave at least one Innocent.

## Round
Every active player speaks once in the server-generated order. The order is generated once per game and remains fixed. Discussion is untimed. Only Host starts voting after all active players speak.

## Vote
Every active player including active Host votes once, cannot vote for self, cannot change vote. Votes remain hidden until all eligible players vote. Eliminated players cannot vote.

## Elimination and tie
Unique highest vote count eliminates that player and reveals their role. Top tie means nobody is eliminated. Tied game proceeds to another round.

## Victory
Innocents win when all Imposters are eliminated. Imposters win when remaining Imposters >= remaining Innocents. Check after each completed vote.

## Points
Winning team members receive +10, including previously eliminated members. Losing team receives 0. Award once per game. Cumulative room scores persist across rematches.

## Host and spectators
Host ownership never transfers. Eliminated Host remains Host/spectator, retains permitted Host controls, cannot speak/vote. Eliminated players remain in room and see public events/results/leaderboard only.
