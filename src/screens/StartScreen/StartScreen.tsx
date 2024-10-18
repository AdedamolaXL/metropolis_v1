import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png'

import { COLORS, GAME_SETTINGS } from '../../Constants';
import { showToast } from '../../utilities';
import './startScreen.scss';
import { useAccount } from 'wagmi';
import Auth from '../../components/Auth'  // Import the Auth component

import io from 'socket.io-client';
import useAuthStore from '../../store/authStore';  // Import the auth store to get the user state
import useLobbyStore from '../../store/lobbyStore';  // Import lobby store
import Lobby from '../Lobby/lobby.tsx'  // Import the Lobby component

interface Player {
  name: string;
  color: string;
}

interface GameState {
  players: Player[];
  properties: any[]; // Define a proper type for properties if possible
  currentPlayer: Player | null;
}

const socket = io('http://localhost:4000', {
  withCredentials: true,
  extraHeaders: {
    "my-custom-header": "abcd"
  }
});

const StartScreen: React.FC = () => {
  const { address } = useAccount();
  const navigate = useNavigate();
  const [countValidated, setCountValidated] = useState(false);
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [playerDetails, setPlayerDetails] = useState<Player[]>([]);
  const { user } = useAuthStore(); // Get Firebase user state from the auth store
  const { currentGame } = useLobbyStore(); // Get the current game state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    // Listen for game state updates from the server
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      showToast('Failed to connect to the game server. Please try again later.');
    });

    socket.on('gameState', (state: GameState) => {
      setGameState(state);
      if (state.players.length > 0 && isJoining) {
        navigate('/game'); // Navigate to game screen when players are present and we're joining
      }
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('gameState');
    };
  }, [navigate, isJoining]);

  const onPlayerDataChange = (property: string, value: string, playerIndex: number) => {
    const updatedPlayerDetails = playerDetails.map((player, index) => {
      if (index === playerIndex) return { ...player, [property]: value };
      else return player;
    });

    setPlayerDetails(updatedPlayerDetails);
  };

  const onPlayerCountInputChange = (count: number) => {
    setPlayerCount(count);
    onContinueButtonClick();
  };

  const onContinueButtonClick = () => {
    if (playerCount >= 2) {
      setCountValidated(true);
      setPlayerDetails(getInitialPlayersData());
    } else {
      showToast('Enter Player Count Greater Than 2');
    }
  };

  const getInitialPlayersData = (): Player[] => {
    const data: Player[] = [];
    for (let i = 0; i < playerCount; i += 1) {
      data.push({ name: '', color: COLORS[i] });
    }
    return data;
  };

  const getPlayerFormFields = () => {
    const fields = [];
    for (let i = 0; i < playerCount; i += 1) {
      fields.push(
        <div className="field-group" key={i}>
          <input
            className="input"
            placeholder="Enter Player Name"
            onChange={(event) => onPlayerDataChange('name', event.target.value, i)}
            value={playerDetails[i]?.name || ''}
          />
          <select
            className="input mar-2"
            onChange={(event) => onPlayerDataChange('color', event.target.value, i)}
            value={playerDetails[i] ? playerDetails[i].color : COLORS[i]}
          >
            {COLORS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      );
    }
    return fields;
  };

  const getNumberOfPlayersInputBoxes = () => {
    const inputBoxes = [];
    for (let i = GAME_SETTINGS.MIN_PLAYERS; i <= GAME_SETTINGS.MAX_PLAYERS; i++) {
      inputBoxes.push(
        <div
          key={i}
          className={`player-count-box ${i === playerCount ? 'active' : ''}`}
          onClick={() => onPlayerCountInputChange(i)}
        >
          {i}
        </div>
      );
    }
    return inputBoxes;
  };

  const validateGameSettings = async () => {
    if (!address) {
      return alert('Please connect your wallet first');
    }
    if (playerDetails) {
      if (playerDetails.every((player) => player.name && player.color)) {
        sendTransaction({
          to: '0x8ebE1aa2aE913d81b142028CDCF49517e50135fC',
          value: parseEther('78'),
        })
        monopolyInstance.Players = playerDetails as any
        await createNewGame(address, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
        console.log('hash', hash)
        navigate('/game')
        setIsJoining(true);
        // Join the game
        socket.emit('joinGame', { name: playerDetails[0].name, color: playerDetails[0].color });
        // Navigation to game screen will happen in useEffect when gameState updates
      } else {
        showToast('Please Enter All Player Details');
      }
    } else {
      showToast('Please Enter Player Details');
    }
  };

  // Conditional rendering based on current game state
  if (!currentGame) {
    return <Lobby /> 
  }

  return (
    <div className="start-screen">
      {/* ... */}
      <div className="game-form">
        {/* Correct the conditional rendering */}
        {!user ? ( 
          <>
            <p>Please sign in to continue.</p>
            <Auth /> 
          </>
        ) : gameState && gameState.players.length > 0 ? (
          <div>
            <h2>Current Players:</h2>
            {/* ... */}
          </div>
        ) : countValidated ? (
          <>
            <label htmlFor="PlayerCount">Enter Player Details</label>
            {/* ... */}
          </>
        ) : (
          <>
            <div className="player-count-form">
              <label htmlFor="PlayerCount" className="player-count-label">
                Select Number of Players
              </label>
              <div className="input-wrapper">{getNumberOfPlayersInputBoxes()}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StartScreen;

