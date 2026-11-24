import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, ShieldCheck, ShieldAlert } from 'lucide-react';
import { TeamRole } from '../types/game.types';

interface Props {
  winnerTeam: TeamRole;
  isHost: boolean;
  onRematch: () => void;
  onViewLeaderboard: () => void;
}

export const WinnerBanner: React.FC<Props> = ({
  winnerTeam,
  isHost,
  onRematch,
  onViewLeaderboard,
}) => {
  const isInnocents = winnerTeam === 'INNOCENT';

  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl max-w-xl mx-auto my-6 text-center">
      <div
        className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-xl ${
          isInnocents
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
        }`}
      >
        {isInnocents ? <ShieldCheck className="w-12 h-12" /> : <ShieldAlert className="w-12 h-12" />}
      </div>

      <div className="text-xs uppercase font-extrabold tracking-widest text-slate-400 mb-1">
        Game Over
      </div>
      <h2
        className={`text-3xl font-black tracking-tight ${
          isInnocents
            ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200'
            : 'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-fuchsia-300'
        }`}
      >
        {isInnocents ? 'Innocents Win!' : 'Imposters Win!'}
      </h2>

      <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto">
        {isInnocents
          ? 'All imposters have been successfully uncovered and eliminated! +10 points awarded to the Innocent team.'
          : 'Imposters have taken over! Imposters equaled or outnumbered the remaining Innocents. +10 points awarded to Imposters.'}
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        {isHost && (
          <button
            onClick={onRematch}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-950/50 flex items-center justify-center space-x-2 transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            <span>Play Rematch (Host)</span>
          </button>
        )}

        <button
          onClick={onViewLeaderboard}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-sm border border-slate-700 flex items-center justify-center space-x-2 transition-all active:scale-95"
        >
          <Trophy className="w-4 h-4 mr-1" />
          <span>View Leaderboard</span>
        </button>
      </div>
    </div>
  );
};
