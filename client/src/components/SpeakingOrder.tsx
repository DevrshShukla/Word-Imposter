import React from 'react';
import { Mic, CheckCircle2, Volume2, Skull, Eye } from 'lucide-react';
import { PublicPlayerDTO } from '../types/game.types';

interface Props {
  speakingOrder: string[];
  spokenPlayerIds: string[];
  currentSpeakerId: string | null;
  activePlayerIds: string[];
  players: PublicPlayerDTO[];
  myPlayerId: string | null;
  isEliminated: boolean;
  onMarkSpoken: () => void;
  roundNumber: number;
}

export const SpeakingOrder: React.FC<Props> = ({
  speakingOrder,
  spokenPlayerIds,
  currentSpeakerId,
  activePlayerIds,
  players,
  myPlayerId,
  isEliminated,
  onMarkSpoken,
  roundNumber,
}) => {
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const isMyTurn = !isEliminated && currentSpeakerId === myPlayerId;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Round {roundNumber} — Speaking Turns</h3>
            <p className="text-xs text-slate-400">
              Each active player gives one clue describing their word without revealing it.
            </p>
          </div>
        </div>

        {isEliminated && (
          <div className="flex items-center space-x-1 text-xs text-rose-400 font-bold bg-rose-950/50 px-2.5 py-1 rounded-full border border-rose-500/30">
            <Skull className="w-3.5 h-3.5" />
            <span>Spectating</span>
          </div>
        )}
      </div>

      <div className="space-y-2 mb-6">
        {speakingOrder.map((playerId, index) => {
          const player = playerMap.get(playerId);
          if (!player) return null;

          const isActive = activePlayerIds.includes(playerId);
          const isSpoken = spokenPlayerIds.includes(playerId);
          const isCurrent = currentSpeakerId === playerId;
          const isMe = playerId === myPlayerId;

          if (!isActive) {
            return (
              <div
                key={playerId}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-900 text-xs text-slate-500 line-through"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-slate-600 w-4">{index + 1}.</span>
                  <span>{player.displayName}</span>
                </div>
                <span className="text-rose-500/70">Eliminated (Spectator)</span>
              </div>
            );
          }

          return (
            <div
              key={playerId}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-indigo-950/70 border-indigo-500 shadow-md shadow-indigo-950/50'
                  : isSpoken
                  ? 'bg-slate-900/50 border-slate-800/80 text-slate-400'
                  : 'bg-slate-900/80 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="font-mono text-xs text-slate-500 w-4">{index + 1}.</span>
                <div className="flex items-center space-x-1.5">
                  <span className={`text-sm font-semibold ${isCurrent ? 'text-indigo-300' : ''}`}>
                    {player.displayName}
                  </span>
                  {isMe && (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.2 rounded border border-indigo-500/30">
                      You
                    </span>
                  )}
                </div>
              </div>

              <div>
                {isSpoken ? (
                  <span className="flex items-center text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Spoken
                  </span>
                ) : isCurrent ? (
                  <span className="flex items-center text-xs font-bold text-indigo-400 animate-pulse">
                    <Volume2 className="w-3.5 h-3.5 mr-1" /> Speaking Now...
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">Waiting turn</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Eliminated Spectator banner */}
      {isEliminated ? (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center text-xs text-slate-400 flex items-center justify-center space-x-1.5">
          <Eye className="w-4 h-4 text-slate-400" />
          <span>You are eliminated and spectating this round. You cannot speak or vote.</span>
        </div>
      ) : isMyTurn ? (
        <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-xl p-4 text-center">
          <p className="text-sm font-semibold text-indigo-200 mb-2">
            It is your turn to speak! Say your clue out loud to the group.
          </p>
          <button
            onClick={onMarkSpoken}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-950/40 transition-all active:scale-95"
          >
            I have finished speaking
          </button>
        </div>
      ) : null}
    </div>
  );
};
