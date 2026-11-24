export type TeamRole = 'INNOCENT' | 'IMPOSTER';

export type PlayerStatus = 'ACTIVE' | 'ELIMINATED' | 'DISCONNECTED';

export type GamePhase =
  | 'LOBBY'
  | 'INITIALIZING'
  | 'ROLE_REVEAL'
  | 'SPEAKING'
  | 'DISCUSSION'
  | 'VOTING'
  | 'VOTE_RESULTS'
  | 'ELIMINATION'
  | 'COMPLETED'
  | 'BETWEEN_GAMES'
  | 'CLOSED';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type RelationshipType = 'similar' | 'contextual' | 'indirect' | 'contrast';
export type WordLanguage = 'en' | 'hi-Latn' | 'mixed';

export interface RoomSettings {
  imposterCount: number;
  difficulty: Difficulty | 'Any';
  category: string;
  wordLanguage: WordLanguage | 'Any';
}

export interface IWordPair {
  id: string;
  word1: string; // Innocent word
  word2: string; // Imposter word
  category: string;
  difficulty: Difficulty;
  relationshipType: RelationshipType;
  relatedness: number;
  hint: string;
  isActive: boolean;
  tags: string[];
  wordLanguage: WordLanguage;
  language: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicPlayerDTO {
  id: string;
  displayName: string;
  isHost: boolean;
  status: PlayerStatus;
  cumulativeScore: number;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED';
}

export interface PublicRoomDTO {
  code: string;
  status: GamePhase;
  hostPlayerId: string;
  settings: RoomSettings;
  players: PublicPlayerDTO[];
  createdAt: string;
}

export interface PrivateAssignmentDTO {
  role: TeamRole;
  word: string;
}

export interface VoteProgressDTO {
  votedCount: number;
  totalEligible: number;
}

export interface VoteResultEntry {
  targetPlayerId: string;
  displayName: string;
  voteCount: number;
}

export interface VoteResultsDTO {
  roundNumber: number;
  voteCounts: VoteResultEntry[];
  eliminatedPlayer: {
    id: string;
    displayName: string;
    revealedRole: TeamRole;
  } | null;
  isTie: boolean;
}

export interface PublicGameDTO {
  id: string;
  roomId: string;
  gameNumber: number;
  phase: GamePhase;
  roundNumber: number;
  speakingOrder: string[]; // player IDs
  currentSpeakerIndex: number;
  currentSpeakerId: string | null;
  spokenPlayerIds: string[];
  activePlayerIds: string[];
  voteProgress?: VoteProgressDTO;
  lastVoteResults?: VoteResultsDTO;
  winnerTeam?: TeamRole | null;
  version: number;
}

export interface LeaderboardEntryDTO {
  playerId: string;
  displayName: string;
  isHost: boolean;
  cumulativeScore: number;
  status: PlayerStatus;
}
