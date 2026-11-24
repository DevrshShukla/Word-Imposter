# User Roles and Permissions
**Version:** 1.0

## 1. Role model
Host is a room ownership/permission attribute, not a team role. Team role is Innocent or Imposter. Elimination is a player status. These dimensions must remain separate in code and database.

## 2. Permission matrix
| Action | Active Host | Active player | Eliminated player | Eliminated Host |
|---|---:|---:|---:|---:|
| Join/create room | Yes | Yes | Existing seat | Existing seat |
| Rename in Lobby | Yes | Yes | Per Lobby policy | Per Lobby policy |
| Update settings | Yes | No | No | Yes, if Host control permitted |
| Start game | Yes | No | No | Yes only when valid between-game state |
| View own role/word | Yes | Yes | Own assignment only if policy permits | Own assignment only if policy permits |
| View others' secret words | No | No | No | No |
| Mark spoken | Yes | Yes | No | No |
| Start voting | Yes | No | No | Yes, when all conditions met |
| Submit vote | Yes | Yes | No | No |
| View vote targets before reveal | No | No | No | No |
| View results after reveal | Yes | Yes | Yes | Yes |
| View leaderboard | Yes | Yes | Yes | Yes |
| Start rematch | Yes | No | No | Yes, subject to valid room state |
| Close room | Yes | No | No | Yes, subject to approved close policy |

The Host is included in active-player permissions only while not eliminated. Eliminated Host retains Host controls explicitly permitted by the finalized rules, but never speaking or voting rights.

## 3. Backend authorization
Every command must verify authenticated player seat, room membership, Host flag, elimination status, current phase, and target validity. Frontend button visibility is a usability feature only; it is not authorization.

## 4. Spectator semantics
Eliminated participant is a spectator within the same room, not a separate identity. A separate non-player spectator role is not confirmed and must remain unimplemented until approved.

## 5. Privacy rules
Players see their own role and word only. The Host receives no special secret visibility. Eliminated players receive public game events/results and leaderboard, not unrevealed assignments. A role is publicly revealed only when the player is eliminated or game rules otherwise authorize disclosure.
