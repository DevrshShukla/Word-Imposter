import React from 'react';
import { Trophy, X, Medal, Crown } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';

export const Leaderboard: React.FC = () => {
  const { isLeaderboardOpen, toggleLeaderboard, leaderboard, room } = useGameStore();

  if (!isLeaderboardOpen) return null;

  const displayEntries =
    leaderboard.length > 0
      ? leaderboard
      : room?.players
      ? [...room.players]
          .sort((a, b) => b.cumulativeScore - a.cumulativeScore)
          .map((p) => ({
            playerId: p.id,
            displayName: p.displayName,
            isHost: p.isHost,
            cumulativeScore: p.cumulativeScore,
            status: p.status,
          }))
      : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-slate-100">Room Leaderboard</h3>
          </div>
          <button
            onClick={toggleLeaderboard}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Scores accumulate across matches in this room. +10 points for each match win!
        </p>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {displayEntries.map((entry, index) => {
            const isFirst = index === 0;
            const isSecond = index === 1;
            const isThird = index === 2;

            return (
              <div
                key={entry.playerId}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isFirst
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-200 shadow-md shadow-amber-950/30'
                    : isSecond
                    ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                    : isThird
                    ? 'bg-slate-850 border-slate-800 text-slate-300'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs">
                    {isFirst ? (
                      <Medal className="w-5 h-5 text-amber-400" />
                    ) : isSecond ? (
                      <Medal className="w-5 h-5 text-slate-300" />
                    ) : isThird ? (
                      <Medal className="w-5 h-5 text-amber-600" />
                    ) : (
                      <span className="font-mono text-slate-500">{index + 1}</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-sm text-slate-100">{entry.displayName}</span>
                    {entry.isHost && (
                      <span title="Room Host">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-amber-400">
                    {entry.cumulativeScore} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={toggleLeaderboard}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
