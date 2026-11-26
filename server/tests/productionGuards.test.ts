import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';
import { connectDatabase, disconnectDatabase } from '../src/utils/database.js';
import { RoomService } from '../src/services/roomService.js';
import { GameService } from '../src/services/gameService.js';
import { WordPairModel } from '../src/models/WordPair.js';

describe('Production Readiness & Security Guards', () => {
  beforeAll(async () => {
    await connectDatabase();

    // Ensure at least one test word pair exists
    await WordPairModel.findOneAndUpdate(
      { id: 'test-pair-guard' },
      {
        id: 'test-pair-guard',
        word1: 'Coffee',
        word2: 'Tea',
        category: 'Beverage',
        difficulty: 'Easy',
        relationshipType: 'similar',
        relatedness: 0.85,
        hint: 'Morning drinks',
        isActive: true,
        tags: ['drink', 'hot'],
        wordLanguage: 'en',
        language: 'en',
      },
      { upsert: true }
    );
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('1. Health Check Endpoint', () => {
    it('returns 200 with database: connected and uptime', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.database).toBe('connected');
      expect(typeof res.body.uptime).toBe('number');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('2. Zod Request Validation & Security', () => {
    it('rejects room creation with empty display name', async () => {
      const res = await request(app)
        .post('/api/v1/rooms')
        .send({ displayName: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects room creation with excessively long display name (>30 chars)', async () => {
      const res = await request(app)
        .post('/api/v1/rooms')
        .send({ displayName: 'A'.repeat(35) });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects joining with invalid room code format', async () => {
      const res = await request(app)
        .post('/api/v1/rooms/BAD!/join')
        .send({ displayName: 'ValidPlayer' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects unauthorized requests to protected endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/rooms/ABCDEF/leaderboard');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('3. Room Resolution & Dual Code/ID Lookup', () => {
    it('resolves room snapshot by 6-character room code', async () => {
      const created = await RoomService.createRoom('HostPlayer');
      expect(created.room.code).toHaveLength(6);

      const snapshotByCode = await RoomService.getPublicRoomSnapshot(created.room.code);
      expect(snapshotByCode.code).toBe(created.room.code);
      expect(snapshotByCode.players.length).toBe(1);

      const leaderboard = await RoomService.getLeaderboard(created.room.code);
      expect(leaderboard.length).toBe(1);
      expect(leaderboard[0].displayName).toBe('HostPlayer');
    });
  });

  describe('4. Eliminated Player Security Guards', () => {
    it('strictly forbids eliminated players from speaking or voting', async () => {
      // Create a 3-player room
      const hostRes = await RoomService.createRoom('HostGuard');
      const roomCode = hostRes.room.code;
      const p2 = await RoomService.joinRoom(roomCode, 'PlayerTwo');
      const p3 = await RoomService.joinRoom(roomCode, 'PlayerThree');

      // Start game
      const { game } = await GameService.startGame(roomCode, hostRes.player.id);
      expect(game.phase).toBe('ROLE_REVEAL');

      // Proceed to speaking
      const speakingGame = await GameService.proceedToSpeaking(game.id);
      expect(speakingGame.phase).toBe('SPEAKING');

      // Simulate an eliminated player id not in activePlayerIds
      const dummyEliminatedId = 'dummy-eliminated-id';
      await expect(
        GameService.markSpoken(game.id, dummyEliminatedId)
      ).rejects.toThrow(/Eliminated players cannot speak/);

      // Start voting
      // Have all players speak first
      for (const pId of speakingGame.activePlayerIds) {
        await GameService.markSpoken(game.id, pId);
      }

      await GameService.startVoting(game.id, hostRes.player.id);

      // Test eliminated player voting
      await expect(
        GameService.submitVote(game.id, dummyEliminatedId, p2.player.id)
      ).rejects.toThrow(/Eliminated players cannot vote/);
    }, 25000);
  });
});
