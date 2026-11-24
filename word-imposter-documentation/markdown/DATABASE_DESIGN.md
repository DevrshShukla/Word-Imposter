# Database Design
**Database:** MongoDB | **ODM:** Mongoose | **Version:** 1.0

## 1. Design principles
Persist durable room/game state, keep public and private projections separate, use UTC timestamps, index room lookup and active catalogue filters, and make state-changing operations idempotent. Never serialize internal documents directly to clients.

## 2. Word-pair dataset contract — approved schema
The approved CSV/document fields are:
| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable unique pair identifier |
| `word1` | string | Innocent-side word |
| `word2` | string | Imposter-side word |
| `category` | string | Curated category |
| `difficulty` | enum | `Easy`, `Medium`, `Hard` |
| `relationshipType` | enum | `similar`, `contextual`, `indirect`, `contrast` |
| `relatedness` | number | Numeric relatedness score; validate agreed range, recommended 0–1 |
| `hint` | string | Internal relationship explanation; never sent to players |
| `isActive` | boolean | Whether eligible for selection |
| `tags` | string[] or CSV-encoded list | Normalize consistently during import |
| `wordLanguage` | enum | `en`, `hi-Latn`, `mixed` |
| `language` | string | Dataset/content language label as approved |
| `createdAt` | ISO timestamp | Creation time |
| `updatedAt` | ISO timestamp | Last update |

**Important:** This contract supersedes earlier illustrative `pairId/innocentWord/imposterWord` examples. Do not rename approved fields in the CSV. The game engine may map `word1` to Innocent and `word2` to Imposter internally, but the mapping must be consistent and documented. The user-approved dataset preferences are 1,500+ unique pairs, Indian scope, Roman Hindi, Indian pop culture, and English/Roman Hindi content.

Allowed relationship types: similar/contextual/indirect/contrast. Allowed difficulty: Easy/Medium/Hard. `wordLanguage`: `en`, `hi-Latn`, `mixed`. Example conceptual records:
- `Samosa` / `Kachori`, Food, Easy, similar, relatedness 0.95.
- `Popcorn` / `Cinema`, Food, Medium, indirect, relatedness 0.75.
- `Cow` / `Milk`, Animals, Medium, contextual, relatedness 0.95.
- `Teacher` / `Student`, Profession, Easy, contextual, relatedness 0.95.

Validate duplicate and reversed pairs case-insensitively after Unicode normalization and whitespace normalization. Keep hints private. Require human review for cultural accuracy, pair quality, and transliteration.

## 3. Suggested collections
### rooms
Fields: `_id`, `code` (unique indexed), `hostPlayerId`, `status`, `settings`, `createdAt`, `updatedAt`, `closedAt`. Store only public room settings and membership references here.

### players
Fields: `_id`, `roomId`, `sessionSubject`, `displayName`, `normalizedName`, `isHost`, `connectionStatus`, `eliminatedAt`, `cumulativeScore`, `joinedAt`, `lastSeenAt`. Unique compound index on `{roomId, normalizedName}`. Do not expose `sessionSubject`.

### games
Fields: `_id`, `roomId`, `gameNumber`, `phase`, `roundNumber`, `settingsSnapshot`, `wordPairId`, `speakingOrder`, `spokenPlayerIds`, `assignments` (private server-only role/word mapping), `votes` or reference, `winnerTeam`, `scoreAwardedAt`, `version`, `startedAt`, `completedAt`. Access through service layer only; never return full document.

### wordPairs
Import the exact approved fields. Unique index on `id`; indexes on `{isActive, category, difficulty, wordLanguage}`. Store normalized comparison keys separately only if needed for duplicate detection.

### votes (optional separate collection)
If separate: `gameId`, `roundNumber`, `voterPlayerId`, `targetPlayerId`, `submittedAt`. Unique compound index `{gameId, roundNumber, voterPlayerId}`. Keep records private until resolution. A vote aggregate embedded in game may be simpler for small rooms; choose one strategy and use it consistently.

### gameEvents (optional)
Append-only public event history with `gameId`, `sequence`, `type`, safe `payload`, `createdAt`. Never store secret words or full role assignments in public event payloads.

## 4. Indexes and validation
- `rooms.code`: unique.
- `players`: unique `{roomId, normalizedName}` and lookup `{roomId, connectionStatus}`.
- `games`: `{roomId, gameNumber}` unique; `{roomId, phase}` for active lookup.
- `wordPairs.id`: unique; filter index described above.
- `votes`: unique voter-per-round index.
Validate enum values, player references, phase transitions, and score award marker in application/domain layer as well as schema constraints where possible.

## 5. Privacy boundaries
Public room DTO: room code/status/settings and safe player fields.  
Private player DTO: own role and own word only.  
Game internal document: assignments and vote targets, server-only.  
Public result DTO: aggregate vote counts after reveal, eliminated player and revealed role, winner and leaderboard.  
Never expose `hint`, both pair words, another player's assignment, session secrets, or unrevealed role.

## 6. Word selection and import
Select only `isActive=true` records matching category/difficulty/language. Avoid immediate repeats by storing recent pair IDs per room/game history if that feature is approved. Import process: parse CSV → validate headers → normalize → validate enums and score range → detect direct/reversed duplicates → manual review status → bulk upsert by `id` → report rejected rows. Preserve source CSV and import report.

## 7. Data lifecycle and backups
Room/game retention duration is unresolved. Define TTL only after approval; do not TTL active rooms or uncompleted games. Back up production database and test restore. Use migrations/versioned seed scripts; never rely on destructive seed behavior in production.

## 8. Example WordPair document
```json
{
  "id": "WP-0001",
  "word1": "Samosa",
  "word2": "Kachori",
  "category": "Food",
  "difficulty": "Easy",
  "relationshipType": "similar",
  "relatedness": 0.95,
  "hint": "Popular Indian fried snacks",
  "isActive": true,
  "tags": ["Indian-food", "snacks"],
  "wordLanguage": "en",
  "language": "English",
  "createdAt": "2026-11-19T00:00:00.000Z",
  "updatedAt": "2026-11-19T00:00:00.000Z"
}
```
