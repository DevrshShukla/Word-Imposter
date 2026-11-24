import React, { useEffect } from 'react';
import { useGameStore } from './stores/gameStore';
import { LandingPage } from './pages/LandingPage';
import { RoomPage } from './pages/RoomPage';
import { ApiService } from './services/api';
import { socketService } from './services/socket';

export const App: React.FC = () => {
  const { room, token, setRoom } = useGameStore();

  useEffect(() => {
    // Attempt session re-hydration if token exists
    if (token && !room) {
      const restoreSession = async () => {
        try {
          const params = new URLSearchParams(window.location.search);
          const code = params.get('code');
          if (code) {
            const data = await ApiService.getRoom(code);
            setRoom(data);
            socketService.connect(token);
          }
        } catch {
          // Token expired or invalid
        }
      };
      restoreSession();
    }
  }, [token, room, setRoom]);

  return room ? <RoomPage /> : <LandingPage />;
};

export default App;
