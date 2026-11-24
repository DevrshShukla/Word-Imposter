import mongoose from 'mongoose';
import { GameModel, IGame } from '../models/Game.js';
import { RoomModel } from '../models/Room.js';
import { PlayerModel } from '../models/Player.js';
import { WordPairModel } from '../models/WordPair.js';
import { GameEngine, RoleAssignment, VoteRecord } from '../engine/gameEngine.js';
import {
  GamePhase,
  PublicGameDTO,
  PrivateAssignmentDTO,
  TeamRole,
  VoteResultsDTO,
  VoteResultEntry,
} from '../types/game.types.js';

export class GameService {
  /**
   * Start a new game in a room
   */
  public static async startGame(roomIdOrCode: string, hostPlayerId: string): Promise<{
    game: PublicGameDTO;
    assignments: Map<string, RoleAssignment>;
  }> {
    const room = mongoose.isValidObjectId(roomIdOrCode)
      ? await RoomModel.findById(roomIdOrCode)
      : await RoomModel.findOne({ code: roomIdOrCode.trim().toUpperCase() });
    if (!room) throw new Error('Room not found');

    const roomId = room._id.toString();

    if (room.hostPlayerId !== hostPlayerId) {
      throw new Error('Only the room Host can start the game');
    }

    if (room.status !== 'LOBBY' && room.status !== 'BETWEEN_GAMES' && room.status !== 'COMPLETED') {
      throw new Error(`Cannot start game from state ${room.status}`);
    }

    const connectedPlayers = await PlayerModel.find({
      roomId,
      connectionStatus: 'CONNECTED',
    }).sort({ joinedAt: 1 });

    if (connectedPlayers.length < 3) {
      throw new Error('At least 3 players are required to start the game');
    }

    // Reset all player statuses to ACTIVE for the new game
    await PlayerModel.updateMany({ roomId }, { status: 'ACTIVE' });

    const playerIds = connectedPlayers.map((p) => p._id.toString());
    const imposterCount = room.settings.imposterCount || GameEngine.calculateDefaultImposters(playerIds.length);

    const validation = GameEngine.validateRoster(playerIds.length, imposterCount);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Select eligible word pair
    const filter: any = { isActive: true };
    if (room.settings.difficulty && room.settings.difficulty !== 'Any') {
      filter.difficulty = room.settings.difficulty;
    }
    if (room.settings.category && room.settings.category !== 'Any') {
      filter.category = room.settings.category;
    }
    if (room.settings.wordLanguage && room.settings.wordLanguage !== 'Any') {
      filter.wordLanguage = room.settings.wordLanguage;
    }

    // Find the previous game in this room to rotate imposters and avoid repeating the same word pair
    const lastGame = await GameModel.findOne({ roomId }).sort({ gameNumber: -1 });
    const previousImposterIds = lastGame
      ? lastGame.assignments.filter((a) => a.role === 'IMPOSTER').map((a) => a.playerId)
      : [];

    let candidates = await WordPairModel.find(filter);
    if (candidates.length === 0) {
      // Fallback to any active pair if specific filter returned empty
      candidates = await WordPairModel.find({ isActive: true });
    }

    if (candidates.length === 0) {
      throw new Error('No eligible word pairs found in database');
    }

    // Exclude previously played word pair if other options exist
    if (lastGame?.wordPairId && candidates.length > 1) {
      const freshCandidates = candidates.filter((c) => c.id !== lastGame.wordPairId);
      if (freshCandidates.length > 0) {
        candidates = freshCandidates;
      }
    }

    // Select random pair
    const selectedPair = candidates[Math.floor(Math.random() * candidates.length)];

    // Assign roles with guaranteed rotation & shuffle speaking order
    const { assignments } = GameEngine.assignRoles(
      playerIds,
      imposterCount,
      {
        word1: selectedPair.word1,
        word2: selectedPair.word2,
      },
      previousImposterIds
    );

    const speakingOrder = GameEngine.generateSpeakingOrder(playerIds);

    // Count existing games in this room
    const prevGamesCount = await GameModel.countDocuments({ roomId });
    const gameNumber = prevGamesCount + 1;

    const assignmentsArray = Array.from(assignments.values()).map((a) => ({
      playerId: a.playerId,
      role: a.role,
      word: a.word,
    }));

    const game = await GameModel.create({
      roomId,
      gameNumber,
      phase: 'ROLE_REVEAL',
      roundNumber: 1,
      settingsSnapshot: {
        imposterCount,
        difficulty: room.settings.difficulty,
        category: room.settings.category,
        wordLanguage: room.settings.wordLanguage,
      },
      wordPairId: selectedPair.id,
      speakingOrder,
      spokenPlayerIds: [],
      activePlayerIds: [...playerIds],
      assignments: assignmentsArray,
      votes: [],
      version: 1,
      startedAt: new Date(),
    });

    room.status = 'ROLE_REVEAL';
    room.version += 1;
    await room.save();

    const publicGame = await this.getPublicGameSnapshot(game._id.toString());
    return { game: publicGame, assignments };
  }

