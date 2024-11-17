import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import metropolis from '../../assets/metropolis.png'
import { COLORS } from '../../../backend/shared/constants';
import { showToast } from '../../utilities';
import { GameState, ServerPlayerData } from '../../../backend/shared/types'; // Use ServerPlayerData
import './startScreen.scss';
import { monopolyInstance } from '../../models/Monopoly';
import { useAccount } from 'wagmi';
/* import { simulateContract, writeContract } from '@wagmi/core'
import { config } from '../../config'
import { CONTRACT_ABI } from '../../contracts-abi';  */

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

  const handleJoinGame = async () => {
    if (!isConnected) {
      showToast('Please connect your wallet first.');
      return;
    }

    if (playerName.trim() && address) {
      monopolyInstance.joinGame(playerName, playerColor, address);
/*       try {
        const { request } = await simulateContract(config,{
          address: '0xE2E4B01C3421A99852f0f998ab2C8F424bD14e7B', // Address of the Property contract
          abi: CONTRACT_ABI,
          functionName: 'mintMonopolyMoney',
          args: [address, 1500], 
        });

        const result = await writeContract(config, request); // Use the request from simulateContract

        console.log('Sent 1500 token to:', address); 
      } catch (error) {
        console.error('Error buying property:', error);
      } */
    } else {
      showToast('Please enter your name');
    }
  };

  return (
    <div className="start-screen">
      <div className="game-logo">
        <img src={metropolis} alt="Game Logo" />
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