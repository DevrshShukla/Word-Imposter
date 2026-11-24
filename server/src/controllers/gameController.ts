import { Request, Response } from 'express';
import { GameService } from '../services/gameService.js';

export class GameController {
  public static async startGame(req: Request, res: Response): Promise<void> {
    try {
      const auth = (req as any).session;
      if (!auth || !auth.isHost) {
        res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only host can start the game' } });
        return;
      }

      const { game } = await GameService.startGame(auth.roomId, auth.playerId);
      res.status(200).json({ game });
    } catch (err: any) {
      res.status(400).json({ error: { code: 'START_GAME_FAILED', message: err.message } });
    }
  }

  public static async getCurrentGame(req: Request, res: Response): Promise<void> {
    try {
      const auth = (req as any).session;
      const { gameId } = req.params;
      if (!auth) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
        return;
      }

      const game = await GameService.getPublicGameSnapshot(gameId);
      res.status(200).json({ game });
    } catch (err: any) {
      res.status(404).json({ error: { code: 'GAME_NOT_FOUND', message: err.message } });
    }
  }

  public static async getMyRole(req: Request, res: Response): Promise<void> {
    try {
      const auth = (req as any).session;
      const { gameId } = req.params;
      if (!auth) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
        return;
      }

      const assignment = await GameService.getPrivateAssignment(gameId, auth.playerId);
      if (!assignment) {
        res.status(404).json({ error: { code: 'ASSIGNMENT_NOT_FOUND', message: 'No role assigned for this player' } });
        return;
      }

      res.status(200).json({ assignment });
    } catch (err: any) {
      res.status(400).json({ error: { code: 'FETCH_ROLE_FAILED', message: err.message } });
    }
  }
}
