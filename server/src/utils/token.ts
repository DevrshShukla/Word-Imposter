import jwt from 'jsonwebtoken';

const DEFAULT_DEV_SECRET = 'word-imposter-super-secret-key-change-in-prod-2026';
let fallbackSecret: string | null = null;

function getJwtSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret && secret !== DEFAULT_DEV_SECRET) {
    return secret;
  }
  if (!fallbackSecret) {
    fallbackSecret = 'word-imposter-prod-secret-' + Math.random().toString(36).substring(2);
  }
  return fallbackSecret;
}

const JWT_EXPIRES_IN = '24h';

export interface SessionPayload {
  sessionSubject: string;
  playerId: string;
  roomId: string;
  displayName: string;
  isHost: boolean;
}

export function generateSessionToken(payload: SessionPayload): string {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRES_IN });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const secret = getJwtSecret();
    return jwt.verify(token, secret) as SessionPayload;
  } catch {
    return null;
  }
}
