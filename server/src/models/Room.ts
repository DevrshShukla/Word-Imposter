import mongoose, { Schema, Document } from 'mongoose';
import { GamePhase, RoomSettings } from '../types/game.types.js';

export interface IRoom extends Document {
  code: string;
  hostPlayerId: string;
  status: GamePhase;
  settings: RoomSettings;
  version: number;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, index: true },
    hostPlayerId: { type: String, required: true },
    status: {
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
      default: 'LOBBY',
    },
    settings: {
      imposterCount: { type: Number, default: 1 },
      difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Any'], default: 'Any' },
      category: { type: String, default: 'Any' },
      wordLanguage: { type: String, enum: ['en', 'hi-Latn', 'mixed', 'Any'], default: 'Any' },
    },
    version: { type: Number, default: 1 },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

export const RoomModel = mongoose.model<IRoom>('Room', RoomSchema);
