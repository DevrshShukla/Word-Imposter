import crypto from 'crypto';
import { TeamRole, Difficulty, WordLanguage, IWordPair } from '../types/game.types.js';

export interface RoleAssignment {
  playerId: string;
  role: TeamRole;
  word: string;
}

export interface VoteRecord {
  voterPlayerId: string;
  targetPlayerId: string;
  submittedAt: string;
}

export interface VoteResolutionResult {
  voteCounts: { targetPlayerId: string; voteCount: number }[];
  eliminatedPlayerId: string | null;
  isTie: boolean;
}

export class GameEngine {
  /**
   * Default imposter count calculation:
   * 3-5 players: 1
   * 6-8 players: 2
   * 9-12 players: 3
   */
  public static calculateDefaultImposters(playerCount: number): number {
    if (playerCount < 3) {
      throw new Error('Minimum player count is 3');
    }
    if (playerCount <= 5) return 1;
    if (playerCount <= 8) return 2;
    return 3;
  }

  /**
   * Validate roster and imposter count before game start
   */
  public static validateRoster(playerCount: number, imposterCount: number): { valid: boolean; error?: string } {
    if (playerCount < 3) {
      return { valid: false, error: 'At least 3 players are required to start the game' };
    }
    if (imposterCount < 1) {
      return { valid: false, error: 'Must have at least 1 imposter' };
    }
    if (imposterCount >= playerCount) {
      return { valid: false, error: 'At least one innocent player must remain' };
    }
    return { valid: true };
  }

