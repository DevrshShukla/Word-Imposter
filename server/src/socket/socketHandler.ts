import { Server, Socket } from 'socket.io';
import { verifySessionToken, SessionPayload } from '../utils/token.js';
import { RoomService } from '../services/roomService.js';
import { GameService } from '../services/gameService.js';
import { PlayerModel } from '../models/Player.js';
import { RoomModel } from '../models/Room.js';

interface AuthenticatedSocket extends Socket {
  session?: SessionPayload;
}

export function setupSocketHandlers(io: Server): void {
  // Authentication middleware for socket handshake
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const payload = verifySessionToken(token);
    if (!payload) {
      return next(new Error('Invalid or expired token'));
    }

    socket.session = payload;
    next();
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const session = socket.session;
    if (!session) {
      socket.disconnect();
      return;
    }

    const { roomId, playerId, displayName, isHost } = session;
    const roomChannel = `room:${roomId}`;
    const playerPrivateChannel = `player:${playerId}`;

    // Join room broadcast and private channels
    socket.join(roomChannel);
    socket.join(playerPrivateChannel);

    console.log(`Player connected: ${displayName} (${playerId}) in room ${roomId}`);

    // Update connection status in DB
    await PlayerModel.findByIdAndUpdate(playerId, {
      connectionStatus: 'CONNECTED',
      lastSeenAt: new Date(),
    });

    // Notify room of player reconnection/join
    io.to(roomChannel).emit('player:reconnected', { playerId, displayName, isHost });
    const freshRoom = await RoomService.getPublicRoomSnapshot(roomId);
    io.to(roomChannel).emit('room:updated', { room: freshRoom });

    // Handle room:join (for explicit client re-sync)
    socket.on('room:join', async (_, callback) => {
      try {
        const roomSnapshot = await RoomService.getPublicRoomSnapshot(roomId);
        if (callback) callback({ success: true, room: roomSnapshot });
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Handle settings update
    socket.on('game:settingsUpdate', async ({ settings }, callback) => {
      try {
        const updatedRoom = await RoomService.updateSettings(roomId, playerId, settings);
        io.to(roomChannel).emit('game:settingsUpdated', { settings: updatedRoom.settings });
        io.to(roomChannel).emit('room:updated', { room: updatedRoom });
        if (callback) callback({ success: true, settings: updatedRoom.settings });
      } catch (err: any) {
        socket.emit('error:occurred', { message: err.message });
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Handle player rename
    socket.on('player:rename', async ({ newDisplayName }, callback) => {
      try {
        const updatedPlayer = await RoomService.renamePlayer(roomId, playerId, newDisplayName);
        io.to(roomChannel).emit('player:renamed', { player: updatedPlayer });
        const updatedRoom = await RoomService.getPublicRoomSnapshot(roomId);
        io.to(roomChannel).emit('room:updated', { room: updatedRoom });
        if (callback) callback({ success: true, player: updatedPlayer });
      } catch (err: any) {
        socket.emit('error:occurred', { message: err.message });
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Handle game:start
    socket.on('game:start', async (_, callback) => {
      try {
        const { game, assignments } = await GameService.startGame(roomId, playerId);

        // Broadcast public game started to room
        io.to(roomChannel).emit('game:started', { game });

        // Deliver role privately to each player
        for (const [pId, assignment] of assignments.entries()) {
          io.to(`player:${pId}`).emit('role:assigned', {
            role: assignment.role,
            word: assignment.word,
          });
        }

        const updatedRoom = await RoomService.getPublicRoomSnapshot(roomId);
        io.to(roomChannel).emit('room:updated', { room: updatedRoom });

        if (callback) callback({ success: true, gameId: game.id });
      } catch (err: any) {
        socket.emit('error:occurred', { message: err.message });
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Handle transition from reveal to speaking
    socket.on('game:proceedToSpeaking', async ({ gameId }, callback) => {
      try {
        const game = await GameService.proceedToSpeaking(gameId);
        io.to(roomChannel).emit('speaking:turnStarted', {
          currentSpeakerId: game.currentSpeakerId,
          game,
        });
        if (callback) callback({ success: true, game });
      } catch (err: any) {
        socket.emit('error:occurred', { message: err.message });
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Handle speaking:mark
    socket.on('speaking:mark', async ({ gameId }, callback) => {
      try {
        const updatedGame = await GameService.markSpoken(gameId, playerId);

        io.to(roomChannel).emit('speaking:marked', {
          playerId,
          spokenPlayerIds: updatedGame.spokenPlayerIds,
          currentSpeakerId: updatedGame.currentSpeakerId,
          game: updatedGame,
        });

        if (updatedGame.phase === 'DISCUSSION') {
          io.to(roomChannel).emit('discussion:started', { game: updatedGame });
        }

        if (callback) callback({ success: true, game: updatedGame });
      } catch (err: any) {
        socket.emit('error:occurred', { message: err.message });
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Handle voting:start
    socket.on('voting:start', async ({ gameId }, callback) => {
      try {
        const updatedGame = await GameService.startVoting(gameId, playerId);
        io.to(roomChannel).emit('voting:started', { game: updatedGame });
        if (callback) callback({ success: true, game: updatedGame });
      } catch (err: any) {
        socket.emit('error:occurred', { message: err.message });
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Handle voting:submit
    socket.on('voting:submit', async ({ gameId, targetPlayerId }, callback) => {
      try {
        const { game, isComplete, results } = await GameService.submitVote(gameId, playerId, targetPlayerId);

        // Broadcast progress safely WITHOUT disclosing target
        io.to(roomChannel).emit('vote:submitted', {
          voteProgress: game.voteProgress,
          game,
        });

        if (isComplete && results) {
          // Voting completed! Reveal aggregate results
          io.to(roomChannel).emit('voting:results', { results, game });

          if (results.eliminatedPlayer) {
            io.to(roomChannel).emit('player:eliminated', {
              player: results.eliminatedPlayer,
              game,
            });
          }

          if (game.phase === 'COMPLETED') {
            io.to(roomChannel).emit('game:ended', {
              winnerTeam: game.winnerTeam,
              game,
            });

            // Update leaderboard
            const leaderboard = await RoomService.getLeaderboard(roomId);
            io.to(roomChannel).emit('leaderboard:updated', { leaderboard });
          }

          const freshRoom = await RoomService.getPublicRoomSnapshot(roomId);
          io.to(roomChannel).emit('room:updated', { room: freshRoom });
        }

        if (callback) callback({ success: true });
      } catch (err: any) {
        socket.emit('error:occurred', { message: err.message });
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Handle next round (after vote results if no winner)
    socket.on('game:nextRound', async ({ gameId }, callback) => {
      try {
        const game = await GameService.nextRound(gameId);
        io.to(roomChannel).emit('speaking:turnStarted', {
          currentSpeakerId: game.currentSpeakerId,
          game,
        });
        if (callback) callback({ success: true, game });
      } catch (err: any) {
        socket.emit('error:occurred', { message: err.message });
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Handle rematch
    socket.on('game:rematch', async (_, callback) => {
      try {
        const { game, assignments } = await GameService.rematch(roomId, playerId);

        io.to(roomChannel).emit('game:rematch', { game });
        io.to(roomChannel).emit('game:started', { game });

        // Deliver roles privately
        for (const [pId, assignment] of assignments.entries()) {
          io.to(`player:${pId}`).emit('role:assigned', {
            role: assignment.role,
            word: assignment.word,
          });
        }

        const updatedRoom = await RoomService.getPublicRoomSnapshot(roomId);
        io.to(roomChannel).emit('room:updated', { room: updatedRoom });

        if (callback) callback({ success: true, gameId: game.id });
      } catch (err: any) {
        socket.emit('error:occurred', { message: err.message });
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`Player disconnected: ${displayName} (${playerId})`);
      await PlayerModel.findByIdAndUpdate(playerId, {
        connectionStatus: 'DISCONNECTED',
        lastSeenAt: new Date(),
      });
      io.to(roomChannel).emit('player:left', { playerId, displayName });
      const updatedRoom = await RoomService.getPublicRoomSnapshot(roomId);
      io.to(roomChannel).emit('room:updated', { room: updatedRoom });
    });
  });
}
