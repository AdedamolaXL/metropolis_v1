import Link from "next/link";
import type { NextPage } from "next";
import { BugAntIcon, MagnifyingGlassIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { MetaHeader } from "~~/components/MetaHeader";
import React, { useState, useEffect } from "react";
import { useAccount } from 'wagmi';
import { GameBoardLayout } from '../screens/GameScreen/GameBoardLayout';
import { monopolyInstance } from '../models/Monopoly';
import { showToast } from '../utilities';
import { Player } from '../models/Player';

interface DiceValues {
  one: number;
  two: number;
}

const Home: NextPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState("");
  const { address } = useAccount();
  const [refresh, setRefresh] = useState(true);
  const [currentTurn, setCurrentTurn] = useState<Player>(monopolyInstance.Players?.current?.());
  const [diceValues, setDiceValues] = useState<DiceValues>({ one: 0, two: 0 });
  const [showLogs, setShowLogs] = useState(false);
  const [gameStatus, setGameStatus] = useState(true);

  useEffect(() => {
    if (!monopolyInstance.Players.current) console.log('Address', refresh);
  }, [refresh]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === "filename") {
      setFileName(e.target.value);
    }
    if (e.target.name === 'file') {
      const selectedFile = e.target.files?.[0]; // Perform a null check
      setFile(selectedFile!); // Assert the existence using the non-null assertion operator
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      var formData = new FormData();
      formData.append("filename", fileName);
      if (file) {
        formData.append('file', file);
      }
      const res = await fetch("/api/uploadData", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Network response is not ok");
      }
      const data = await res.json();
      setResult(data.message);
    } catch (err) {
      console.error(err);
    }
  };

  const rollDice = () => {
    console.log('Address', address);
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }
    const one = Math.floor(Math.random() * 6) + 1;
    const two = Math.floor(Math.random() * 6) + 1;
    setDiceValues({ one, two });
    updatePlayerPositions(one, two);
  };

  const updateCurrentPlayerCurrentIndex = (one: number, two: number) => {
    const playerIndex = currentTurn.currentIndex + one + two;
    currentTurn.currentIndex = playerIndex > 40 ? playerIndex - 40 : playerIndex;
    if (playerIndex > 40) {
      currentTurn.balance += 200;
      showToast('Passed Go Collect $200');
      monopolyInstance.logs.push('Passed Go Collect $200');
    }
    setRefresh((prev) => !prev);
  };

  const endGameIfOnlyOnePlayerLeft = () => {
    if ([...monopolyInstance.Players].length === 1) {
      setRefresh((prev) => !prev);
      setGameStatus(false);
    }
  };

  const updatePlayerPositions = (one: number, two: number) => {
    endGameIfOnlyOnePlayerLeft();
    const isFirstTurnOfEveryPlayer = [...monopolyInstance.Players].every(
      (player) => !player?.playerTurn
    );
    if (isFirstTurnOfEveryPlayer) {
      currentTurn.lastDiceValue = one + two;
      toggleCurrentTurn();
      const isFirstTurnPlayedByEveryOne = [...monopolyInstance.players].every(
        (player) => player?.lastDiceValue
      );

      if (isFirstTurnPlayedByEveryOne) {
        const greatestFirstDiceValue = Math.max(
          ...[...monopolyInstance.Players].map((player: any) => player.lastDiceValue)
        );
        const playerIndexWithGreatestDiceValue = [...monopolyInstance.Players].findIndex(
          (player) => player?.lastDiceValue === greatestFirstDiceValue
        );
        monopolyInstance.Players.index = playerIndexWithGreatestDiceValue;

        setRefresh((prev) => !prev);
        setCurrentTurn(monopolyInstance.Players?.current?.());
        updateCurrentPlayerCurrentIndex(one, two);
      }
    } else updateCurrentPlayerCurrentIndex(one, two);
  };

  const toggleCurrentTurn = () => {
    monopolyInstance.Players.next();
    setCurrentTurn(monopolyInstance.Players?.current?.());
  };

  const toggleLogs = () => {
    setShowLogs((prev) => !prev);
  };

  const removePlayerFromGame = (player: Player) => {
    monopolyInstance.Players = [...monopolyInstance.Players].filter(
      (gamePlayer) => player !== gamePlayer
    ) as Player[];
    if (!monopolyInstance.removedPlayers.find((removedPlayer) => removedPlayer === player))
      monopolyInstance.removedPlayers.push(player);
    endGameIfOnlyOnePlayerLeft();
    setRefresh((prev) => !prev);
  };

  return (
    <>
      <MetaHeader />
      <div className="flex flex-col items-center flex-grow pt-10 bg-gray-100 min-h-screen">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">Scaffold-ETH</span>
          </h1>
        </div>

        {/* <div className="flex-grow bg-white shadow-md rounded-lg w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
           
            <div className="flex flex-col bg-gray-50 p-6 text-center items-center max-w-xs rounded-3xl shadow-lg">
              <BugAntIcon className="h-8 w-8 text-blue-500 mb-4" />
              <h2 className="text-xl font-semibold mb-4">Store IPFS hash on blockchain</h2>
              <form onSubmit={handleSubmit} className="w-full">
                <label className="block mb-2 text-sm font-medium">Enter Unique Filename:</label>
                <input
                  type="text"
                  name="filename"
                  value={fileName}
                  onChange={handleChange}
                  className="mb-4 w-full p-2 border border-gray-300 rounded"
                />
                <input
                  type="file"
                  name="file"
                  onChange={handleChange}
                  className="mb-4 w-full p-2 border border-gray-300 rounded"
                />
                <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                  Upload
                </button>
              </form>
              {result && <p className="mt-2 text-green-600">{result}</p>}
            </div>
          </div>
        </div> */}

        <div className="container mx-auto px-4 py-4">
          <GameBoardLayout
            players={monopolyInstance.Players}
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
      </div>
    </>
  );
};

export default Home;
