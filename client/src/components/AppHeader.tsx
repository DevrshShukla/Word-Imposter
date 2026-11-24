import React from 'react';
import { Volume2, VolumeX, Trophy, ShieldAlert, LogOut } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';

export const AppHeader: React.FC = () => {
  const { room, myPlayer, soundEnabled, toggleSound, toggleLeaderboard, resetAll } = useGameStore();

  return (
    <header className="w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-950/40">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg bg-gradient-to-r from-rose-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
              Word Imposter
            </span>
            {room && (
              <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {room.code}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {myPlayer && (
            <div className="hidden sm:flex items-center space-x-2 text-xs font-medium bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-200">{myPlayer.displayName}</span>
              {myPlayer.isHost && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-semibold uppercase">
                  Host
                </span>
              )}
            </div>
          )}

          {room && (
            <button
              onClick={toggleLeaderboard}
              title="Leaderboard"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors border border-slate-700/60"
            >
              <Trophy className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          {room && (
            <button
              onClick={resetAll}
              title="Leave Room"
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors border border-slate-700/60"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
