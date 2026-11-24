import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.SESSION_SECRET || 'word-imposter-super-secret-key-change-in-prod-2026';
const JWT_EXPIRES_IN = '24h';

export interface SessionPayload {
  sessionSubject: string;
  playerId: string;
  roomId: string;
  displayName: string;
  isHost: boolean;
}

export function generateSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}
