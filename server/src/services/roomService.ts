import crypto from 'crypto';
import { RoomModel, IRoom } from '../models/Room.js';
import { PlayerModel, IPlayer } from '../models/Player.js';
import { PublicPlayerDTO, PublicRoomDTO, RoomSettings } from '../types/game.types.js';
import { generateSessionToken } from '../utils/token.js';

export class RoomService {
  /**
   * Generates a 6-character uppercase alphanumeric code
   */
  public static generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous 0, O, 1, I
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[crypto.randomInt(0, chars.length)];
    }
    return code;
  }

  public static normalizeName(name: string): string {
    return name.trim().toLowerCase();
  }

  /**
   * Create a new room with Host seat
   */
  public static async createRoom(displayName: string): Promise<{
    room: PublicRoomDTO;
    player: PublicPlayerDTO;
    token: string;
  }> {
    const trimmedName = displayName.trim();
    if (!trimmedName || trimmedName.length > 30) {
      throw new Error('Display name must be between 1 and 30 characters');
    }

    let code = this.generateRoomCode();
    // Ensure collision-free code
    while (await RoomModel.findOne({ code })) {
      code = this.generateRoomCode();
    }

    const hostSessionSubject = crypto.randomUUID();
    const tempHostId = crypto.randomUUID();

    const room = await RoomModel.create({
      code,
      hostPlayerId: tempHostId,
      status: 'LOBBY',
      settings: {
        imposterCount: 1,
        difficulty: 'Any',
        category: 'Any',
        wordLanguage: 'Any',
      },
    });

    const hostPlayer = await PlayerModel.create({
      roomId: room._id.toString(),
      sessionSubject: hostSessionSubject,
      displayName: trimmedName,
      normalizedName: this.normalizeName(trimmedName),
      isHost: true,
      status: 'ACTIVE',
      connectionStatus: 'CONNECTED',
      cumulativeScore: 0,
    });

    // Update room with real hostPlayerId
    room.hostPlayerId = hostPlayer._id.toString();
    await room.save();

    const token = generateSessionToken({
      sessionSubject: hostSessionSubject,
      playerId: hostPlayer._id.toString(),
      roomId: room._id.toString(),
      displayName: hostPlayer.displayName,
      isHost: true,
    });

    const publicRoom = await this.getPublicRoomSnapshot(room._id.toString());
    const publicPlayer: PublicPlayerDTO = {
      id: hostPlayer._id.toString(),
      displayName: hostPlayer.displayName,
      isHost: true,
      status: hostPlayer.status,
      cumulativeScore: hostPlayer.cumulativeScore,
      connectionStatus: hostPlayer.connectionStatus,
    };

    return { room: publicRoom, player: publicPlayer, token };
  }

  /**
   * Join an existing room
   */
  public static async joinRoom(
    roomCode: string,
    displayName: string,
    existingSessionSubject?: string
  ): Promise<{
    room: PublicRoomDTO;
    player: PublicPlayerDTO;
    token: string;
  }> {
    const cleanCode = roomCode.trim().toUpperCase();
    const room = await RoomModel.findOne({ code: cleanCode });
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.status === 'CLOSED') {
      throw new Error('Room is closed');
    }

    const normalized = this.normalizeName(displayName);

    // If sessionSubject provided, check if reclaiming existing seat
    if (existingSessionSubject) {
      const existingPlayer = await PlayerModel.findOne({
        roomId: room._id.toString(),
        sessionSubject: existingSessionSubject,
      });

      if (existingPlayer) {
        existingPlayer.connectionStatus = 'CONNECTED';
        existingPlayer.lastSeenAt = new Date();
        await existingPlayer.save();

        const token = generateSessionToken({
          sessionSubject: existingPlayer.sessionSubject,
          playerId: existingPlayer._id.toString(),
          roomId: room._id.toString(),
          displayName: existingPlayer.displayName,
          isHost: existingPlayer.isHost,
        });

        const publicRoom = await this.getPublicRoomSnapshot(room._id.toString());
        return {
          room: publicRoom,
          player: {
            id: existingPlayer._id.toString(),
            displayName: existingPlayer.displayName,
            isHost: existingPlayer.isHost,
            status: existingPlayer.status,
            cumulativeScore: existingPlayer.cumulativeScore,
            connectionStatus: 'CONNECTED',
          },
          token,
        };
      }
    }

    // Check duplicate name in room
    const nameConflict = await PlayerModel.findOne({
      roomId: room._id.toString(),
      normalizedName: normalized,
    });

    if (nameConflict) {
      throw new Error('A player with this name already exists in this room');
    }

    const sessionSubject = crypto.randomUUID();
    const newPlayer = await PlayerModel.create({
      roomId: room._id.toString(),
      sessionSubject,
      displayName: displayName.trim(),
      normalizedName: normalized,
      isHost: false,
      status: 'ACTIVE',
      connectionStatus: 'CONNECTED',
      cumulativeScore: 0,
    });

    const token = generateSessionToken({
      sessionSubject,
      playerId: newPlayer._id.toString(),
      roomId: room._id.toString(),
      displayName: newPlayer.displayName,
      isHost: false,
    });

    const publicRoom = await this.getPublicRoomSnapshot(room._id.toString());
    return {
      room: publicRoom,
      player: {
        id: newPlayer._id.toString(),
        displayName: newPlayer.displayName,
        isHost: false,
        status: newPlayer.status,
        cumulativeScore: newPlayer.cumulativeScore,
        connectionStatus: 'CONNECTED',
      },
      token,
    };
  }

  /**
   * Update Room Settings (Host only, Lobby only)
   */
  public static async updateSettings(
    roomId: string,
    hostPlayerId: string,
    settings: Partial<RoomSettings>
  ): Promise<PublicRoomDTO> {
    const room = await RoomModel.findById(roomId);
    if (!room) throw new Error('Room not found');

    if (room.hostPlayerId !== hostPlayerId) {
      throw new Error('Only the room Host can update settings');
    }

    if (room.status !== 'LOBBY' && room.status !== 'BETWEEN_GAMES') {
      throw new Error('Settings can only be changed in Lobby or Between Games');
    }

    if (settings.imposterCount !== undefined) {
      room.settings.imposterCount = Math.max(1, settings.imposterCount);
    }
    if (settings.difficulty !== undefined) {
      room.settings.difficulty = settings.difficulty;
    }
    if (settings.category !== undefined) {
      room.settings.category = settings.category;
    }
    if (settings.wordLanguage !== undefined) {
      room.settings.wordLanguage = settings.wordLanguage;
    }

    room.version += 1;
    await room.save();

    return this.getPublicRoomSnapshot(roomId);
  }

  /**
   * Rename Player (Lobby only)
   */
  public static async renamePlayer(
    roomId: string,
    playerId: string,
    newDisplayName: string
  ): Promise<PublicPlayerDTO> {
    const room = await RoomModel.findById(roomId);
    if (!room) throw new Error('Room not found');
    if (room.status !== 'LOBBY') throw new Error('Can only rename in Lobby');

    const trimmed = newDisplayName.trim();
    if (!trimmed || trimmed.length > 30) throw new Error('Name must be between 1 and 30 characters');
    const normalized = this.normalizeName(trimmed);

    const conflict = await PlayerModel.findOne({
      roomId,
      normalizedName: normalized,
      _id: { $ne: playerId },
    });
    if (conflict) throw new Error('This name is already taken in this room');

    const player = await PlayerModel.findById(playerId);
    if (!player) throw new Error('Player not found');

    player.displayName = trimmed;
    player.normalizedName = normalized;
    await player.save();

    return {
      id: player._id.toString(),
      displayName: player.displayName,
      isHost: player.isHost,
      status: player.status,
      cumulativeScore: player.cumulativeScore,
      connectionStatus: player.connectionStatus,
    };
  }

  /**
   * Safe public room snapshot (contains no private game secrets)
   */
  public static async getPublicRoomSnapshot(roomId: string): Promise<PublicRoomDTO> {
    const room = await RoomModel.findById(roomId);
    if (!room) throw new Error('Room not found');

    const players = await PlayerModel.find({ roomId }).sort({ joinedAt: 1 });

    const publicPlayers: PublicPlayerDTO[] = players.map((p) => ({
      id: p._id.toString(),
      displayName: p.displayName,
      isHost: p.isHost,
      status: p.status,
      cumulativeScore: p.cumulativeScore,
      connectionStatus: p.connectionStatus,
    }));

    return {
      code: room.code,
      status: room.status,
      hostPlayerId: room.hostPlayerId,
      settings: room.settings,
      players: publicPlayers,
      createdAt: room.createdAt.toISOString(),
    };
  }

  /**
   * Cumulative leaderboard
   */
  public static async getLeaderboard(roomId: string) {
    const players = await PlayerModel.find({ roomId }).sort({ cumulativeScore: -1, joinedAt: 1 });
    return players.map((p) => ({
      playerId: p._id.toString(),
      displayName: p.displayName,
      isHost: p.isHost,
      cumulativeScore: p.cumulativeScore,
      status: p.status,
    }));
  }
}
