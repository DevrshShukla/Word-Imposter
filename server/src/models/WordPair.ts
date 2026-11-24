import mongoose, { Schema, Document } from 'mongoose';
import { Difficulty, RelationshipType, WordLanguage } from '../types/game.types.js';

export interface IWordPairDocument extends Document {
  id: string;
  word1: string;
  word2: string;
  category: string;
  difficulty: Difficulty;
  relationshipType: RelationshipType;
  relatedness: number;
  hint: string;
  isActive: boolean;
  tags: string[];
  wordLanguage: WordLanguage;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

const WordPairSchema = new Schema<IWordPairDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    word1: { type: String, required: true },
    word2: { type: String, required: true },
    category: { type: String, required: true, index: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true, index: true },
    relationshipType: {
      type: String,
      enum: ['similar', 'contextual', 'indirect', 'contrast'],
      required: true,
    },
    relatedness: { type: Number, required: true, min: 0, max: 1 },
    hint: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    tags: [{ type: String }],
    wordLanguage: { type: String, enum: ['en', 'hi-Latn', 'mixed'], required: true, index: true },
    language: { type: String, default: 'en' },
  },
  { timestamps: true }
);

export const WordPairModel = mongoose.model<IWordPairDocument>('WordPair', WordPairSchema);
