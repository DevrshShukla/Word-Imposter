import React, { useState, useEffect } from 'react';
import { ShieldAlert, PlusCircle, LogIn, HelpCircle } from 'lucide-react';
import { ApiService } from '../services/api';
import { socketService } from '../services/socket';
import { useGameStore } from '../stores/gameStore';

export const LandingPage: React.FC = () => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [displayName, setDisplayName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setRoom, setMyPlayer, setToken } = useGameStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      setRoomCode(codeParam.toUpperCase());
      setTab('join');
    }
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await ApiService.createRoom(displayName.trim());
      setToken(res.token);
      setMyPlayer(res.player);
      setRoom(res.room);
      socketService.connect(res.token);
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setError('Please enter a 6-character room code');
      return;
    }
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await ApiService.joinRoom(roomCode.trim().toUpperCase(), displayName.trim());
      setToken(res.token);
      setMyPlayer(res.player);
      setRoom(res.room);
      socketService.connect(res.token);
    } catch (err: any) {
      setError(err.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 selection:bg-rose-500 selection:text-white">
      <div className="text-center max-w-md mx-auto mb-8 animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-600 via-fuchsia-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-rose-950/60 ring-4 ring-rose-500/20">
          <ShieldAlert className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-rose-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
          Word Imposter
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          The real-time social deduction party game. Find the imposter before they outsmart you!
        </p>
      </div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setTab('create');
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
              tab === 'create'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Room</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('join');
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
              tab === 'join'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Join Room</span>
          </button>
        </div>

        {error && (
          <div className="bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs rounded-xl p-3 mb-4 text-center">
            {error}
          </div>
        )}

        {tab === 'create' ? (
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Your Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. Aarav, Priya, Rohan"
                value={displayName}
                maxLength={30}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-rose-950/50 transition-all active:scale-95 flex items-center justify-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{loading ? 'Creating Room...' : 'Create Private Room'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Room Code
              </label>
              <input
                type="text"
                placeholder="6-character code (e.g. K7P9QX)"
                value={roomCode}
                maxLength={6}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 font-mono tracking-widest text-sm text-slate-100 placeholder-slate-500 uppercase focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Your Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. Aarav, Priya, Rohan"
                value={displayName}
                maxLength={30}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-indigo-950/50 transition-all active:scale-95 flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Joining Room...' : 'Join Game Room'}</span>
            </button>
          </form>
        )}
      </div>

      <div className="w-full max-w-md mt-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400">
        <div className="flex items-center text-slate-300 font-bold mb-2">
          <HelpCircle className="w-4 h-4 mr-1.5 text-indigo-400" />
          <span>How To Play Word Imposter</span>
        </div>
        <ul className="space-y-1 list-disc list-inside">
          <li>Most players receive one secret word (Innocents).</li>
          <li>Imposters receive a closely related word.</li>
          <li>Each player gives 1 clue in speaking order without revealing their word.</li>
          <li>Discuss, deduce, and vote to eliminate the suspected Imposter!</li>
        </ul>
      </div>
    </div>
  );
};