  /**
   * Private assignment retrieval - NEVER returns other players' roles
   */
  public static async getPrivateAssignment(
    gameId: string,
    playerId: string
  ): Promise<PrivateAssignmentDTO | null> {
    const game = await GameModel.findById(gameId);
    if (!game) return null;

    const assignment = game.assignments.find((a) => a.playerId === playerId);
    if (!assignment) return null;

    return {
      role: assignment.role,
      word: assignment.word,
    };
  }

  /**
   * Transition from ROLE_REVEAL to SPEAKING
   */
  public static async proceedToSpeaking(gameId: string): Promise<PublicGameDTO> {
    const game = await GameModel.findById(gameId);
    if (!game) throw new Error('Game not found');

    if (game.phase === 'ROLE_REVEAL') {
      game.phase = 'SPEAKING';
      game.version += 1;
      await game.save();

      await RoomModel.findByIdAndUpdate(game.roomId, { status: 'SPEAKING' });
    }

    return this.getPublicGameSnapshot(gameId);
  }

  /**
   * Mark current speaking turn completed
   */
  public static async markSpoken(gameId: string, playerId: string): Promise<PublicGameDTO> {
    const game = await GameModel.findById(gameId);
    if (!game) throw new Error('Game not found');

    if (game.phase !== 'SPEAKING') {
      throw new Error('Not in speaking phase');
    }

    if (!game.activePlayerIds.includes(playerId)) {
      throw new Error('Eliminated players cannot speak or mark turn complete');
    }

    const speakerPlayer = await PlayerModel.findById(playerId);
    if (speakerPlayer?.status === 'ELIMINATED') {
      throw new Error('Eliminated players cannot speak or mark turn complete');
    }

    if (game.spokenPlayerIds.includes(playerId)) {
      throw new Error('Player has already spoken this round');
    }

    game.spokenPlayerIds.push(playerId);

    const allSpoken = GameEngine.haveAllActiveSpoken(
      game.speakingOrder,
      game.spokenPlayerIds,
      game.activePlayerIds
    );

    if (allSpoken) {
      game.phase = 'DISCUSSION';
      await RoomModel.findByIdAndUpdate(game.roomId, { status: 'DISCUSSION' });
    }

    game.version += 1;
    await game.save();

    return this.getPublicGameSnapshot(gameId);
  }

  /**
   * Start voting (Host only, Discussion phase only)
   */
  public static async startVoting(gameId: string, hostPlayerId: string): Promise<PublicGameDTO> {
    const game = await GameModel.findById(gameId);
    if (!game) throw new Error('Game not found');

    const room = await RoomModel.findById(game.roomId);
    if (!room) throw new Error('Room not found');

    if (room.hostPlayerId !== hostPlayerId) {
      throw new Error('Only the room Host can initiate voting');
    }

    if (game.phase !== 'DISCUSSION') {
      throw new Error('Voting can only be started from Discussion phase');
    }

    const allSpoken = GameEngine.haveAllActiveSpoken(
      game.speakingOrder,
      game.spokenPlayerIds,
      game.activePlayerIds
    );
    if (!allSpoken) {
      throw new Error('All active players must speak before voting can start');
    }

    game.phase = 'VOTING';
    game.version += 1;
    await game.save();

    await RoomModel.findByIdAndUpdate(game.roomId, { status: 'VOTING' });

    return this.getPublicGameSnapshot(gameId);
  }