  /**
   * Cryptographically secure Fisher-Yates shuffle
   */
  public static shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      // Use crypto.randomInt for unbiased cryptographic randomness
      const j = crypto.randomInt(0, i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /**
   * Assign roles deterministically, securely, and with imposter rotation.
   * Ensures players who were imposters in the previous game are rotated out
   * so a different player gets the imposter role randomly.
   * word1 -> Innocent
   * word2 -> Imposter
   */
  public static assignRoles(
    playerIds: string[],
    imposterCount: number,
    wordPair: { word1: string; word2: string },
    previousImposterIds: string[] = []
  ): {
    assignments: Map<string, RoleAssignment>;
    imposterIds: string[];
    innocentIds: string[];
  } {
    const validation = this.validateRoster(playerIds.length, imposterCount);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    let imposterIds: string[] = [];
    let innocentIds: string[] = [];

    // Filter players who were NOT imposters in the previous game
    const nonPreviousImposters = playerIds.filter((id) => !previousImposterIds.includes(id));
    const previousImposters = playerIds.filter((id) => previousImposterIds.includes(id));

    if (nonPreviousImposters.length >= imposterCount) {
      // Pick imposters randomly from players who were NOT previous imposters
      const shuffledNonPrevious = this.shuffle(nonPreviousImposters);
      imposterIds = shuffledNonPrevious.slice(0, imposterCount);
      const remainingNonPrevious = shuffledNonPrevious.slice(imposterCount);
      innocentIds = [...remainingNonPrevious, ...previousImposters];
    } else {
      // If there are more imposters needed than non-previous imposters, pick all non-previous first
      const shuffledNonPrevious = this.shuffle(nonPreviousImposters);
      const shuffledPrevious = this.shuffle(previousImposters);
      const neededFromPrevious = imposterCount - shuffledNonPrevious.length;
      imposterIds = [
        ...shuffledNonPrevious,
        ...shuffledPrevious.slice(0, neededFromPrevious),
      ];
      innocentIds = shuffledPrevious.slice(neededFromPrevious);
    }

    const assignments = new Map<string, RoleAssignment>();

    for (const id of innocentIds) {
      assignments.set(id, {
        playerId: id,
        role: 'INNOCENT',
        word: wordPair.word1,
      });
    }

    for (const id of imposterIds) {
      assignments.set(id, {
        playerId: id,
        role: 'IMPOSTER',
        word: wordPair.word2,
      });
    }

    return { assignments, imposterIds, innocentIds };
  }

  /**
   * Generates a fixed speaking order using Fisher-Yates
   */
  public static generateSpeakingOrder(playerIds: string[]): string[] {
    return this.shuffle(playerIds);
  }

  /**
   * Determines the current active speaker in the fixed order.
   * Skips eliminated players.
   */
  public static getCurrentSpeaker(
    speakingOrder: string[],
    spokenPlayerIds: string[],
    activePlayerIds: string[]
  ): string | null {
    const activeOrder = speakingOrder.filter((id) => activePlayerIds.includes(id));
    for (const id of activeOrder) {
      if (!spokenPlayerIds.includes(id)) {
        return id;
      }
    }
    return null;
  }

  /**
   * Checks if all active players have completed speaking in the current round
   */
  public static haveAllActiveSpoken(speakingOrder: string[], spokenPlayerIds: string[], activePlayerIds: string[]): boolean {
    const activeOrder = speakingOrder.filter((id) => activePlayerIds.includes(id));
    return activeOrder.every((id) => spokenPlayerIds.includes(id));
  }

  /**
   * Validates a vote submission
   */
  public static validateVote(
    voterId: string,
    targetId: string,
    activePlayerIds: string[],
    existingVotes: Map<string, VoteRecord>
  ): { valid: boolean; error?: string } {
    if (!activePlayerIds.includes(voterId)) {
      return { valid: false, error: 'Only active players can vote' };
    }
    if (!activePlayerIds.includes(targetId)) {
      return { valid: false, error: 'Vote target must be an active player' };
    }
    if (voterId === targetId) {
      return { valid: false, error: 'You cannot vote for yourself' };
    }
    if (existingVotes.has(voterId)) {
      return { valid: false, error: 'You have already voted this round' };
    }
    return { valid: true };
  }

  /**
   * Checks if all eligible voters have submitted votes
   */
  public static isVotingComplete(eligibleVoterIds: string[], votes: Map<string, VoteRecord>): boolean {
    return eligibleVoterIds.every((id) => votes.has(id));
  }

  /**
   * Resolves vote counts.
   * If unique highest vote count: eliminate that player.
   * If top tie: nobody is eliminated.
   */
  public static resolveVotes(
    votes: Map<string, VoteRecord>,
    eligibleVoterIds: string[]
  ): VoteResolutionResult {
    const counts = new Map<string, number>();

    // Initialize all eligible targets with 0 votes
    for (const id of eligibleVoterIds) {
      counts.set(id, 0);
    }

    for (const vote of votes.values()) {
      const current = counts.get(vote.targetPlayerId) || 0;
      counts.set(vote.targetPlayerId, current + 1);
    }

    const voteCounts = Array.from(counts.entries())
      .map(([targetPlayerId, voteCount]) => ({ targetPlayerId, voteCount }))
      .sort((a, b) => b.voteCount - a.voteCount);

    if (voteCounts.length === 0) {
      return { voteCounts: [], eliminatedPlayerId: null, isTie: true };
    }

    const maxVotes = voteCounts[0].voteCount;
    if (maxVotes === 0) {
      // Nobody received votes
      return { voteCounts, eliminatedPlayerId: null, isTie: true };
    }

    const topCandidates = voteCounts.filter((vc) => vc.voteCount === maxVotes);

    if (topCandidates.length > 1) {
      // Top tie -> no elimination
      return { voteCounts, eliminatedPlayerId: null, isTie: true };
    }

    return {
      voteCounts,
      eliminatedPlayerId: topCandidates[0].targetPlayerId,
      isTie: false,
    };
  }

  /**
   * Checks victory conditions:
   * - Remaining Imposters == 0 -> INNOCENTS win
   * - Remaining Imposters >= remaining Innocents -> IMPOSTERS win
   * - Otherwise -> null (game continues)
   */
  public static checkVictory(
    activePlayerIds: string[],
    assignments: Map<string, RoleAssignment>
  ): TeamRole | null {
    let activeImposters = 0;
    let activeInnocents = 0;

    for (const id of activePlayerIds) {
      const role = assignments.get(id)?.role;
      if (role === 'IMPOSTER') {
        activeImposters++;
      } else if (role === 'INNOCENT') {
        activeInnocents++;
      }
    }

    if (activeImposters === 0) {
      return 'INNOCENT';
    }

    if (activeImposters >= activeInnocents) {
      return 'IMPOSTER';
    }

    return null;
  }

  /**
   * Calculate scores:
   * +10 for all players on the winning team (including eliminated members of that team)
   * 0 for players on the losing team
   */
  public static calculateScores(
    assignments: Map<string, RoleAssignment>,
    winningTeam: TeamRole
  ): Map<string, number> {
    const scoreAwards = new Map<string, number>();

    for (const [playerId, assignment] of assignments.entries()) {
      if (assignment.role === winningTeam) {
        scoreAwards.set(playerId, 10);
      } else {
        scoreAwards.set(playerId, 0);
      }
    }

    return scoreAwards;
  }
}
