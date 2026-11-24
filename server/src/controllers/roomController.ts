import { Request, Response } from 'express';
import { RoomService } from '../services/roomService.js';
import { verifySessionToken } from '../utils/token.js';

export class RoomController {
  public static async createRoom(req: Request, res: Response): Promise<void> {
    try {
      const { displayName } = req.body;
      if (!displayName || typeof displayName !== 'string') {
        res.status(400).json({ error: { code: 'INVALID_NAME', message: 'Valid display name is required' } });
        return;
      }

      const result = await RoomService.createRoom(displayName);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: { code: 'CREATE_ROOM_FAILED', message: err.message } });
    }
  }

  public static async joinRoom(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      const { displayName } = req.body;

      if (!displayName || typeof displayName !== 'string') {
        res.status(400).json({ error: { code: 'INVALID_NAME', message: 'Valid display name is required' } });
        return;
      }

      const authHeader = req.headers.authorization;
      let existingSubject: string | undefined;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const payload = verifySessionToken(authHeader.substring(7));
        if (payload) {
          existingSubject = payload.sessionSubject;
        }
      }

      const result = await RoomService.joinRoom(code, displayName, existingSubject);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: { code: 'JOIN_ROOM_FAILED', message: err.message } });
    }
  }

  public static async getRoom(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      const result = await RoomService.getPublicRoomSnapshot(code);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(404).json({ error: { code: 'ROOM_NOT_FOUND', message: err.message } });
    }
  }

  public static async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      const { settings } = req.body;
      const auth = (req as any).session;
      if (!auth || !auth.isHost) {
        res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only host can update settings' } });
        return;
      }

      const room = await RoomService.updateSettings(auth.roomId, auth.playerId, settings);
      res.status(200).json({ room });
    } catch (err: any) {
      res.status(400).json({ error: { code: 'UPDATE_SETTINGS_FAILED', message: err.message } });
    }
  }

  public static async renamePlayer(req: Request, res: Response): Promise<void> {
    try {
      const { displayName } = req.body;
      const auth = (req as any).session;
      if (!auth) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
        return;
      }

      const player = await RoomService.renamePlayer(auth.roomId, auth.playerId, displayName);
      res.status(200).json({ player });
    } catch (err: any) {
      res.status(400).json({ error: { code: 'RENAME_FAILED', message: err.message } });
    }
  }

  public static async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const auth = (req as any).session;
      if (!auth) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
        return;
      }

      const leaderboard = await RoomService.getLeaderboard(auth.roomId);
      res.status(200).json({ leaderboard });
    } catch (err: any) {
      res.status(400).json({ error: { code: 'LEADERBOARD_FAILED', message: err.message } });
    }
  }
}
