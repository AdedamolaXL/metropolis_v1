import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { COLORS } from '../../../backend/shared/constants';
import { showToast } from '../../utilities';
import { GameState, ServerPlayerData } from '../../../backend/shared/types'; // Use ServerPlayerData
import './startScreen.scss';
import { useAccount } from 'wagmi';
import { monopolyInstance } from '../../models/Monopoly';


const StartScreen: React.FC = () => {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [playerColor, setPlayerColor] = useState(COLORS[0] || 'blue'); // Fallback color
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const { address, isConnected} = useAccount();

  useEffect(() => {
    monopolyInstance.socket.on('gameState', (state) => {
      if (state.players.length > 0) {
        navigate('/game');
      }
    });
    monopolyInstance.socket.on('rejoinGame', (player) => {
      setPlayerName(player.name);
      setPlayerColor(player.color);
      navigate('/game');
    });

    return () => {
      monopolyInstance.socket.off('gameState');
      monopolyInstance.socket.off('rejoinGame');
    };
  }, [navigate]);

  const handleJoinGame = () => {
    if (!isConnected) {
      showToast('Please connect your wallet first.');
      return;
    }

    if (playerName.trim() && address) {
      monopolyInstance.joinGame(playerName, playerColor, address);
    } else {
      showToast('Please enter your name');
    }
  };


  return (
    <div className="start-screen">
      <div className="game-logo">
        <img src={logo} alt="Game Logo" />
      </div>
      <div className="game-form">
        <h2>Join Monopoly Game</h2>
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="input"
        />
        <select
          value={playerColor}
          onChange={(e) => setPlayerColor(e.target.value)}
          className="input mar-2"
        >
          {COLORS.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
        <button onClick={handleJoinGame} disabled={isJoining} className="input active">
          {isJoining ? 'Joining...' : 'Join Game'}
        </button>
        
        {gameState && gameState.players.length > 0 && (
          <div className="current-players">
            <h3>Current Players:</h3>
            <ul>
              {gameState.players.map((player: ServerPlayerData, index: number) => (
                <li key={index} style={{ color: player.color }}>{player.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default StartScreen;

