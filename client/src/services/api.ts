import { PublicRoomDTO, PublicPlayerDTO, PrivateAssignmentDTO, LeaderboardEntryDTO } from '../types/game.types';

const API_BASE = '/api/v1';

export class ApiService {
  private static getHeaders(token?: string | null): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  public static async createRoom(displayName: string): Promise<{
    room: PublicRoomDTO;
    player: PublicPlayerDTO;
    token: string;
  }> {
    const res = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ displayName }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to create room');
    }
    return data;
  }

  public static async joinRoom(
    roomCode: string,
    displayName: string,
    token?: string | null
  ): Promise<{
    room: PublicRoomDTO;
    player: PublicPlayerDTO;
    token: string;
  }> {
    const res = await fetch(`${API_BASE}/rooms/${roomCode}/join`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ displayName }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to join room');
    }
    return data;
  }

  public static async getRoom(roomCode: string): Promise<PublicRoomDTO> {
    const res = await fetch(`${API_BASE}/rooms/${roomCode}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to fetch room');
    }
    return data;
  }

  public static async getLeaderboard(roomCode: string, token: string): Promise<{ leaderboard: LeaderboardEntryDTO[] }> {
    const res = await fetch(`${API_BASE}/rooms/${roomCode}/leaderboard`, {
      headers: this.getHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to fetch leaderboard');
    }
    return data;
  }

  public static async getMyRole(roomCode: string, gameId: string, token: string): Promise<{ assignment: PrivateAssignmentDTO }> {
    const res = await fetch(`${API_BASE}/rooms/${roomCode}/games/${gameId}/role`, {
      headers: this.getHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to fetch role');
    }
    return data;
  }
}
