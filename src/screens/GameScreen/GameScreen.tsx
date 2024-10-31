/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameBoardLayout } from './GameBoardLayout'
import { monopolyInstance } from '../../models/Monopoly'
import { showToast } from '../../utilities'
import './gameBoard.scss'
import { useAccount } from 'wagmi'
import { ClientPlayerData } from '../../../backend/shared/types'
import { Cycled } from '../../../backend/utilities/cycled'

const defaultPlayer: ClientPlayerData = {
  id: 'default',
  name: 'Default Player',
  wealth: 0,
  color: 'gray',
  currentIndex: 0,
  ownedProperties: [],
  playerTurn: 1,
  lastTurnBlockID: '',
  lastDiceValue: 0,
  getOutOfJailFree: 0,
  balance: 0,
}

export const GameScreen = () => {
  const { address } = useAccount()
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(true)
  const [currentTurn, setCurrentTurn] = useState<ClientPlayerData>(monopolyInstance.players?.current() ?? defaultPlayer)
  const [diceValues, setDiceValues] = useState<{ one: number; two: number }>({ one: 0, two: 0 })
  const [showLogs, setShowLogs] = useState(false)
  const [gameStatus, setGameStatus] = useState(true)

  useEffect(() => {
    if (!monopolyInstance.players.current) navigate('/')
  }, [navigate])

  useEffect(() => {
    // Update game state when refreshKey changes
    setCurrentTurn(monopolyInstance.players?.current() ?? defaultPlayer)
  }, [refresh])

  const rollDice = () => {
    console.log('Address', address)
    if (!address) {
      alert('Please connect your wallet first')
      return
    }
    const [one, two] = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
    monopolyInstance.rollDice(); // This will use the rolled values
    setDiceValues({ one, two });
    setRefresh(prev => !prev);
  }

  const endGameIfOnlyOnePlayerLeft = () => {
    if ([...monopolyInstance.players].length === 1) {
      setRefresh((prev) => !prev)
      setGameStatus(false)
    }
  }

  const toggleCurrentTurn = () => {
    monopolyInstance.players.next()
    setCurrentTurn(monopolyInstance.players?.current() ?? defaultPlayer)
  }

  const toggleLogs = () => {
    setShowLogs((prev) => !prev)
  }

  const removePlayerFromGame = (playerId: string) => {
    // Filter out the player to be removed from the current players
    const updatedPlayers = [...monopolyInstance.players.getArray()].filter(
      (gamePlayer) => playerId !== gamePlayer.id
    );
  
    // Update the players to the new Cycled instance
    monopolyInstance.players = new Cycled(updatedPlayers);
  
    // Find the removed player to add to removedPlayers
    const removedPlayer = [...monopolyInstance.players.getArray()].find(
      (player) => player.id === playerId
    );
  
    // Add to removed players if not already there and if player was found
    if (removedPlayer && !monopolyInstance.removedPlayers.find((player) => player.id === playerId)) {
      monopolyInstance.removedPlayers.push(removedPlayer);
      showToast(`${removedPlayer.name} has been eliminated from the game`, 3000);
    }
  
    endGameIfOnlyOnePlayerLeft();
    setRefresh((prev) => !prev);
  };

//   if (updatedPlayers.length === 1) {
//     const winner = updatedPlayers[0];
//     showToast(`Game Over! ${winner.name} wins!`, 5000);
//   }
  
//   setRefresh(prev => prev + 1);
// }
  

  return (
    <>
      <div className="responsive">
        <GameBoardLayout
          players={monopolyInstance.players.getArray()}
          currentPlayer={currentTurn}
          diceValues={diceValues}
          onDiceRoll={rollDice}
          toggleCurrentTurn={toggleCurrentTurn}
          toggleLogs={toggleLogs}
          showLogs={showLogs}
          removePlayerFromGame={removePlayerFromGame}
          gameStatus={gameStatus}
        />
      </div>
    </>
  )
}
