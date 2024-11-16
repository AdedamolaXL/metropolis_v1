
import React, { useState, useEffect } from 'react';
import GameBoardLayout from './GameBoardLayout';
import { GameBoardSpace, ServerPlayerData, ClientPlayerData } from '../../../backend/shared/types';
import { monopolyInstance } from '../../models/Monopoly';
import { useNavigate } from 'react-router-dom';
import ActionModal from './ActionModal';
import { useAccount } from 'wagmi'


const GameScreen: React.FC = () => {
  const { address } = useAccount();
  const [selectedTile, setSelectedTile] = useState<GameBoardSpace | null>(null);
  const [boardData, setBoardData] = useState<GameBoardSpace[]>([]);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

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


  const handleBuyProperty = () => {
    if (selectedTile && selectedTile.propertyData) {
      const propertyId = selectedTile.propertyData.id;
      if (propertyId !== undefined) {
        monopolyInstance.buyProperty(propertyId);
      }
    }
    handleCloseModal();  // Close modal after action
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const handlePayRent = () => {
    if (selectedTile) {
      monopolyInstance.rentProperty(selectedTile);
    }
    handleCloseModal();
  };

  const handleDrawCard = () => {
    if (selectedTile?.type === 'CHANCE' || selectedTile?.type === 'COMMUNITY') {
      monopolyInstance.drawCard(selectedTile.type);
    }
    handleCloseModal();
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
      />
    )}
  </div>

  );
};

export default GameScreen;

