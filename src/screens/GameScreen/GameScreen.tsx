// src/components/GameContainer.tsx
import React, { useState, useEffect } from 'react';
import GameBoardLayout from './GameBoardLayout';
import { GameBoardSpace } from '../../../backend/shared/types';
import { monopolyInstance } from '../../models/Monopoly';
import { useNavigate } from 'react-router-dom';

import { useAccount } from 'wagmi'


const GameScreen: React.FC = () => {
  const { address } = useAccount()
  const [selectedTile, setSelectedTile] = useState<GameBoardSpace | null>(null);
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(true)
  

  useEffect(() => {
    if (!monopolyInstance.players.current) navigate('/')
      console.log('Address', refresh)
  }, [navigate])


  

  const handleTileClick = (tile: GameBoardSpace) => {
    setSelectedTile(tile);
    console.log('Tile clicked:', tile);
    // Additional logic to display tile info or enable buy/rent options
  };


  const handleBuyProperty = () => {
    if (selectedTile) {
      monopolyInstance.buyProperty(selectedTile);
    }
  };

  const handleRentProperty = () => {
    if (selectedTile) {
      monopolyInstance.rentProperty(selectedTile);
    }
  };

  return (
    <div className="">
      <GameBoardLayout 
        onTileClick={handleTileClick} 
      />
      {selectedTile && (
        <div className="">
          <h3>{selectedTile.name}</h3>
          <p>Type: {selectedTile.pricetext}</p>
          {selectedTile.currentPlayer && (
            <h3>Current Player: {selectedTile.currentPlayer.name}</h3>
          )}
          <button onClick={handleBuyProperty}>Buy Property</button>
          <button onClick={handleRentProperty}>Rent Property</button>
        </div>
      )}
    </div>
  );
};

export default GameScreen;
