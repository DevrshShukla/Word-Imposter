import { Router, Request, Response, NextFunction } from 'express';
import { RoomController } from '../controllers/roomController.js';
import { GameController } from '../controllers/gameController.js';
import { verifySessionToken } from '../utils/token.js';

export const apiRouter = Router();

// Authentication middleware
function authenticate(req: Request, res: Response, next: NextFunction): void {
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
apiRouter.post('/rooms', RoomController.createRoom);
apiRouter.post('/rooms/:code/join', RoomController.joinRoom);
apiRouter.get('/rooms/:code', RoomController.getRoom);
apiRouter.patch('/rooms/:code/player', authenticate, RoomController.renamePlayer);
apiRouter.patch('/rooms/:code/settings', authenticate, RoomController.updateSettings);
apiRouter.get('/rooms/:code/leaderboard', authenticate, RoomController.getLeaderboard);

// Game endpoints
apiRouter.post('/rooms/:code/games', authenticate, GameController.startGame);
apiRouter.get('/rooms/:code/games/:gameId', authenticate, GameController.getCurrentGame);
apiRouter.get('/rooms/:code/games/:gameId/role', authenticate, GameController.getMyRole);
