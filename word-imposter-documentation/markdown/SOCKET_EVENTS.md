# Socket.IO Event Catalogue

## Contract principles
Commands are client-to-server intents. Server validates identity, membership, phase and permission. Events are server-to-client facts. Use acknowledgements and stable error codes. Private assignment events target only one authenticated player channel.

## Event list
| Event | Direction | Audience | Contract |
|---|---|---|---|
| `room:join` | C→S | command | `{ roomCode }` |
| `room:leave` | C→S | command | `{ reason? }` |
| `room:updated` | S→C | room | Sanitized room snapshot |
| `player:joined` | S→C | room | Public player DTO |
| `player:left` | S→C | room | Player ID and safe status |
| `player:renamed` | S→C | room | Player ID and display name |
| `game:settingsUpdated` | S→C | room | Public validated settings |
| `game:started` | S→C | room | Game ID, phase, round |
| `role:assigned` | S→C | one player | Own role and own word only |
| `speaking:turnStarted` | S→C | room | Current player and round |
| `speaking:marked` | S→C | room | Player ID and completion status |
| `discussion:started` | S→C | room | Phase metadata |
| `voting:started` | S→C | room | Eligible voter count |
| `vote:submitted` | S→C | room | Submitted count only; no target |
| `voting:results` | S→C | room after completion | Aggregate counts and outcome |
| `player:eliminated` | S→C | room | Player ID and revealed role |
| `game:ended` | S→C | room | Winning team and public outcome |
| `leaderboard:updated` | S→C | room | Public score entries |
| `game:rematch` | S→C | room | New game metadata |
| `player:reconnected` | S→C | room | Public connection status |
| `error:occurred` | S→C | requesting client | Safe error envelope |

## Security
Never include the full assignments map in any event. Never include vote targets in `vote:submitted`. Do not let client choose socket room names or player identity. Use server-side room membership and per-player private channels.
