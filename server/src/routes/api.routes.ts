import { Router, Request, Response, NextFunction } from 'express';
import { RoomController } from '../controllers/roomController.js';
import { GameController } from '../controllers/gameController.js';
import { verifySessionToken } from '../utils/token.js';
import {
  validate,
  createRoomSchema,
  joinRoomSchema,
  roomCodeParamSchema,
  updateSettingsSchema,
  renamePlayerSchema,
  gameParamsSchema,
} from '../middleware/validate.js';

export const apiRouter = Router();

// Authentication middleware
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    return;
  }

  const token = authHeader.substring(7);
  const payload = verifySessionToken(token);
  if (!payload) {
    res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired session token' } });
    return;
  }

  (req as any).session = payload;
  next();
}

// Room endpoints
apiRouter.post('/rooms', validate(createRoomSchema), RoomController.createRoom);
apiRouter.post('/rooms/:code/join', validate(joinRoomSchema), RoomController.joinRoom);
apiRouter.get('/rooms/:code', validate(roomCodeParamSchema), RoomController.getRoom);
apiRouter.patch('/rooms/:code/player', authenticate, validate(renamePlayerSchema), RoomController.renamePlayer);
apiRouter.patch('/rooms/:code/settings', authenticate, validate(updateSettingsSchema), RoomController.updateSettings);
apiRouter.get('/rooms/:code/leaderboard', authenticate, validate(roomCodeParamSchema), RoomController.getLeaderboard);

// Game endpoints
apiRouter.post('/rooms/:code/games', authenticate, validate(roomCodeParamSchema), GameController.startGame);
apiRouter.get('/rooms/:code/games/:gameId', authenticate, validate(gameParamsSchema), GameController.getCurrentGame);
apiRouter.get('/rooms/:code/games/:gameId/role', authenticate, validate(gameParamsSchema), GameController.getMyRole);
