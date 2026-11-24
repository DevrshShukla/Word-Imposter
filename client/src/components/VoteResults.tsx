import React from 'react';
import { BarChart3, Skull, AlertTriangle, ArrowRight } from 'lucide-react';
import { VoteResultsDTO } from '../types/game.types';

interface Props {
  results: VoteResultsDTO;
  onContinue: () => void;
}

export const VoteResults: React.FC<Props> = ({ results, onContinue }) => {
  const maxVotes = Math.max(...results.voteCounts.map((v) => v.voteCount), 1);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-xl mx-auto my-6">
      <div className="flex items-center space-x-2 text-sm font-bold text-slate-200 mb-4 pb-2 border-b border-slate-800">
        <BarChart3 className="w-4 h-4 text-indigo-400" />
        <span>Voting Results — Round {results.roundNumber}</span>
      </div>

      {results.isTie ? (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 mb-6 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-left text-xs">
            <span className="font-bold text-amber-200 text-sm block">It's a Tie!</span>
            <span className="text-slate-300">
              Multiple players tied for the highest votes. As per game rules, nobody is eliminated. The game proceeds to another round!
            </span>
          </div>
        </div>
      ) : results.eliminatedPlayer ? (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-4 mb-6 flex items-start space-x-3">
          <Skull className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-left text-xs">
            <span className="font-bold text-rose-200 text-sm block">
              {results.eliminatedPlayer.displayName} has been Eliminated!
            </span>
            <span className="text-slate-300 mt-1 block">
              Their revealed role was:{' '}
              <span
                className={`font-black uppercase px-2 py-0.5 rounded text-xs ml-1 ${
                  results.eliminatedPlayer.revealedRole === 'IMPOSTER'
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {results.eliminatedPlayer.revealedRole}
              </span>
            </span>
          </div>
        </div>
      ) : null}

      <div className="space-y-3 mb-6">
        {results.voteCounts.map((entry) => {
          const percentage = (entry.voteCount / maxVotes) * 100;
          return (
            <div key={entry.targetPlayerId} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-200">{entry.displayName}</span>
                <span className="text-slate-400">
                  {entry.voteCount} {entry.voteCount === 1 ? 'vote' : 'votes'}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-rose-500 to-indigo-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <button
          onClick={onContinue}
          className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-950/50 flex items-center justify-center space-x-2 transition-all active:scale-95"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