  /**
   * Submit a vote
   */
  public static async submitVote(
    gameId: string,
    voterId: string,
    targetId: string
  ): Promise<{ game: PublicGameDTO; isComplete: boolean; results?: VoteResultsDTO }> {
    const game = await GameModel.findById(gameId);
    if (!game) throw new Error('Game not found');

    if (game.phase !== 'VOTING') {
      throw new Error('Not in voting phase');
    }

    if (!game.activePlayerIds.includes(voterId)) {
      throw new Error('Eliminated players cannot vote');
    }

    const voterPlayer = await PlayerModel.findById(voterId);
    if (voterPlayer?.status === 'ELIMINATED') {
      throw new Error('Eliminated players cannot vote');
    }

    const existingVotesMap = new Map<string, VoteRecord>();
    const currentRoundVotes = game.votes.filter((v) => v.roundNumber === game.roundNumber);
    for (const v of currentRoundVotes) {
      existingVotesMap.set(v.voterPlayerId, {
        voterPlayerId: v.voterPlayerId,
        targetPlayerId: v.targetPlayerId,
        submittedAt: v.submittedAt.toISOString(),
      });
    }

    const validation = GameEngine.validateVote(
      voterId,
      targetId,
      game.activePlayerIds,
      existingVotesMap
    );
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    game.votes.push({
      roundNumber: game.roundNumber,
      voterPlayerId: voterId,
      targetPlayerId: targetId,
      submittedAt: new Date(),
    });

    existingVotesMap.set(voterId, {
      voterPlayerId: voterId,
      targetPlayerId: targetId,
      submittedAt: new Date().toISOString(),
    });

    const isComplete = GameEngine.isVotingComplete(game.activePlayerIds, existingVotesMap);

    if (!isComplete) {
      game.version += 1;
      await game.save();
      const publicGame = await this.getPublicGameSnapshot(gameId);
      return { game: publicGame, isComplete: false };
    }

    // Resolve votes
    const resolution = GameEngine.resolveVotes(existingVotesMap, game.activePlayerIds);
    const players = await PlayerModel.find({ roomId: game.roomId });
    const playerMap = new Map<string, string>();
    for (const p of players) {
      playerMap.set(p._id.toString(), p.displayName);
    }

    const voteCountsFormatted: VoteResultEntry[] = resolution.voteCounts.map((vc) => ({
      targetPlayerId: vc.targetPlayerId,
      displayName: playerMap.get(vc.targetPlayerId) || 'Unknown',
      voteCount: vc.voteCount,
    }));

    let eliminatedInfo: VoteResultsDTO['eliminatedPlayer'] = null;

    if (!resolution.isTie && resolution.eliminatedPlayerId) {
      const eliminatedId = resolution.eliminatedPlayerId;
      // Remove from active
      game.activePlayerIds = game.activePlayerIds.filter((id) => id !== eliminatedId);

      // Mark in DB
      await PlayerModel.findByIdAndUpdate(eliminatedId, { status: 'ELIMINATED' });

      // Find role
      const assignment = game.assignments.find((a) => a.playerId === eliminatedId);
      eliminatedInfo = {
        id: eliminatedId,
        displayName: playerMap.get(eliminatedId) || 'Unknown',
        revealedRole: assignment ? assignment.role : 'INNOCENT',
      };
    }

    const voteResults: VoteResultsDTO = {
      roundNumber: game.roundNumber,
      voteCounts: voteCountsFormatted,
      eliminatedPlayer: eliminatedInfo,
      isTie: resolution.isTie,
    };

    // Check Victory
    const assignmentsMap = new Map<string, RoleAssignment>();
    for (const a of game.assignments) {
      assignmentsMap.set(a.playerId, {
        playerId: a.playerId,
        role: a.role,
        word: a.word,
      });
    }

    const winner = GameEngine.checkVictory(game.activePlayerIds, assignmentsMap);

    if (winner) {
      game.winnerTeam = winner;
      game.phase = 'COMPLETED';
      game.completedAt = new Date();

      // Award +10 once atomically
      if (!game.scoreAwardedAt) {
        game.scoreAwardedAt = new Date();
        const scoreAwards = GameEngine.calculateScores(assignmentsMap, winner);
        for (const [pId, score] of scoreAwards.entries()) {
          if (score > 0) {
            await PlayerModel.findByIdAndUpdate(pId, { $inc: { cumulativeScore: score } });
          }
        }
      }

      await RoomModel.findByIdAndUpdate(game.roomId, { status: 'COMPLETED' });
    } else {
      // Transition to VOTE_RESULTS for players to review results
      game.phase = 'VOTE_RESULTS';
      await RoomModel.findByIdAndUpdate(game.roomId, { status: 'VOTE_RESULTS' });
    }

    game.version += 1;
    await game.save();

    const publicGame = await this.getPublicGameSnapshot(gameId, voteResults);
    return { game: publicGame, isComplete: true, results: voteResults };
  }

