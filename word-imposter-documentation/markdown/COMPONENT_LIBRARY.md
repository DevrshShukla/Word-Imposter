# React Component Library
**Version:** 1.0

## 1. Component conventions
Use typed props, controlled state for forms, accessible semantic elements, design tokens, and server DTOs. Components must not implement authoritative game rules. Feature hooks call services/socket commands and consume server state.

## 2. Core component specifications
| Component | Purpose | Key props | States |
|---|---|---|---|
| `AppShell` | Shared page frame | `children`, `room?` | loading, ready |
| `AppHeader` | Brand/navigation | `title`, `actions?` | default, compact |
| `Button` | Standard action | `variant`, `disabled`, `loading`, `onClick` | idle, focus, loading, disabled |
| `TextField` | Validated text entry | `value`, `label`, `error`, `onChange` | empty, valid, invalid, disabled |
| `Modal` | Confirm/secondary flow | `open`, `title`, `onClose` | open, closed |
| `Toast` | Non-blocking feedback | `message`, `tone` | success, info, error |
| `PlayerCard` | Safe player summary | `player`, `actions?` | active, eliminated, disconnected |
| `PlayerList` | Room roster | `players`, `currentTurnId?` | loading, populated, empty |
| `RoomCodeCard` | Share room code | `code`, `inviteUrl` | ready, copied, error |
| `SettingsPanel` | Host configuration | `settings`, `onSave` | editable, saving, invalid |
| `RoleRevealCard` | Private role presentation | `role`, `word`, `onHide` | hidden, revealing, visible |
| `SpeakingOrder` | Turn progress | `order`, `currentPlayerId` | pending, current, complete |
| `DiscussionPanel` | Discussion status | `canStartVoting`, `onStartVoting` | waiting, enabled |
| `VotingPanel` | Select target | `eligibleTargets`, `onSubmit` | selecting, submitting, submitted |
| `VoteResults` | Aggregate results | `totals`, `elimination?` | revealed |
| `EliminationBanner` | Public elimination | `player`, `revealedRole` | visible |
| `WinnerBanner` | Team outcome | `winningTeam` | visible |
| `Leaderboard` | Cumulative scores | `entries` | loading, ready |
| `AudioSettings` | Personal audio controls | `muted`, `sfxVolume`, `musicVolume` | enabled, muted |
| `LoadingState` | Async feedback | `label?` | visible |
| `ErrorState` | Recovery guidance | `message`, `onRetry?` | visible |
| `EmptyState` | No content guidance | `title`, `description` | visible |

## 3. Example TypeScript contracts
```ts
type TeamRole = "INNOCENT" | "IMPOSTER";
type PlayerStatus = "ACTIVE" | "ELIMINATED" | "DISCONNECTED";

interface PublicPlayerDTO {
  id: string;
  displayName: string;
  isHost: boolean;
  status: PlayerStatus;
  cumulativeScore: number;
}

interface PrivateAssignmentDTO {
  role: TeamRole;
  word: string;
}

interface ButtonProps {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}
```

## 4. Component boundaries
`RoleRevealCard` may receive only the current player's private assignment. Never pass the full role map into a page component. `VoteResults` receives aggregate results only after server resolution. `PlayerCard` uses public player DTO and must not infer role. Keep socket subscriptions in feature hooks/services and clean them up on unmount.

## 5. Responsive and accessibility requirements
All controls must be keyboard operable, have labels, visible focus, and touch-friendly dimensions. Lists reflow vertically on mobile. Modals trap focus and restore focus on close. Announce phase changes through accessible live regions.
