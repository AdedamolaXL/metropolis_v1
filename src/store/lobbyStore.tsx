// store/lobbyStore.tsx
import { create } from 'zustand';

interface GameState {
  id: string;
  name: string;
  players: string[];
  // ... other game properties as needed
}

interface LobbyStore {
  games: GameState[];
  currentGame: GameState | null;
  playerName: string;
  setGames: (newGames: GameState[]) => void;
  setCurrentGame: (game: GameState | null) => void;
  setPlayerName: (name: string) => void;
  // ... add more actions (joinGame, createGame) as needed 
}

const useLobbyStore = create<LobbyStore>((set) => ({
  games: [],
  currentGame: null,
  playerName: '',

  setGames: (newGames) => set({ games: newGames }),
  setCurrentGame: (game) => set({ currentGame: game }),
  setPlayerName: (name) => set({ playerName: name }),
  // ... add more actions as needed
}));

export default useLobbyStore;