  /**
   * Advance from VOTE_RESULTS to next round (if no winner)
   */
  public static async nextRound(gameId: string): Promise<PublicGameDTO> {
    const game = await GameModel.findById(gameId);
    if (!game) throw new Error('Game not found');

    if (game.phase !== 'VOTE_RESULTS') {
      throw new Error('Can only start next round from VOTE_RESULTS');
    }

    game.roundNumber += 1;
    game.spokenPlayerIds = [];
    game.phase = 'SPEAKING';
    game.version += 1;
    await game.save();

    await RoomModel.findByIdAndUpdate(game.roomId, { status: 'SPEAKING' });

    return this.getPublicGameSnapshot(gameId);
  }

  /**
   * Start a Rematch (Host only, between-game or completed state)
   */
  public static async rematch(roomIdOrCode: string, hostPlayerId: string): Promise<{
    game: PublicGameDTO;
    assignments: Map<string, RoleAssignment>;
  }> {
    const room = mongoose.isValidObjectId(roomIdOrCode)
      ? await RoomModel.findById(roomIdOrCode)
      : await RoomModel.findOne({ code: roomIdOrCode.trim().toUpperCase() });
    if (!room) throw new Error('Room not found');

    if (room.hostPlayerId !== hostPlayerId) {
      throw new Error('Only the room Host can initiate a rematch');
    }

    return this.startGame(room._id.toString(), hostPlayerId);
  }

  /**
   * Safe public game snapshot (contains NO secrets or unrevealed votes)
   */
  public static async getPublicGameSnapshot(
    gameId: string,
    voteResultsOverride?: VoteResultsDTO
  ): Promise<PublicGameDTO> {
    const game = await GameModel.findById(gameId);
    if (!game) throw new Error('Game not found');

    const currentSpeakerId = GameEngine.getCurrentSpeaker(
      game.speakingOrder,
      game.spokenPlayerIds,
      game.activePlayerIds
    );

    const currentSpeakerIndex = currentSpeakerId
      ? game.speakingOrder.indexOf(currentSpeakerId)
      : -1;

    // Aggregate vote progress (without disclosing target)
    let voteProgress: { votedCount: number; totalEligible: number } | undefined;
    if (game.phase === 'VOTING') {
      const roundVotes = game.votes.filter((v) => v.roundNumber === game.roundNumber);
      voteProgress = {
        votedCount: roundVotes.length,
        totalEligible: game.activePlayerIds.length,
      };
    }

    // Build lastVoteResults if in VOTE_RESULTS or COMPLETED
    let lastVoteResults = voteResultsOverride;
    if (!lastVoteResults && (game.phase === 'VOTE_RESULTS' || game.phase === 'COMPLETED')) {
      const roundVotes = game.votes.filter((v) => v.roundNumber === game.roundNumber);
      const votesMap = new Map<string, VoteRecord>();
      for (const v of roundVotes) {
        votesMap.set(v.voterPlayerId, {
          voterPlayerId: v.voterPlayerId,
          targetPlayerId: v.targetPlayerId,
          submittedAt: v.submittedAt.toISOString(),
        });
      }
      const resolution = GameEngine.resolveVotes(votesMap, game.activePlayerIds);
      const players = await PlayerModel.find({ roomId: game.roomId });
      const pMap = new Map<string, string>();
      for (const p of players) {
        pMap.set(p._id.toString(), p.displayName);
      }

      let elimInfo = null;
      if (!resolution.isTie && resolution.eliminatedPlayerId) {
        const a = game.assignments.find((asg) => asg.playerId === resolution.eliminatedPlayerId);
        elimInfo = {
          id: resolution.eliminatedPlayerId,
          displayName: pMap.get(resolution.eliminatedPlayerId) || 'Unknown',
          revealedRole: a ? a.role : 'INNOCENT',
        };
      }

      lastVoteResults = {
        roundNumber: game.roundNumber,
        voteCounts: resolution.voteCounts.map((vc) => ({
          targetPlayerId: vc.targetPlayerId,
          displayName: pMap.get(vc.targetPlayerId) || 'Unknown',
          voteCount: vc.voteCount,
        })),
        eliminatedPlayer: elimInfo,
        isTie: resolution.isTie,
      };
    }

    return {
      id: game._id.toString(),
      roomId: game.roomId,
      gameNumber: game.gameNumber,
      phase: game.phase,
      roundNumber: game.roundNumber,
      speakingOrder: game.speakingOrder,
      currentSpeakerIndex,
      currentSpeakerId,
      spokenPlayerIds: game.spokenPlayerIds,
      activePlayerIds: game.activePlayerIds,
      voteProgress,
      lastVoteResults,
      winnerTeam: game.winnerTeam,
      version: game.version,
    };
  }
}
