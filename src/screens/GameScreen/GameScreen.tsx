
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
  const [boardData, setBoardData] = useState<GameBoardSpace[]>([])
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(true)


 
  useEffect(() => {
    if (!monopolyInstance.players.current) {
      navigate('/');
      return;
    }

    // Initial board data setup
    const initialBoardData = monopolyInstance.updatedBoard;
    if (initialBoardData && initialBoardData.length > 0) {
      setBoardData(initialBoardData);
    }

    // Set up socket event listeners
    const handleBoardUpdate = () => {
      const newBoardData = monopolyInstance.updatedBoard;
      console.log('Board update received:', newBoardData);
      
      // if (newBoardData && newBoardData.length > 0) {
      //   setBoardData(prevData => {
      //     // Only update if the new data is different
      //     const hasChanges = JSON.stringify(prevData) !== JSON.stringify(newBoardData);
      //     return hasChanges ? [...newBoardData] : prevData;
      //   });
      // }

      if (newBoardData && newBoardData.length > 0) {
        setBoardData(newBoardData);
      }
    };

    // Subscribe to board updates
    const unsubscribe = monopolyInstance.subscribeToBoardUpdates(handleBoardUpdate);

    // Clean up
    return () => {
      unsubscribe();
    };
  }, [navigate]);
  
  
  // useEffect(() => {
  //   // Save the board data to local storage
  //   localStorage.setItem('boardData', JSON.stringify(boardData));
  // }, [boardData]);

  // useEffect(() => {
  //   // Retrieve the board data from local storage on initial load
  //   const storedBoardData = localStorage.getItem('boardData');
  //   if (storedBoardData) {
  //     setBoardData(JSON.parse(storedBoardData));
  //   } else {
  //     // Fallback to the initial board data from monopolyInstance
  //     const initialBoardData = monopolyInstance.updatedBoard;
  //     if (initialBoardData && initialBoardData.length > 0) {
  //       setBoardData(initialBoardData);
  //     }
  //   }
  // }, []);
  

  
  const handleTileClick = (tile: GameBoardSpace) => {
    const updatedTile = boardData.find((space) => space.index === tile.index) || tile;
    setSelectedTile(updatedTile);

    if (updatedTile.currentPlayer) {
      console.log('Tile clicked by current player:', updatedTile.currentPlayer.name);
    } else {
      console.log('Tile clicked:', updatedTile);
    }
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
  

  console.log('Selected Tile propertyData:', selectedTile?.propertyData, selectedTile?.currentPlayer);

 
  // Conditionally log the updated board state if non-empty
  useEffect(() => {
    if (boardData.length > 0) {
      console.log('Updated board state:', boardData);
    }
  }, [boardData]);

  // Re-render periodically if needed
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setRefresh((prev) => !prev); // Toggle state to re-render
  //   }, 1000);
  
  //   return () => clearInterval(interval); // Cleanup on component unmount
  // }, []);

  return (
    <div className="">
      <GameBoardLayout 
        onTileClick={handleTileClick} 
      />
      {selectedTile && (
        <div className="">
          <h3>{selectedTile.name}</h3>
          <p>Price: {selectedTile.pricetext}</p>
          {selectedTile.currentPlayer && (
            <h3>Current Player: {selectedTile.currentPlayer.name}</h3>
          )}
          <button onClick={handleBuyProperty}>Buy Property</button>
        </div>
      )}
    </div>
  );
};

export default GameScreen;

