import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../stores/gameStore';
import { sound } from '../utils/audio';

function getSocketUrl(): string | undefined {
  const raw = import.meta.env.VITE_SOCKET_URL?.trim();
  if (raw && raw !== '') {
    // Strip trailing /api/v1 or trailing slashes because Socket.IO connects to the server root
    return raw.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
  }
  return undefined;
}

class SocketService {
  private socket: Socket | null = null;

  public connect(token: string): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    const socketUrl = getSocketUrl();
    const socketOptions = {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
    };

    this.socket = socketUrl ? io(socketUrl, socketOptions) : io(socketOptions);

    this.setupListeners();
    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    this.socket.on('room:updated', ({ room }) => {
      useGameStore.getState().setRoom(room);
      const myId = useGameStore.getState().myPlayer?.id;
      if (myId && room.players) {
        const found = room.players.find((p: any) => p.id === myId);
        if (found) {
          useGameStore.getState().setMyPlayer(found);
        }
      }
    });

    this.socket.on('player:joined', () => {
      sound.playJoin();
    });

    this.socket.on('game:started', ({ game }) => {
      useGameStore.getState().setGame(game);
      const cur = useGameStore.getState().myPlayer;
      if (cur) {
        useGameStore.getState().setMyPlayer({ ...cur, status: 'ACTIVE' });
      }
      sound.playTurnStart();
    });

    this.socket.on('role:assigned', ({ role, word }) => {
      useGameStore.getState().setMyAssignment({ role, word });
      sound.playCardFlip();
    });

    this.socket.on('speaking:turnStarted', ({ currentSpeakerId, game }) => {
      useGameStore.getState().setGame(game);
      const myId = useGameStore.getState().myPlayer?.id;
      if (myId === currentSpeakerId) {
        sound.playTurnStart();
      }
    });

    this.socket.on('speaking:marked', ({ game }) => {
      useGameStore.getState().setGame(game);
    });

    this.socket.on('discussion:started', ({ game }) => {
      useGameStore.getState().setGame(game);
      sound.playTurnStart();
    });

    this.socket.on('voting:started', ({ game }) => {
      useGameStore.getState().setGame(game);
      sound.playTurnStart();
    });

    this.socket.on('vote:submitted', ({ game }) => {
      useGameStore.getState().setGame(game);
    });

    this.socket.on('player:eliminated', ({ player, game }) => {
      useGameStore.getState().setGame(game);
      const myId = useGameStore.getState().myPlayer?.id;
      if (myId === player.id) {
        const cur = useGameStore.getState().myPlayer;
        if (cur) {
          useGameStore.getState().setMyPlayer({ ...cur, status: 'ELIMINATED' });
        }
      }
    });

    this.socket.on('voting:results', ({ results, game }) => {
      useGameStore.getState().setGame(game);
      if (results.eliminatedPlayer) {
        sound.playElimination();
        const myId = useGameStore.getState().myPlayer?.id;
        if (myId === results.eliminatedPlayer.id) {
          const cur = useGameStore.getState().myPlayer;
          if (cur) {
            useGameStore.getState().setMyPlayer({ ...cur, status: 'ELIMINATED' });
          }
        }
      }
    });

    this.socket.on('game:ended', ({ game }) => {
      useGameStore.getState().setGame(game);
      sound.playVictory();
    });

    this.socket.on('leaderboard:updated', ({ leaderboard }) => {
      useGameStore.getState().setLeaderboard(leaderboard);
    });

    this.socket.on('game:rematch', ({ game }) => {
      useGameStore.getState().setGame(game);
      useGameStore.getState().setMyAssignment(null);
      const cur = useGameStore.getState().myPlayer;
      if (cur) {
        useGameStore.getState().setMyPlayer({ ...cur, status: 'ACTIVE' });
      }
    });
  }

  public startGame(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.socket?.emit('game:start', {}, (res: any) => {
        if (res?.error) reject(new Error(res.error));
        else resolve(res);
      });
    });
  }

  public proceedToSpeaking(gameId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.socket?.emit('game:proceedToSpeaking', { gameId }, (res: any) => {
        if (res?.error) reject(new Error(res.error));
        else resolve(res);
      });
    });
  }

  public markSpoken(gameId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.socket?.emit('speaking:mark', { gameId }, (res: any) => {
        if (res?.error) reject(new Error(res.error));
        else resolve(res);
      });
    });
  }

  public startVoting(gameId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.socket?.emit('voting:start', { gameId }, (res: any) => {
        if (res?.error) reject(new Error(res.error));
        else resolve(res);
      });
    });
  }

  public submitVote(gameId: string, targetPlayerId: string): Promise<any> {
    sound.playVoteSubmitted();
    return new Promise((resolve, reject) => {
      this.socket?.emit('voting:submit', { gameId, targetPlayerId }, (res: any) => {
        if (res?.error) reject(new Error(res.error));
        else resolve(res);
      });
    });
  }

  public nextRound(gameId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.socket?.emit('game:nextRound', { gameId }, (res: any) => {
        if (res?.error) reject(new Error(res.error));
        else resolve(res);
      });
    });
  }

  public rematch(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.socket?.emit('game:rematch', {}, (res: any) => {
        if (res?.error) reject(new Error(res.error));
        else resolve(res);
      });
    });
  }

  public updateSettings(settings: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.socket?.emit('game:settingsUpdate', { settings }, (res: any) => {
        if (res?.error) reject(new Error(res.error));
        else resolve(res);
      });
    });
  }
}

export const socketService = new SocketService();
