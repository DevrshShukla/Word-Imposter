import { create } from 'zustand';
import {
  PublicRoomDTO,
  PublicGameDTO,
  PublicPlayerDTO,
  PrivateAssignmentDTO,
  LeaderboardEntryDTO,
} from '../types/game.types';
import { sound } from '../utils/audio';

interface GameState {
  room: PublicRoomDTO | null;
  game: PublicGameDTO | null;
  myPlayer: PublicPlayerDTO | null;
  myAssignment: PrivateAssignmentDTO | null;
  token: string | null;
  leaderboard: LeaderboardEntryDTO[];
  soundEnabled: boolean;
  isLeaderboardOpen: boolean;

  setRoom: (room: PublicRoomDTO | null) => void;
  setGame: (game: PublicGameDTO | null) => void;
  setMyPlayer: (player: PublicPlayerDTO | null) => void;
  setMyAssignment: (assignment: PrivateAssignmentDTO | null) => void;
  setToken: (token: string | null) => void;
  setLeaderboard: (leaderboard: LeaderboardEntryDTO[]) => void;
  toggleSound: () => void;
  toggleLeaderboard: () => void;
  resetAll: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  room: null,
  game: null,
  myPlayer: null,
  myAssignment: null,
  token: localStorage.getItem('word_imposter_token') || null,
  leaderboard: [],
  soundEnabled: true,
  isLeaderboardOpen: false,

  setRoom: (room) => set({ room }),
  setGame: (game) => set({ game }),
  setMyPlayer: (myPlayer) => set({ myPlayer }),
  setMyAssignment: (myAssignment) => set({ myAssignment }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('word_imposter_token', token);
    } else {
      localStorage.removeItem('word_imposter_token');
    }
    set({ token });
  },
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  toggleSound: () =>
    set((state) => {
      const next = !state.soundEnabled;
      sound.soundEnabled = next;
      return { soundEnabled: next };
    }),
  toggleLeaderboard: () => set((state) => ({ isLeaderboardOpen: !state.isLeaderboardOpen })),
  resetAll: () => {
    localStorage.removeItem('word_imposter_token');
    set({
      room: null,
      game: null,
      myPlayer: null,
      myAssignment: null,
      token: null,
      leaderboard: [],
      isLeaderboardOpen: false,
    });
  },
}));
