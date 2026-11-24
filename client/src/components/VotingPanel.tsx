import React, { useState } from 'react';
import { Vote, CheckCircle2, Skull, Eye } from 'lucide-react';
import { PublicPlayerDTO, VoteProgressDTO } from '../types/game.types';
import { PlayerCard } from './PlayerCard';

interface Props {
  activePlayerIds: string[];
  players: PublicPlayerDTO[];
  myPlayerId: string | null;
  isEliminated: boolean;
  voteProgress?: VoteProgressDTO;
  onSubmitVote: (targetPlayerId: string) => void;
}

export const VotingPanel: React.FC<Props> = ({
  activePlayerIds,
  players,
  myPlayerId,
  isEliminated,
  voteProgress,
  onSubmitVote,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  // Only active, non-eliminated players can be voted for
  const activePlayers = players.filter(
    (p) => activePlayerIds.includes(p.id) && p.status !== 'ELIMINATED'
  );

  const handleVote = () => {
    if (!selectedTargetId || isEliminated) return;
    onSubmitVote(selectedTargetId);
    setHasVoted(true);
  };

  // 1. Spectator View for Eliminated Players
  if (isEliminated) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-xl mx-auto my-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-3 text-rose-400">
          <Skull className="w-7 h-7" />
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-rose-300 font-semibold mb-3">
          <Eye className="w-3.5 h-3.5" />
          <span>Spectator Mode</span>
        </div>

        <h3 className="text-xl font-extrabold text-slate-100">You Are Eliminated</h3>
        <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto">
          As per game rules, eliminated players cannot vote or speak. You can spectate the voting round as remaining active players cast their votes.
        </p>

        {voteProgress && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 inline-block">
            <span className="text-xs text-slate-400 font-medium block mb-1">Voting Progress:</span>
            <span className="text-lg font-black text-rose-400">
              {voteProgress.votedCount} / {voteProgress.totalEligible}
            </span>
            <span className="text-xs text-slate-400 block mt-1">active players voted</span>
          </div>
        )}
      </div>
    );
  }

  // 2. Active Player View
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-2xl mx-auto my-4">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-2 text-rose-400">
          <Vote className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-100">Cast Your Vote</h3>
        <p className="text-xs text-slate-400 mt-1">
          Select the player you believe is the Imposter. You cannot vote for yourself.
        </p>

        {voteProgress && (
          <div className="mt-3 inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            <span>Votes submitted:</span>
            <span className="text-rose-400 font-bold">
              {voteProgress.votedCount} / {voteProgress.totalEligible}
            </span>
          </div>
        )}
      </div>

      {hasVoted ? (
        <div className="text-center p-8 bg-slate-950/60 rounded-xl border border-slate-800">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 animate-bounce-subtle" />
          <h4 className="font-bold text-slate-100 text-base">Your Vote Has Been Recorded!</h4>
          <p className="text-xs text-slate-400 mt-1">
            Votes remain completely hidden until all active players have voted. Please wait...
          </p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {activePlayers.map((player) => {
              const isSelf = player.id === myPlayerId;
              return (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isSelf={isSelf}
                  selectable={!isSelf}
                  disabled={isSelf}
                  selected={selectedTargetId === player.id}
                  onSelect={() => setSelectedTargetId(player.id)}
                />
              );
            })}
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleVote}
              disabled={!selectedTargetId}
              className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-xl shadow-rose-950/50 transition-all active:scale-95 flex items-center justify-center space-x-2"
            >
              <Vote className="w-4 h-4" />
              <span>Confirm Vote</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
