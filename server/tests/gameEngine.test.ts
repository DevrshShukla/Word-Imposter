import { describe, it, expect } from 'vitest';
import { GameEngine, VoteRecord } from '../src/engine/gameEngine.js';

describe('GameEngine - Unit Tests', () => {
  describe('Imposter Count & Roster Validation (TC-004, TC-005, TC-006)', () => {
    it('calculates correct default imposter counts', () => {
      expect(GameEngine.calculateDefaultImposters(3)).toBe(1);
      expect(GameEngine.calculateDefaultImposters(4)).toBe(1);
      expect(GameEngine.calculateDefaultImposters(5)).toBe(1);
      expect(GameEngine.calculateDefaultImposters(6)).toBe(2);
      expect(GameEngine.calculateDefaultImposters(7)).toBe(2);
      expect(GameEngine.calculateDefaultImposters(8)).toBe(2);
      expect(GameEngine.calculateDefaultImposters(9)).toBe(3);
      expect(GameEngine.calculateDefaultImposters(12)).toBe(3);
    });

    it('rejects player count less than 3 (TC-004)', () => {
      expect(() => GameEngine.calculateDefaultImposters(2)).toThrow();
      const val = GameEngine.validateRoster(2, 1);
      expect(val.valid).toBe(false);
      expect(val.error).toContain('At least 3 players');
    });

    it('rejects imposter count that leaves no innocent (TC-006)', () => {
      const val = GameEngine.validateRoster(3, 3);
      expect(val.valid).toBe(false);
      expect(val.error).toContain('At least one innocent');

      const val2 = GameEngine.validateRoster(4, 5);
      expect(val2.valid).toBe(false);
    });
  });

  describe('Role & Word Assignment (TC-007, TC-008)', () => {
    const players = ['p1', 'p2', 'p3', 'p4', 'p5'];
    const wordPair = { word1: 'Pizza', word2: 'Burger' };

    it('assigns exactly configured imposter count with word2 and innocents with word1', () => {
      const { assignments, imposterIds, innocentIds } = GameEngine.assignRoles(players, 2, wordPair);

      expect(imposterIds.length).toBe(2);
      expect(innocentIds.length).toBe(3);
      expect(assignments.size).toBe(5);

      for (const impId of imposterIds) {
        const asg = assignments.get(impId);
        expect(asg?.role).toBe('IMPOSTER');
        expect(asg?.word).toBe('Burger');
      }

      for (const innId of innocentIds) {
        const asg = assignments.get(innId);
        expect(asg?.role).toBe('INNOCENT');
        expect(asg?.word).toBe('Pizza');
      }
    });

    it('rotates imposter role away from previous imposter randomly across games', () => {
      // p1 was the imposter in the previous game
      for (let i = 0; i < 20; i++) {
        const { imposterIds } = GameEngine.assignRoles(players, 1, wordPair, ['p1']);
        expect(imposterIds.length).toBe(1);
        // p1 must NOT be the imposter!
        expect(imposterIds[0]).not.toBe('p1');
        expect(['p2', 'p3', 'p4', 'p5']).toContain(imposterIds[0]);
      }
    });
  });

  describe('Speaking Order (TC-009, TC-010)', () => {
    const players = ['p1', 'p2', 'p3', 'p4'];

    it('generates an order containing all players exactly once', () => {
      const order = GameEngine.generateSpeakingOrder(players);
      expect(order.length).toBe(4);
      for (const p of players) {
        expect(order).toContain(p);
      }
    });

    it('tracks spoken turn completion accurately', () => {
      const order = ['p1', 'p2', 'p3'];
      expect(GameEngine.getCurrentSpeaker(order, [], order)).toBe('p1');
      expect(GameEngine.getCurrentSpeaker(order, ['p1'], order)).toBe('p2');
      expect(GameEngine.getCurrentSpeaker(order, ['p1', 'p2'], order)).toBe('p3');
      expect(GameEngine.getCurrentSpeaker(order, ['p1', 'p2', 'p3'], order)).toBe(null);

      expect(GameEngine.haveAllActiveSpoken(order, ['p1', 'p2'], order)).toBe(false);
      expect(GameEngine.haveAllActiveSpoken(order, ['p1', 'p2', 'p3'], order)).toBe(true);
    });

    it('skips eliminated players when finding next speaker', () => {
      const order = ['p1', 'p2', 'p3', 'p4'];
      const active = ['p1', 'p3', 'p4']; // p2 is eliminated
      expect(GameEngine.getCurrentSpeaker(order, ['p1'], active)).toBe('p3');
    });
  });

  describe('Voting & Elimination (TC-013, TC-014, TC-016, TC-017)', () => {
    const activePlayers = ['p1', 'p2', 'p3', 'p4'];
    const votes = new Map<string, VoteRecord>();

    it('prohibits self-voting (TC-013)', () => {
      const val = GameEngine.validateVote('p1', 'p1', activePlayers, votes);
      expect(val.valid).toBe(false);
      expect(val.error).toContain('cannot vote for yourself');
    });

    it('prohibits eliminated players from voting (Problem 2)', () => {
      // p5 is not in activePlayers (eliminated)
      const val = GameEngine.validateVote('p5', 'p1', activePlayers, votes);
      expect(val.valid).toBe(false);
      expect(val.error).toContain('active players can vote');
    });

    it('prohibits voting for eliminated players', () => {
      const val = GameEngine.validateVote('p1', 'p5', activePlayers, votes);
      expect(val.valid).toBe(false);
      expect(val.error).toContain('must be an active player');
    });

    it('prohibits duplicate votes from same player (TC-014)', () => {
      const existing = new Map<string, VoteRecord>([
        ['p1', { voterPlayerId: 'p1', targetPlayerId: 'p2', submittedAt: new Date().toISOString() }],
      ]);
      const val = GameEngine.validateVote('p1', 'p3', activePlayers, existing);
      expect(val.valid).toBe(false);
      expect(val.error).toContain('already voted');
    });

    it('eliminates unique highest vote target (TC-016)', () => {
      const voteMap = new Map<string, VoteRecord>([
        ['p1', { voterPlayerId: 'p1', targetPlayerId: 'p2', submittedAt: '' }],
        ['p2', { voterPlayerId: 'p2', targetPlayerId: 'p3', submittedAt: '' }],
        ['p3', { voterPlayerId: 'p3', targetPlayerId: 'p2', submittedAt: '' }],
        ['p4', { voterPlayerId: 'p4', targetPlayerId: 'p2', submittedAt: '' }],
      ]);

      const res = GameEngine.resolveVotes(voteMap, activePlayers);
      expect(res.isTie).toBe(false);
      expect(res.eliminatedPlayerId).toBe('p2');
    });

    it('does not eliminate anyone on top tie (TC-017)', () => {
      const voteMap = new Map<string, VoteRecord>([
        ['p1', { voterPlayerId: 'p1', targetPlayerId: 'p2', submittedAt: '' }],
        ['p2', { voterPlayerId: 'p2', targetPlayerId: 'p1', submittedAt: '' }],
        ['p3', { voterPlayerId: 'p3', targetPlayerId: 'p2', submittedAt: '' }],
        ['p4', { voterPlayerId: 'p4', targetPlayerId: 'p1', submittedAt: '' }],
      ]);

      const res = GameEngine.resolveVotes(voteMap, activePlayers);
      expect(res.isTie).toBe(true);
      expect(res.eliminatedPlayerId).toBe(null);
    });
  });

  describe('Victory Conditions (TC-019, TC-020)', () => {
    const assignments = new Map([
      ['p1', { playerId: 'p1', role: 'INNOCENT' as const, word: 'Apple' }],
      ['p2', { playerId: 'p2', role: 'INNOCENT' as const, word: 'Apple' }],
      ['p3', { playerId: 'p3', role: 'INNOCENT' as const, word: 'Apple' }],
      ['p4', { playerId: 'p4', role: 'IMPOSTER' as const, word: 'Mango' }],
    ]);

    it('Innocents win when all imposters eliminated (TC-019)', () => {
      const active = ['p1', 'p2', 'p3']; // p4 eliminated
      expect(GameEngine.checkVictory(active, assignments)).toBe('INNOCENT');
    });

    it('Imposters win when active imposters >= active innocents (TC-020)', () => {
      // 1 imposter vs 1 innocent
      const active = ['p1', 'p4'];
      expect(GameEngine.checkVictory(active, assignments)).toBe('IMPOSTER');

      // 2 imposters vs 2 innocents
      const assign2 = new Map([
        ['p1', { playerId: 'p1', role: 'INNOCENT' as const, word: 'W1' }],
        ['p2', { playerId: 'p2', role: 'INNOCENT' as const, word: 'W1' }],
        ['p3', { playerId: 'p3', role: 'IMPOSTER' as const, word: 'W2' }],
        ['p4', { playerId: 'p4', role: 'IMPOSTER' as const, word: 'W2' }],
      ]);
      expect(GameEngine.checkVictory(['p1', 'p2', 'p3', 'p4'], assign2)).toBe('IMPOSTER');
    });

    it('returns null if game continues', () => {
      // 3 innocents vs 1 imposter
      expect(GameEngine.checkVictory(['p1', 'p2', 'p3', 'p4'], assignments)).toBe(null);
    });
  });

  describe('Scoring (TC-021)', () => {
    it('awards +10 to all members of winning team including eliminated, 0 to losers', () => {
      const assignments = new Map([
        ['p1', { playerId: 'p1', role: 'INNOCENT' as const, word: 'W1' }],
        ['p2', { playerId: 'p2', role: 'INNOCENT' as const, word: 'W1' }],
        ['p3', { playerId: 'p3', role: 'IMPOSTER' as const, word: 'W2' }],
      ]);

      const innocentScores = GameEngine.calculateScores(assignments, 'INNOCENT');
      expect(innocentScores.get('p1')).toBe(10);
      expect(innocentScores.get('p2')).toBe(10);
      expect(innocentScores.get('p3')).toBe(0);

      const imposterScores = GameEngine.calculateScores(assignments, 'IMPOSTER');
      expect(imposterScores.get('p1')).toBe(0);
      expect(imposterScores.get('p2')).toBe(0);
      expect(imposterScores.get('p3')).toBe(10);
    });
  });
});
