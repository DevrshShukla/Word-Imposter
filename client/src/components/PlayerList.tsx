import React from 'react';
import { PublicPlayerDTO } from '../types/game.types';
import { PlayerCard } from './PlayerCard';

interface Props {
  players: PublicPlayerDTO[];
  currentSpeakerId?: string | null;
  myPlayerId?: string | null;
}

export const PlayerList: React.FC<Props> = ({ players, currentSpeakerId, myPlayerId }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        <span>Players in Room ({players.length})</span>
        <span className="text-slate-500">Min: 3 players</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            isCurrentSpeaker={player.id === currentSpeakerId}
            isSelf={player.id === myPlayerId}
          />
        ))}
      </div>
    </div>
  );
};
