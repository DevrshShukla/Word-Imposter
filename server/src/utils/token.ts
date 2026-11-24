import jwt from 'jsonwebtoken';

const DEFAULT_DEV_SECRET = 'word-imposter-super-secret-key-change-in-prod-2026';

function getJwtSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.trim() === '' || secret === DEFAULT_DEV_SECRET) {
      throw new Error(
        'FATAL: A secure SESSION_SECRET environment variable is mandatory in production mode. ' +
        'Using the default development secret in production is prohibited.'
      );
    }
    return secret.trim();
  }
  return secret?.trim() || DEFAULT_DEV_SECRET;
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
