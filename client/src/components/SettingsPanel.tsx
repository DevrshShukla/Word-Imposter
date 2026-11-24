import React from 'react';
import { Settings, Users, Sparkles, BookOpen } from 'lucide-react';
import { RoomSettings, Difficulty } from '../types/game.types';

interface Props {
  settings: RoomSettings;
  isHost: boolean;
  playerCount: number;
  onUpdateSettings: (newSettings: Partial<RoomSettings>) => void;
}

export const SettingsPanel: React.FC<Props> = ({
  settings,
  isHost,
  playerCount,
  onUpdateSettings,
}) => {
  const maxPossibleImposters = Math.max(1, playerCount - 1);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center space-x-2 text-sm font-bold text-slate-200 mb-4 pb-2 border-b border-slate-800">
        <Settings className="w-4 h-4 text-indigo-400" />
        <span>Game Settings {isHost ? '(Host Only)' : '(View Only)'}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Imposter Count */}
        <div>
          <label className="flex items-center text-xs font-semibold text-slate-400 mb-1.5">
            <Users className="w-3.5 h-3.5 mr-1 text-rose-400" />
            Imposters
          </label>
          <select
            disabled={!isHost}
            value={settings.imposterCount}
            onChange={(e) => onUpdateSettings({ imposterCount: parseInt(e.target.value, 10) })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 disabled:opacity-50 focus:outline-none focus:border-indigo-500"
          >
            {Array.from({ length: maxPossibleImposters }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'Imposter' : 'Imposters'}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div>
          <label className="flex items-center text-xs font-semibold text-slate-400 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" />
            Difficulty
          </label>
          <select
            disabled={!isHost}
            value={settings.difficulty}
            onChange={(e) => onUpdateSettings({ difficulty: e.target.value as Difficulty | 'Any' })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 disabled:opacity-50 focus:outline-none focus:border-indigo-500"
          >
            <option value="Any">Any Difficulty</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="flex items-center text-xs font-semibold text-slate-400 mb-1.5">
            <BookOpen className="w-3.5 h-3.5 mr-1 text-indigo-400" />
            Category
          </label>
          <select
            disabled={!isHost}
            value={settings.category}
            onChange={(e) => onUpdateSettings({ category: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 disabled:opacity-50 focus:outline-none focus:border-indigo-500"
          >
            <option value="Any">All Categories</option>
            <option value="Food">Food</option>
            <option value="Bollywood & Cinema">Bollywood & Cinema</option>
            <option value="Cricket & Sports">Cricket & Sports</option>
            <option value="Indian Festivals & Culture">Indian Festivals & Culture</option>
            <option value="Daily Life in India">Daily Life in India</option>
            <option value="Travel & Places">Travel & Places</option>
            <option value="Pop Culture & Tech">Pop Culture & Tech</option>
          </select>
        </div>
      </div>
    </div>
  );
};
