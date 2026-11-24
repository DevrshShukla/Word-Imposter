import React from 'react';
import { Crown, Skull, WifiOff } from 'lucide-react';
import { PublicPlayerDTO } from '../types/game.types';

interface Props {
  player: PublicPlayerDTO;
  isCurrentSpeaker?: boolean;
  isSelf?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
}

export const PlayerCard: React.FC<Props> = ({
  player,
  isCurrentSpeaker = false,
  isSelf = false,
  selectable = false,
  selected = false,
  onSelect,
  disabled = false,
}) => {
  const isEliminated = player.status === 'ELIMINATED';
  const isDisconnected = player.connectionStatus === 'DISCONNECTED';

  return (
    <div
      onClick={() => {
        if (selectable && !disabled && onSelect) {
          onSelect();
        }
      }}
      className={`relative p-3.5 rounded-2xl border transition-all duration-200 select-none ${
        selectable && !disabled ? 'cursor-pointer hover:scale-[1.02]' : ''
      } ${
        disabled
          ? 'opacity-40 cursor-not-allowed bg-slate-900/50 border-slate-800'
          : selected
          ? 'bg-rose-950/50 border-rose-500 shadow-lg shadow-rose-950/50 ring-2 ring-rose-500'
          : isCurrentSpeaker
          ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/80 shadow-lg shadow-indigo-950/40'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-md ${
            isEliminated
              ? 'bg-slate-800 text-slate-500'
              : isCurrentSpeaker
              ? 'bg-indigo-600 text-white animate-pulse'
              : selected
              ? 'bg-rose-600 text-white'
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          {isEliminated ? (
            <Skull className="w-5 h-5 text-rose-400" />
          ) : (
            player.displayName.charAt(0).toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1.5">
            <span
              className={`font-semibold text-sm truncate ${
                isEliminated ? 'line-through text-slate-500' : 'text-slate-100'
              }`}
            >
              {player.displayName}
            </span>
            {isSelf && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                You
              </span>
            )}
            {player.isHost && (
              <span title="Room Host">
                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-400">
            {isEliminated ? (
              <span className="text-rose-400 font-medium">Eliminated</span>
            ) : isDisconnected ? (
              <span className="flex items-center text-amber-400">
                <WifiOff className="w-3 h-3 mr-1" /> Disconnected
              </span>
            ) : isCurrentSpeaker ? (
              <span className="text-indigo-400 font-semibold animate-pulse">Speaking now...</span>
            ) : (
              <span>Score: {player.cumulativeScore} pts</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
