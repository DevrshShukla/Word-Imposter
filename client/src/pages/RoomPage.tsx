import React, { useEffect, useState } from 'react';
import { Play, Eye, EyeOff } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import { socketService } from '../services/socket';
import { ApiService } from '../services/api';
import { AppHeader } from '../components/AppHeader';
import { RoomCodeCard } from '../components/RoomCodeCard';
import { PlayerList } from '../components/PlayerList';
import { SettingsPanel } from '../components/SettingsPanel';
import { RoleRevealCard } from '../components/RoleRevealCard';
import { SpeakingOrder } from '../components/SpeakingOrder';
import { DiscussionPanel } from '../components/DiscussionPanel';
import { VotingPanel } from '../components/VotingPanel';
import { VoteResults } from '../components/VoteResults';
import { WinnerBanner } from '../components/WinnerBanner';
import { Leaderboard } from '../components/Leaderboard';

export const RoomPage: React.FC = () => {
  const {
    room,
    game,
    myPlayer,
    myAssignment,
    setMyAssignment,
    token,
    toggleLeaderboard,
  } = useGameStore();

  const [showRolePeek, setShowRolePeek] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isHost = myPlayer?.isHost ?? false;
  const currentPhase = game?.phase || room?.status || 'LOBBY';

  const isEliminated =
    myPlayer?.status === 'ELIMINATED' ||
    Boolean(game && game.activePlayerIds && myPlayer?.id && !game.activePlayerIds.includes(myPlayer.id));

  useEffect(() => {
    const storedToken = localStorage.getItem('word_imposter_token');
    if (storedToken) {
      socketService.connect(storedToken);
    }
  }, []);

  // Ensure role assignment is freshly synchronized and never carries over stale imposter roles
  useEffect(() => {
    if (game?.id && token && room?.code) {
      ApiService.getMyRole(room.code, game.id, token)
        .then((res) => {
          if (res?.assignment) {
            setMyAssignment(res.assignment);
          }
        })
        .catch(() => {});
    }
  }, [game?.id, token, room?.code, setMyAssignment]);

  const handleStartGame = async () => {
    try {
      setErrorMsg(null);
      await socketService.startGame();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start game');
    }
  };

  const handleProceedToSpeaking = async () => {
    if (game?.id) {
      await socketService.proceedToSpeaking(game.id);
    }
  };

  const handleMarkSpoken = async () => {
    if (game?.id) {
      await socketService.markSpoken(game.id);
    }
  };

  const handleStartVoting = async () => {
    if (game?.id) {
      await socketService.startVoting(game.id);
    }
  };

  const handleSubmitVote = async (targetId: string) => {
    if (game?.id) {
      await socketService.submitVote(game.id, targetId);
    }
  };

  const handleNextRound = async () => {
    if (game?.id) {
      await socketService.nextRound(game.id);
    }
  };

  const handleRematch = async () => {
    try {
      setErrorMsg(null);
      await socketService.rematch();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start rematch');
    }
  };

  const handleUpdateSettings = async (settings: any) => {
    await socketService.updateSettings(settings);
  };

  if (!room) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <AppHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {errorMsg && (
          <div className="bg-rose-950/80 border border-rose-500 rounded-2xl p-3 text-xs text-rose-200 text-center shadow-lg">
            {errorMsg}
          </div>
        )}

        {myAssignment && currentPhase !== 'LOBBY' && currentPhase !== 'ROLE_REVEAL' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 px-4 flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400">Your Secret:</span>
              {showRolePeek ? (
                <span className="font-bold text-sm text-indigo-300">
                  {myAssignment.word} ({myAssignment.role})
                </span>
              ) : (
                <span className="font-mono text-xs text-slate-500">••••••••</span>
              )}
            </div>
            <button
              onClick={() => setShowRolePeek(!showRolePeek)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              {showRolePeek ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showRolePeek ? 'Hide' : 'Peek Word'}</span>
            </button>
          </div>
        )}

        {/* 1. LOBBY PHASE */}
        {currentPhase === 'LOBBY' && (
          <div className="space-y-6 animate-fade-in">
            <RoomCodeCard code={room.code} />

            <PlayerList
              players={room.players}
              myPlayerId={myPlayer?.id}
            />

            <SettingsPanel
              settings={room.settings}
              isHost={isHost}
              playerCount={room.players.length}
              onUpdateSettings={handleUpdateSettings}
            />

            <div className="text-center pt-2">
              {isHost ? (
                <div>
                  <button
                    onClick={handleStartGame}
                    disabled={room.players.length < 3}
                    className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-base shadow-2xl shadow-rose-950/60 transition-all active:scale-95 flex items-center justify-center space-x-2 mx-auto"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Start Game</span>
                  </button>
                  {room.players.length < 3 && (
                    <p className="text-xs text-slate-400 mt-2">
                      Need at least 3 players to start (currently {room.players.length})
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                  Waiting for Host ({room.players.find((p) => p.isHost)?.displayName}) to start the game...
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. ROLE REVEAL PHASE */}
        {currentPhase === 'ROLE_REVEAL' && (
          <RoleRevealCard
            assignment={myAssignment}
            onProceed={handleProceedToSpeaking}
          />
        )}

        {/* 3. SPEAKING PHASE */}
        {currentPhase === 'SPEAKING' && game && (
          <div className="space-y-6 animate-fade-in">
            <SpeakingOrder
              speakingOrder={game.speakingOrder}
              spokenPlayerIds={game.spokenPlayerIds}
              currentSpeakerId={game.currentSpeakerId}
              activePlayerIds={game.activePlayerIds}
              players={room.players}
              myPlayerId={myPlayer?.id || null}
              isEliminated={Boolean(isEliminated)}
              onMarkSpoken={handleMarkSpoken}
              roundNumber={game.roundNumber}
            />

            <PlayerList
              players={room.players}
              currentSpeakerId={game.currentSpeakerId}
              myPlayerId={myPlayer?.id}
            />
          </div>
        )}

        {/* 4. DISCUSSION PHASE */}
        {currentPhase === 'DISCUSSION' && (
          <div className="space-y-6 animate-fade-in">
            <DiscussionPanel isHost={isHost} onStartVoting={handleStartVoting} />
            <PlayerList players={room.players} myPlayerId={myPlayer?.id} />
          </div>
        )}

        {/* 5. VOTING PHASE */}
        {currentPhase === 'VOTING' && game && (
          <div className="space-y-6 animate-fade-in">
            <VotingPanel
              activePlayerIds={game.activePlayerIds}
              players={room.players}
              myPlayerId={myPlayer?.id || null}
              isEliminated={Boolean(isEliminated)}
              voteProgress={game.voteProgress}
              onSubmitVote={handleSubmitVote}
            />
          </div>
        )}

        {/* 6. VOTE RESULTS / ELIMINATION */}
        {currentPhase === 'VOTE_RESULTS' && game?.lastVoteResults && (
          <div className="space-y-6 animate-fade-in">
            <VoteResults
              results={game.lastVoteResults}
              onContinue={handleNextRound}
            />
            <PlayerList players={room.players} myPlayerId={myPlayer?.id} />
          </div>
        )}

        {/* 7. COMPLETED PHASE */}
        {currentPhase === 'COMPLETED' && game?.winnerTeam && (
          <div className="space-y-6 animate-fade-in">
            <WinnerBanner
              winnerTeam={game.winnerTeam}
              isHost={isHost}
              onRematch={handleRematch}
              onViewLeaderboard={toggleLeaderboard}
            />

            <PlayerList players={room.players} myPlayerId={myPlayer?.id} />
          </div>
        )}
      </main>

      <Leaderboard />
    </div>
  );
};
