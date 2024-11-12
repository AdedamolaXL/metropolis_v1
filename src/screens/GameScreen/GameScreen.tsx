
import React, { useState, useEffect } from 'react';
import GameBoardLayout from './GameBoardLayout';
import { GameBoardSpace } from '../../../backend/shared/types';
import { monopolyInstance } from '../../models/Monopoly';
import { useNavigate } from 'react-router-dom';
import { simulateContract, writeContract } from '@wagmi/core'
import { useAccount } from 'wagmi'
import { config } from '../../config'
import { CONTRACT_ABI } from '../../contracts-abi'; // Import the ABI


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
  };
  
  useEffect(() => {
    console.log('Selected Tile after click:', selectedTile?.propertyData);
  }, [selectedTile]);


  const handleBuyProperty = async () => {
    if (selectedTile && selectedTile.propertyData) {
      const propertyId = selectedTile.propertyData.id;
      if (propertyId !== undefined) {
        console.log('Property ID:', propertyId); // Check if this logs correctly
        monopolyInstance.buyProperty(propertyId);
        try {
          const { request } = await simulateContract(config,{
            address: '0x5fbdb2315678afecb367f032d93f642f64180aa3', // Address of the Property contract
            abi: CONTRACT_ABI,
            functionName: 'buyProperty',
            args: [address], 
          });
    
          const result = await writeContract(config, request); // Use the request from simulateContract
    
          console.log('Property purchased:', result); 
        } catch (error) {
          console.error('Error buying property:', error);
        }
      } else {
        console.log("Property ID is undefined.");
      }
    } else {
      console.log("No tile selected or no property data available.");
    }
  };
  

  console.log('Selected Tile propertyData:', selectedTile?.propertyData);

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

