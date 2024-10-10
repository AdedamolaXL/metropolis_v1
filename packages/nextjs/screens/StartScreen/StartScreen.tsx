import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { COLORS, GAME_SETTINGS } from '../../Constants'
import { monopolyInstance } from '../../models/Monopoly'
import { showToast } from '../../utilities'
import { useAccount, useSendTransaction } from 'wagmi'
import { useFactoryContract } from '../../hooks/scaffold-eth/useFactoryContract'
import { parseEther } from 'viem'

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
        <div className="flex flex-col space-y-2" key={i}>
          <input
            className="input border border-gray-300 rounded-md p-2"
            placeholder="Enter Player Name"
            onChange={(event) => onPlayerDataChange('name', event.target.value, i)}
            value={playerDetails[i]?.name || ''}
          />
          <select
            className="input border border-gray-300 rounded-md p-2"
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
          className={`cursor-pointer p-2 m-2 border border-gray-300 rounded-lg text-center ${i === playerCount ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="mb-8">
        {/* <img src={logo} alt="Game Logo" className="h-32 w-32" /> */}
      </div>
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
        {countValidated ? (
          <>
            <label htmlFor="PlayerCount" className="block text-xl font-medium mb-4">
              Enter Player Details
            </label>
            <div className="space-y-4">
              {getPlayerFormFields()}
              <div className="flex justify-between">
                <button
                  type="button"
                  className="bg-red-500 text-white px-4 py-2 rounded-md"
                  onClick={() => setCountValidated(false)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md"
                  onClick={validateGameSettings}
                >
                  Start Game
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <label htmlFor="PlayerCount" className="block text-xl font-medium mb-4">
              Select Number of Players
            </label>
            <div className="grid grid-cols-3 gap-4">
              {getNumberOfPlayersInputBoxes()}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default StartScreen
