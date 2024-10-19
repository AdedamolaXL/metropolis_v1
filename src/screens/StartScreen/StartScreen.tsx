import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { COLORS } from '../../../backend/shared/Constants'
import { showToast } from '../../utilities'
import './startScreen.scss'
import io from 'socket.io-client'

interface Player {
  name: string
  color: string
}

interface GameState {
  players: Player[]
  properties: any[] // Define a proper type for properties if possible
  currentPlayer: Player | null
}

const socket = io('http://localhost:4000', {
  withCredentials: true,
  extraHeaders: {
    "my-custom-header": "abcd"
  }
});

const StartScreen: React.FC = () => {
  const navigate = useNavigate()
  const [playerName, setPlayerName] = useState('')
  const [playerColor, setPlayerColor] = useState(COLORS[0])
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      showToast('Failed to connect to the game server. Please try again later.');
    });

    socket.on('gameState', (state: GameState) => {
      setGameState(state)
      if (state.players.length > 0 && isJoining) {
        navigate('/game') // Navigate to game screen when players are present and we're joining
      }
    })

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('gameState');
    }
  }, [navigate, isJoining])

  const handleJoinGame = () => {
    if (playerName.trim()) {
      setIsJoining(true)
      socket.emit('joinGame', { name: playerName, color: playerColor })
    } else {
      showToast('Please enter your name')
    }
  }

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
              {gameState.players.map((player, index) => (
                <li key={index} style={{color: player.color}}>{player.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default StartScreen