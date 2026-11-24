# Word Imposter 🕵️‍♂️🎭

A real-time, private-room social deduction party game built with React, TypeScript, Express, Socket.IO, and MongoDB.

In Word Imposter, players are divided into two secret teams:
- **Innocents:** Share one common secret word.
- **Imposters:** Receive a different but closely related word (from the same category and context).

Players give clues in a server-generated speaking order, debate during the discussion phase, and vote to eliminate suspected imposters.

---

## 🚀 Key Features

- **Private Rooms & Collision-Free Codes:** 6-character room codes with instant copy & shareable invite URLs (`?code=XXXXXX`).
- **Cryptographic Role & Word Delivery:** Secret words are delivered securely via private channels. The room Host has zero visibility into other players' words.
- **Authoritative Server Game Engine:**
  - Dynamic imposter balancing based on player count (3–5: 1, 6–8: 2, 9–12: 3).
  - Unbiased Fisher-Yates speaking order.
  - Discussion phase guarded by speaking turn completion.
  - Secret voting: vote targets remain completely hidden until all eligible votes are cast.
  - Tie-break rule: a tie for top votes results in no elimination and advances to the next round.
  - Elimination reveals only the eliminated player's role.
  - Idempotent scoring: +10 points awarded to the winning team once per game.
  - Cumulative leaderboard persisting across rematches.
- **Curated 1,500+ Indian Context Dataset:** Food, Bollywood & Cinema, Cricket & Sports, Indian Culture, Daily Life, and Pop Culture.
- **Zero-Config Database:** Automatically falls back to in-memory MongoDB (`mongodb-memory-server`) if no external `MONGODB_URI` is provided.
- **Procedural Audio Synthesizer:** Built with the Web Audio API — zero external mp3/wav files required, no 404s, complies with browser autoplay policies, and includes a user-controlled sound toggle.
- **Responsive Mobile-First UI:** Crafted with Tailwind CSS, Framer Motion, and Lucide icons.

---

## 🛠️ Tech Stack

- **Client:** React 18, TypeScript, Vite, Tailwind CSS, Zustand, Socket.IO Client, Framer Motion, Lucide React, Canvas Confetti.
- **Server:** Node.js, Express, TypeScript, Socket.IO, Mongoose, Zod, JWT session authentication, CSV-Parse.
- **Database:** MongoDB (with Atlas support or zero-config in-memory fallback).
- **Testing:** Vitest for pure game engine logic and state transitions.

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js >= 18.x (tested on Node v22)
- npm >= 9.x

### 2. Setup & Installation
```bash
# Clone the repository
git clone <repo-url>
cd "Word imposter"

# Install all dependencies (root, server, and client)
npm run install:all
```

Or install separately:
```bash
cd server && npm install
cd ../client && npm install
```

### 3. Environment Configuration
Copy the provided `.env.example` files:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```
*(Note: If `MONGODB_URI` is left blank in `server/.env`, the server automatically starts an in-memory MongoDB instance for local play!)*

### 4. Running Development Servers
```bash
# Start backend (Port 3000)
npm run dev:server

# In another terminal, start frontend (Port 5173)
npm run dev:client
```
Visit `http://localhost:5173` in your browser.

---

## 🧪 Testing

Run pure domain logic and game rule test suites:
```bash
npm run test
# or
cd server && npm test
```

Test coverage includes:
- Default and custom imposter distributions (`TC-004`, `TC-005`, `TC-006`)
- Private role & word assignments (`TC-007`, `TC-008`)
- Fisher-Yates speaking order and turn progression (`TC-009`, `TC-010`)
- Voting validation (no self-vote, no duplicate votes) (`TC-013`, `TC-014`)
- Elimination resolution & tie handling (`TC-016`, `TC-017`)
- Victory conditions (`TC-019`, `TC-020`)
- Idempotent scoring awards (`TC-021`)

---

## 📂 Project Structure

```
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components (PlayerCard, SpeakingOrder, etc.)
│   │   ├── pages/              # LandingPage, RoomPage
│   │   ├── services/           # REST API & Socket.IO client
│   │   ├── stores/             # Zustand game store
│   │   ├── types/              # Client DTOs and contracts
│   │   └── utils/              # Procedural Web Audio synth
├── server/                     # Node.js + Express + Socket.IO Backend
│   ├── src/
│   │   ├── controllers/        # REST controllers (room, game)
│   │   ├── engine/             # Pure domain GameEngine functions
│   │   ├── models/             # Mongoose schemas (Room, Player, Game, WordPair)
│   │   ├── routes/             # API routes (/api/v1)
│   │   ├── scripts/            # Dataset CSV import & validation script
│   │   ├── services/           # RoomService & GameService
│   │   ├── socket/             # Socket.IO event gateway
│   │   ├── types/              # Server DTOs and contracts
│   │   └── utils/              # JWT tokens, MongoDB connection helper
│   └── tests/                  # Vitest unit test suites
├── imposter_game_dataset_1500.csv # 1,500 curated word pairs
└── word-imposter-documentation/ # Product & Technical specifications
```
