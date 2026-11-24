import mongoose, { Schema, Document } from 'mongoose';
import { GamePhase, TeamRole, RoomSettings } from '../types/game.types.js';

export interface IGameRoleAssignment {
  playerId: string;
  role: TeamRole;
  word: string;
}

export interface IGameVote {
  roundNumber: number;
  voterPlayerId: string;
  targetPlayerId: string;
  submittedAt: Date;
}

export interface IGame extends Document {
  roomId: string;
  gameNumber: number;
  phase: GamePhase;
  roundNumber: number;
  settingsSnapshot: RoomSettings;
  wordPairId: string;
  speakingOrder: string[];
  spokenPlayerIds: string[];
  activePlayerIds: string[];
  assignments: IGameRoleAssignment[]; // Private server-only
  votes: IGameVote[];
  winnerTeam?: TeamRole | null;
  scoreAwardedAt?: Date;
  version: number;
  startedAt: Date;
  completedAt?: Date;
}

const GameSchema = new Schema<IGame>(
  {
    roomId: { type: String, required: true, index: true },
    gameNumber: { type: Number, required: true },
    phase: {
      type: String,
      enum: [
        'LOBBY',
        'INITIALIZING',
        'ROLE_REVEAL',
        'SPEAKING',
        'DISCUSSION',
        'VOTING',
        'VOTE_RESULTS',
        'ELIMINATION',
        'COMPLETED',
        'BETWEEN_GAMES',
        'CLOSED',
      ],
      default: 'INITIALIZING',
    },
    roundNumber: { type: Number, default: 1 },
    settingsSnapshot: {
      imposterCount: { type: Number, required: true },
      difficulty: { type: String, required: true },
      category: { type: String, required: true },
      wordLanguage: { type: String, required: true },
    },
    wordPairId: { type: String, required: true },
    speakingOrder: [{ type: String }],
    spokenPlayerIds: [{ type: String }],
    activePlayerIds: [{ type: String }],
    assignments: [
      {
        playerId: { type: String, required: true },
        role: { type: String, enum: ['INNOCENT', 'IMPOSTER'], required: true },
        word: { type: String, required: true },
      },
    ],
    votes: [
      {
        roundNumber: { type: Number, required: true },
        voterPlayerId: { type: String, required: true },
        targetPlayerId: { type: String, required: true },
        submittedAt: { type: Date, default: Date.now },
      },
    ],
    winnerTeam: { type: String, enum: ['INNOCENT', 'IMPOSTER', null], default: null },
    scoreAwardedAt: { type: Date },
    version: { type: Number, default: 1 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

GameSchema.index({ roomId: 1, gameNumber: 1 }, { unique: true });

export const GameModel = mongoose.model<IGame>('Game', GameSchema);
