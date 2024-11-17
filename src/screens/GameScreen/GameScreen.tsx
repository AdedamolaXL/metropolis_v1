
import React, { useState, useEffect } from 'react';
import GameBoardLayout from './GameBoardLayout';
import { GameBoardSpace, ServerPlayerData, ClientPlayerData } from '../../../backend/shared/types';
import { monopolyInstance } from '../../models/Monopoly';
import { useNavigate } from 'react-router-dom';
import { parseEther } from 'viem';
import { toast } from 'react-hot-toast';

import { 
  useWriteContract, 
  useReadContract,
  useAccount,
  useWaitForTransactionReceipt
} from 'wagmi';

import ActionModal from './ActionModal';

import { config } from '../../config'
import { CONTRACT_ABI } from '../../contracts-abi'; // Import the ABI

const CONTRACT_ADDRESS = '0xB8bEb46C16eE24b25d1c46824a9296918261b1c2'; 

const GameScreen: React.FC = () => {
  const { address } = useAccount();
  const [selectedTile, setSelectedTile] = useState<GameBoardSpace | null>(null);
  const [boardData, setBoardData] = useState<GameBoardSpace[]>([]);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { 
    writeContractAsync: buyPropertyWrite,
    data: buyTxHash,
    isPending: isBuyLoading,
    error: buyError
  } = useWriteContract();

  const { 
    writeContractAsync: payRentWrite,
    data: rentTxHash,
    isPending: isRentLoading,
    error: rentError
  } = useWriteContract();

  const { isLoading: isBuyTxLoading } = useWaitForTransactionReceipt({
    hash: buyTxHash,
  });

  const { isLoading: isRentTxLoading } = useWaitForTransactionReceipt({
    hash: rentTxHash,
  });

  // Read player balance
  const { data: playerBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'balances',
    args: [address],
    // watch: true,
  });

  const safePlayerBalance = playerBalance ? BigInt(playerBalance.toString()) : BigInt(0);

  const convertToClientPlayerData = (player: ServerPlayerData): ClientPlayerData => ({
    ...player,
      playerTurn: false,
      lastTurnBlockID: null,
      lastDiceValue: 0,
      balance: player.wealth,
      ownedProperties: player.ownedProperties
  });

  useEffect(() => {
    if (!monopolyInstance.players.current) {
      navigate('/');
      return;
    }

    const initialBoardData = monopolyInstance.updatedBoard;
    if (initialBoardData && initialBoardData.length > 0) {
      setBoardData(initialBoardData);
    }

    const handleBoardUpdate = () => {
      const newBoardData = monopolyInstance.updatedBoard;
      if (newBoardData && newBoardData.length > 0) {
        setBoardData(newBoardData);
      }
    };

    const unsubscribe = monopolyInstance.subscribeToBoardUpdates(handleBoardUpdate);

    return () => {
      unsubscribe();
    };
  }, [navigate]);

  const handleTileClick = (tile: GameBoardSpace) => {
    const updatedTile = boardData.find((space) => space.index === tile.index) || tile;
    setSelectedTile(updatedTile);
    setIsModalOpen(true); 

    if (updatedTile.currentPlayer) {
      console.log('Tile clicked by current player:', updatedTile.currentPlayer.name);

      const clientPlayer = convertToClientPlayerData(updatedTile.currentPlayer);
      monopolyInstance.handleLandedSpace(clientPlayer, updatedTile);
    } else {
      console.log('Tile clicked:', updatedTile);
    }
  };


  const handleBuyProperty = async () => {
    if (!selectedTile?.propertyData) return;

    try {
      setIsLoading(true);
      const propertyId = selectedTile.propertyData.id;
      const price = parseEther(selectedTile.propertyData.price.toString());

      // Update local game state
      monopolyInstance.buyProperty(propertyId);

      // Execute blockchain transaction
      await buyPropertyWrite({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'buyProperty',
        args: [BigInt(propertyId), price],
      });

    } catch (error) {
      console.error('Error buying property:', error);
      toast.error('Failed to buy property');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayRent = async () => {
    if (!selectedTile?.propertyData) return;

    try {
      setIsLoading(true);
      const propertyId = selectedTile.propertyData.id;
      const rentAmount = parseEther(selectedTile.propertyData.rent.toString());

      // Update local game state
      monopolyInstance.rentProperty(selectedTile);

      // Execute blockchain transaction
      await payRentWrite({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'payRent',
        args: [BigInt(propertyId), rentAmount],
      });

    } catch (error) {
      console.error('Error paying rent:', error);
      toast.error('Failed to pay rent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrawCard = () => {
    if (selectedTile?.type === 'CHANCE' || selectedTile?.type === 'COMMUNITY') {
      monopolyInstance.drawCard(selectedTile.type);
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

 

  // Display selected tile info and property purchase button
  return (
    <div className="">
    <GameBoardLayout onTileClick={handleTileClick} />

    {isModalOpen && selectedTile && (
      <ActionModal
        tile={selectedTile}
        onClose={handleCloseModal}
        onBuyProperty={handleBuyProperty}
        onPayRent={handlePayRent}
        onDrawCard={handleDrawCard}
        isOwned={!!(selectedTile.propertyData?.owner && selectedTile.propertyData?.owner !== address)}
        isCurrentPlayer={selectedTile.currentPlayer?.walletAddress === address}
        isLoading={isLoading || isBuyLoading || isRentLoading || isBuyTxLoading || isRentTxLoading}
        playerBalance={safePlayerBalance}

        {...buyError && <div className="text-red-500">{buyError.message}</div>}
        {...rentError && <div className="text-red-500">{rentError.message}</div>}
      />
    )}
  </div>

  );
};

export default GameScreen;

