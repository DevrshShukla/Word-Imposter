import React from 'react';
import { MessageSquare, Vote, AlertCircle } from 'lucide-react';

interface Props {
  isHost: boolean;
  onStartVoting: () => void;
}

export const DiscussionPanel: React.FC<Props> = ({ isHost, onStartVoting }) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl text-center max-w-xl mx-auto my-4">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
        <MessageSquare className="w-7 h-7" />
      </div>

      <h3 className="text-xl font-extrabold text-slate-100">Discussion Phase</h3>
      <p className="text-sm text-slate-300 mt-2">
        All active players have given their clues! Now freely discuss and debate who seems suspicious or who gave a clunky clue.
      </p>

      <div className="mt-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 text-left space-y-1.5">
        <div className="flex items-center text-slate-300 font-semibold mb-1">
          <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
          Tips for Discussion:
        </div>
        <div>• Imposters have a related word, so their clue might sound slightly off or overly generic.</div>
        <div>• Innocents must identify the imposter without giving away their secret word.</div>
      </div>

      <div className="mt-6">
        {isHost ? (
          <button
            onClick={onStartVoting}
            className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-rose-950/50 flex items-center justify-center space-x-2 mx-auto transition-all active:scale-95"
          >
            <Vote className="w-4 h-4 mr-1" />
            <span>Initiate Voting (Host Control)</span>
          </button>
        ) : (
          <div className="text-xs text-slate-400 italic">
            Waiting for the Host to initiate the voting phase...
          </div>
        )}
      </div>
    </div>
  );
};
