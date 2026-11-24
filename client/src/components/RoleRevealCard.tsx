import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import { PrivateAssignmentDTO } from '../types/game.types';
import { sound } from '../utils/audio';

interface Props {
  assignment: PrivateAssignmentDTO | null;
  onProceed: () => void;
}

export const RoleRevealCard: React.FC<Props> = ({ assignment, onProceed }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  const toggleReveal = () => {
    sound.playCardFlip();
    setIsRevealed(!isRevealed);
  };

  const isInnocent = assignment?.role === 'INNOCENT';

  return (
    <div className="max-w-md mx-auto my-6 text-center">
      <div className="mb-4">
        <h2 className="text-xl font-extrabold text-slate-100">Secret Role & Word</h2>
        <p className="text-xs text-slate-400 mt-1">
          Keep your screen hidden from others! Tap the card to reveal or hide your secret word.
        </p>
      </div>

      <div
        onClick={toggleReveal}
        className="relative w-full h-72 cursor-pointer perspective-1000 select-none mx-auto"
      >
        <div
          className={`w-full h-full rounded-3xl transition-transform duration-500 shadow-2xl relative border ${
            isRevealed
              ? isInnocent
                ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 border-emerald-500/50'
                : 'bg-gradient-to-br from-rose-950 via-slate-900 to-rose-900 border-rose-500/50'
              : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-slate-700 hover:border-slate-600'
          }`}
        >
          {isRevealed ? (
            <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg ${
                  isInnocent ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {isInnocent ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
              </div>

              <span
                className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 ${
                  isInnocent
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {assignment?.role}
              </span>

              <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
                Your Secret Word:
              </div>
              <div className="text-3xl font-black text-white mt-1 tracking-wide">
                {assignment?.word}
              </div>

              <div className="flex items-center text-xs text-slate-400 mt-5">
                <EyeOff className="w-3.5 h-3.5 mr-1" /> Tap to hide
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-4 text-indigo-400 animate-pulse">
                <Eye className="w-8 h-8" />
              </div>
              <span className="text-lg font-bold text-slate-200">Tap to Reveal Your Word</span>
              <p className="text-xs text-slate-400 mt-2 max-w-xs">
                Ensure no one else is looking at your screen before tapping.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center">
        <button
          onClick={onProceed}
          className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-950/50 flex items-center justify-center space-x-2 transition-all transform active:scale-95"
        >
          <span>Continue to Speaking Phase</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
