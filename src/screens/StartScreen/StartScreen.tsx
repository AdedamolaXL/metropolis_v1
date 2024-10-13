import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { COLORS, GAME_SETTINGS } from '../../Constants'
import { monopolyInstance } from '../../models/Monopoly'
import { showToast } from '../../utilities'
import './startScreen.scss'
import { useAccount, useSendTransaction } from 'wagmi'
import { useFactoryContract } from '../../hooks/useFactoryContract'
import { parseEther } from 'viem'
import FirebaseConnectionTest from '../../components/FirebaseConnectionTest'
import Auth from '../../components/Auth'  // Import the Auth component
import useAuthStore from '../../store/authStore'  // Import the auth store to get the user state

interface Player {
  name: string
  color: string
}

const StartScreen: React.FC = () => {
  const { address } = useAccount()
  const { hash, createNewGame } = useFactoryContract()
  const navigate = useNavigate()
  const [countValidated, setCountValidated] = useState(false)
  const [playerCount, setPlayerCount] = useState<number>(2)
  const [playerDetails, setPlayerDetails] = useState<Player[]>([])
  const { sendTransaction } = useSendTransaction()
  const { user } = useAuthStore()  // Get the current authenticated user

  const onPlayerDataChange = (property: string, value: string, playerIndex: number) => {
    const updatedPlayerDetails = playerDetails.map((player, index) => {
      if (index === playerIndex) return { ...player, [property]: value }
      else return player
    })

    setPlayerDetails(updatedPlayerDetails)
  }

  const onPlayerCountInputChange = (count: number) => {
    setPlayerCount(count)
    onContinueButtonClick()
  }

  const onContinueButtonClick = () => {
    if (playerCount >= 2) {
      setCountValidated(true)
      setPlayerDetails(getInitialPlayersData())
    } else {
      showToast('Enter Player Count Greater Than 2')
    }
  }

  const getInitialPlayersData = (): Player[] => {
    const data: Player[] = []
    for (let i = 0; i < playerCount; i += 1) {
      data.push({ name: '', color: COLORS[i] })
    }
    return data
  }

  const getPlayerFormFields = () => {
    const fields = []
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
      )
    }
    return fields
  }

  const getNumberOfPlayersInputBoxes = () => {
    const inputBoxes = []
    for (let i = GAME_SETTINGS.MIN_PLAYERS; i <= GAME_SETTINGS.MAX_PLAYERS; i++) {
      inputBoxes.push(
        <div
          key={i}
          className={`player-count-box ${i === playerCount ? 'active' : ''}`}
          onClick={() => onPlayerCountInputChange(i)}
        >
          {i}
        </div>
      )
    }
    return inputBoxes
  }

  useEffect(() => {
    console.log('Created new game', hash)
  }, [hash])

  const validateGameSettings = async () => {
    if (!address) {
      return alert('Please connect your wallet first')
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
      } else {
        showToast('Please Enter All Player Details')
      }
    } else {
      showToast('Please Enter Player Details')
    }
  }

  return (
    <div className="start-screen">
      <div className="game-logo">
        <img src={logo} alt="Game Logo" />
      </div>
      <div className="game-form">
        {/* Render the Auth component */}
        {!user ? (
          <>
            <p>Please sign in to continue.</p>
            <Auth /> {/* Render sign-in/sign-out button */}
          </>
        ) : (
          <>
            {countValidated ? (
              <>
                <label htmlFor="PlayerCount">Enter Player Details</label>
                <div className="player-details-form">
                  {getPlayerFormFields()}
                  <div className="player-details-form-actions">
                    <button
                      type="button"
                      className="input danger"
                      onClick={() => setCountValidated(false)}
                    >
                      Cancel
                    </button>

                    <button type="button" className="input active" onClick={validateGameSettings}>
                      Start Game
                    </button>
                  </div>
                </div>
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
          </>
        )}
      </div>
    </div>
  )
}

export default StartScreen
