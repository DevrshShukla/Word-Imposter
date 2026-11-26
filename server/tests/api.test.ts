import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { apiRouter } from '../src/routes/api.routes.js';
import { connectDatabase, disconnectDatabase } from '../src/utils/database.js';
import { RoomModel } from '../src/models/Room.js';
import { PlayerModel } from '../src/models/Player.js';
import { GameService } from '../src/services/gameService.js';
import { WordPairModel } from '../src/models/WordPair.js';

const app = express();
app.use(express.json());
app.use('/api/v1', apiRouter);

describe('REST API & Room/Game Integration Tests', () => {
  beforeAll(async () => {
    await connectDatabase();
    // Seed at least one word pair for tests
    await WordPairModel.findOneAndUpdate(
      { id: 'WP-TEST-001' },
      {
        id: 'WP-TEST-001',
        word1: 'Samosa',
        word2: 'Kachori',
        category: 'Food',
        difficulty: 'Easy',
        relationshipType: 'similar',
        relatedness: 0.95,
        hint: 'Fried snacks',
        isActive: true,
        tags: ['food', 'india'],
        wordLanguage: 'en',
        language: 'en',
      },
      { upsert: true }
    );
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('Room Lifecycle (TC-001, TC-002, TC-003)', () => {
    let hostToken = '';
    let roomCode = '';
    let roomId = '';

    it('creates a room with Host seat (TC-001)', async () => {
      const res = await request(app)
        .post('/api/v1/rooms')
        .send({ displayName: 'Aarav' });

      expect(res.status).toBe(201);
      expect(res.body.room.code).toBeDefined();
      expect(res.body.player.displayName).toBe('Aarav');
      expect(res.body.player.isHost).toBe(true);
      expect(res.body.token).toBeDefined();

      hostToken = res.body.token;
      roomCode = res.body.room.code;

      const roomInDb = await RoomModel.findOne({ code: roomCode });
      expect(roomInDb).toBeDefined();
      roomId = roomInDb!._id.toString();
    });

    it('rejects duplicate normalized display name in same room (TC-003)', async () => {
      const res = await request(app)
        .post(`/api/v1/rooms/${roomCode}/join`)
        .send({ displayName: '  aarav  ' }); // lowercase & whitespace test

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('already exists');
    });

    it('allows unique player to join (TC-002)', async () => {
      const res = await request(app)
        .post(`/api/v1/rooms/${roomCode}/join`)
        .send({ displayName: 'Priya' });

      expect(res.status).toBe(200);
      expect(res.body.player.displayName).toBe('Priya');
      expect(res.body.player.isHost).toBe(false);
      expect(res.body.room.players.length).toBe(2);
    });

    it('rejects joining invalid room code', async () => {
      const res = await request(app)
        .post('/api/v1/rooms/INVALID99/join')
        .send({ displayName: 'Rohan' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Room not found');
    });

    it('prevents game start when fewer than 3 players (TC-004)', async () => {
      const res = await request(app)
        .post(`/api/v1/rooms/${roomCode}/games`)
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('At least 3 players');
    });

    it('starts game successfully once 3 players are connected (TC-005, TC-007, TC-008)', async () => {
      // Add 3rd player
      await request(app)
        .post(`/api/v1/rooms/${roomCode}/join`)
        .send({ displayName: 'Rohan' });

      const res = await request(app)
        .post(`/api/v1/rooms/${roomCode}/games`)
        .set('Authorization', `Bearer ${hostToken}`);

      expect(res.status).toBe(200);
      expect(res.body.game.phase).toBe('ROLE_REVEAL');
      expect(res.body.game.speakingOrder.length).toBe(3);

      const gameId = res.body.game.id;

      // Check host's private assignment
      const roleRes = await request(app)
        .get(`/api/v1/rooms/${roomCode}/games/${gameId}/role`)
        .set('Authorization', `Bearer ${hostToken}`);

      expect(roleRes.status).toBe(200);
      expect(roleRes.body.assignment.role).toBeDefined();
      expect(roleRes.body.assignment.word).toBeDefined();
    });
  });
});
