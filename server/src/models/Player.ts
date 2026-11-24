import mongoose, { Schema, Document } from 'mongoose';
import { PlayerStatus } from '../types/game.types.js';

export interface IPlayer extends Document {
  roomId: string;
  sessionSubject: string; // Secret session ID
  displayName: string;
  normalizedName: string;
  isHost: boolean;
  status: PlayerStatus;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED';
  cumulativeScore: number;
  joinedAt: Date;
  lastSeenAt: Date;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    roomId: { type: String, required: true, index: true },
    sessionSubject: { type: String, required: true, index: true },
    displayName: { type: String, required: true, maxlength: 30 },
    normalizedName: { type: String, required: true },
    isHost: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['ACTIVE', 'ELIMINATED', 'DISCONNECTED'],
      default: 'ACTIVE',
    },
    connectionStatus: {
      type: String,
      enum: ['CONNECTED', 'DISCONNECTED'],
      default: 'CONNECTED',
    },
    cumulativeScore: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Ensure unique normalized display names per room
PlayerSchema.index({ roomId: 1, normalizedName: 1 }, { unique: true });

export const PlayerModel = mongoose.model<IPlayer>('Player', PlayerSchema);
