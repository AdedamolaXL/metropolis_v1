import React, { useEffect, useState } from 'react';
import { monopolyInstance } from '../../models/Monopoly';
import { GameBoardSpace } from '../../../backend/shared/types';
import GameBox from './GameBox';
import './gameBoard.scss';
import data from '../../../backend/shared/data/gameBlocks.json'
import { BOX_TYPES, SquareType } from '../../../backend/shared/constants';
import DiceControls from './DiceControl';
import { useAccount } from 'wagmi';
import { simulateContract, readContract } from '@wagmi/core'
import { config } from '../../config'
import { CONTRACT_ABI } from '../../contracts-abi'; 

interface GameBoardLayoutProps {
  onTileClick: (getTileData: GameBoardSpace) => void;
} 





const GameBoardLayout: React.FC<GameBoardLayoutProps> = ({ 
  onTileClick,
  }) => {
  const [boardData, setBoardData] = useState<GameBoardSpace[]>([]);
  const [players, setPlayers] = useState(monopolyInstance.players.getArray());
  const [positions, setPositions] = useState<Record<string, number>>({});

  console.log(monopolyInstance)
  const { address } = useAccount()

  const updatePlayerBalance = async () => {
    if (address) { 
      try {
        const { request } = await simulateContract(config, {
          address: '0xE2E4B01C3421A99852f0f998ab2C8F424bD14e7B', 
          abi: CONTRACT_ABI,
          functionName: 'getMonopolyMoneyBalance',
          args: [address],
        });
  
        const result = await readContract(config, request);
        console.log('Player balance updated:', result);
  
        // Update the player's balance in the monopolyInstance
        const currentPlayer = monopolyInstance.players.current();
        if (currentPlayer) {
          console.log("currentPlayer.balance:", currentPlayer.balance)
          currentPlayer.balance = Number(BigInt(result as bigint).toString());
          // Update the players state to trigger a re-render
          setPlayers([...monopolyInstance.players.getArray()]); 
        }
      } catch (error) {
        console.error('Error updating player balance:', error);
      }
    }
  };

  useEffect(() => {
    setBoardData(monopolyInstance.boardData);

    const unsubscribe = monopolyInstance.subscribe(() => {
      setPlayers(monopolyInstance.players.getArray());
      setPositions(monopolyInstance.playerPositions);
    });


    
    // Call updatePlayerBalance every 5 seconds if needed
    //const intervalId = setInterval(updatePlayerBalance, 5000);

    return () => {
      // intervalId of updatePlayerBalance
      //clearInterval(intervalId); // Clear interval on component unmount
      unsubscribe();
    }
  }, []);

  const getTileData = (tileData: any): GameBoardSpace => {
    const boxType = getBoxType(tileData);

    const propertyData = tileData.propertyData || {
      id: tileData.index,
      name: tileData.name,
      owner: null,  // Default owner is null
      color: tileData.color,
      price: tileData.price,
      rentLevel: 1,  // Assuming rentLevel starts at 1, adjust as needed
      rent: tileData.rent1 || 0
    }

    return {
      ...tileData,
      type: (boxType?.type || tileData.type) as keyof typeof BOX_TYPES,
      price: boxType?.price || tileData.price || 0,
      index: tileData.index, // ensure index is passed along
      currentPlayer: tileData.currentPlayer || null, // add currentPlayer (if applicable)
      propertyData: propertyData
      
    } as GameBoardSpace;
  };


  // Helper functions to get board sides
  const getBottomSquare = () => data.slice(1, 10);
  const getLeftSquare = () => data.slice(11, 20);
  const getTopSquare = () => data.slice(21, 30);
  const getRightSquare = () => data.slice(31, 40);

  const getGoCorner = () => data.slice(0, 1);
  const getVisitingCorner = () => data.slice(10, 11);
  const getParkingCorner = () => data.slice(20, 21);
  const getJailCorner = () => data.slice(30, 31);

  const getBoxType = (boxElement: any) => {
    const nameInLowerCase = boxElement.name.toLowerCase();
    
    if (nameInLowerCase === "go") return { type: BOX_TYPES.GO, price: 200 };
    if (nameInLowerCase === "visiting") return { type: BOX_TYPES.VISITING, price: null };
    if (nameInLowerCase === "parking") return { type: BOX_TYPES.PARKING, price: null };
    if (nameInLowerCase === "jail") return { type: BOX_TYPES.JAIL, price: null };

    if (nameInLowerCase.includes("luxury")) {
      return {
        type: BOX_TYPES.LUXURY,
        price: parseInt(boxElement.pricetext.replace(/^\D+/g, "")),
      };
    }

    if (nameInLowerCase.includes("income")) {
      return {
        type: BOX_TYPES.INCOME,
        price: parseInt(boxElement.pricetext.replace(/^\D+/g, "")),
      };
    }
    
    if (nameInLowerCase === "chance") return { type: BOX_TYPES.CHANCE, price: null };
    if (nameInLowerCase === "community chest") return { type: BOX_TYPES.COMMUNITY, price: null };

    
    if (nameInLowerCase.includes("railroad") || nameInLowerCase.includes("short line")) {
      return { type: BOX_TYPES.RAILROADS, price: boxElement.price };
    }
    
    if (nameInLowerCase.includes("electric")) {
      return { type: BOX_TYPES.ELECTRIC, price: boxElement.price };
    }

    if (nameInLowerCase.includes("water")) {
      return { type: BOX_TYPES.WATER, price: boxElement.price };
    }
    
    if (typeof boxElement.baserent === "number") {
      return { 
        type: BOX_TYPES.AVENUE, 
        price: boxElement.price,
        propertyData: {
          id: boxElement.index,
          name: boxElement.name,
          owner: boxElement.owner || null,
          color: boxElement.color,
          price: boxElement.price,
          rentLevel: boxElement.rentLevel || 1,  // Assuming rentLevel exists in the boardData
          rent: boxElement.rent1,  // Can be modified based on rent structure
        },
      };
    }
    
    return null;
  };

  console.log(monopolyInstance.players.current()?.id)

  return (
    
    <div className='table'>
       
      <div className='board'>
      
        <div className='center'>
        
          <h1 className='title'>METROPOLIS</h1>

          <div className="community-chest-deck">
						<h2 className="label">Community Chest</h2>
						<div className="deck"></div>
					</div>

          <div className='chance-deck'>
            <h2 className='label'>Chance</h2>
            <div className='deck'></div>
          </div>

          

          <div className="player-info">
            {players.map((player) => (
              <div 
              className={`player-column ${
                monopolyInstance.players.current()?.id === player.id ? 'current-turn' : ''
              }`} 
              key={player.id}
            >
              <div className="player-name">{player.name}</div>
              <div className="player-marker" style={{ backgroundColor: player.color }}>{player.name[0]}</div>
              <div className="player-balance">Balance: ${player.balance}</div>

              {/* Call updatePlayerBalance after displaying the balance */}
              {monopolyInstance.players.current()?.id === player.id && (
                <>
                  <div className="current-turn-indicator">Current Turn</div>
                  {/* Call the function to update the balance from the contract */}
                  {address && ( 
            <button onClick={() => updatePlayerBalance()}>Update Balance</button> 
                  )}
                </>
              )}
              </div>
            ))}
          </div>

          <DiceControls />

        </div>
        
        <div className='space corner go'>
          {getGoCorner().map((tile) => {  
            return (
              <GameBox
                id={tile.index}
                key={tile.index}
                square={SquareType.CORNER_SQUARE}
                tileData={getTileData(tile)}
                players={players}
                playerPositions={positions}
                onClick={() => onTileClick(getTileData(tile))}
                {...tile}

              />
            );
          })}
        </div>

        <div className='row horizontal-row bottom-row'>
          {getBottomSquare()
          .slice()  // Create a shallow copy to avoid modifying the original array
          .reverse()  // Reverse just for display purposes
          .map((tile) => {
          return (
            <GameBox
              id={tile.index}  // Use tile's own index for accurate positioning
              key={tile.index}
              square={SquareType.HORIZONTAL_SQUARE}
              tileData={getTileData(tile)}
              players={players}
              playerPositions={positions}
              onClick={() => onTileClick(getTileData(tile))}
              {...tile}
            />
          );
          })}
        </div>


        <div className='space corner jail'>
        {getVisitingCorner().map((tile) => {
            return (
              <GameBox
                id={tile.index}
                key={tile.index}
                square={SquareType.CORNER_SQUARE}
                tileData={getTileData(tile)}
                players={players}
                playerPositions={positions}
                onClick={() => onTileClick(getTileData(tile))}
                {...tile}
              />
            );
          })}
        </div>

        <div className='row vertical-row left-row'>
          {getLeftSquare()
          .slice()  
          .reverse()  
          .map((tile) => {
            const adjustedPositions: Record<string, number> = Object.keys(positions).reduce((acc, playerId) => {
              acc[playerId] = positions[playerId] + 1;
              return acc;
            }, {} as Record<string, number>);
          return (
            <GameBox
              id={tile.index}  
              key={tile.index}
              square={SquareType.VERTICAL_SQUARE}
              tileData={getTileData(tile)}
              players={players}
              playerPositions={adjustedPositions}
              onClick={() => onTileClick(getTileData(tile))}
              {...tile}
            />
          );
          })}
        </div>

        <div className='space corner free-parking'>
        {getParkingCorner().map((tile) => {
            return (
              <GameBox
                id={tile.index}
                key={tile.index}
                square={SquareType.CORNER_SQUARE}
                tileData={getTileData(tile)}
                players={players}
                playerPositions={positions}
                onClick={() => onTileClick(getTileData(tile))}
                {...tile}
              />
            );
          })}
        </div>

        <div className='row horizontal-row top-row'>
          {getTopSquare().map((tile) => {
          return (
            <GameBox
              id={tile.index} 
              key={tile.index}
              square={SquareType.HORIZONTAL_SQUARE}
              tileData={getTileData(tile)}
              players={players}
              playerPositions={positions}
              onClick={() => onTileClick(getTileData(tile))}
              {...tile}
            />
          );
          })}
        </div>

        <div className='space corner go-to-jail'>
        {getJailCorner().map((tile) => {
            return (
              <GameBox
                id={tile.index}
                key={tile.index}
                square={SquareType.CORNER_SQUARE}
                tileData={getTileData(tile)}
                players={players}
                playerPositions={positions}
                onClick={() => onTileClick(getTileData(tile))}
                {...tile}
              />
            );
          })}
        </div>

        <div className='row vertical-row right-row'>
          {getRightSquare().map((tile) => {
            // adjust player position
            const adjustedPositions: Record<string, number> = Object.keys(positions).reduce((acc, playerId) => {
              acc[playerId] = positions[playerId] - 1;
              return acc;
            }, {} as Record<string, number>);
          return (
            <GameBox
              id={tile.index}  
              key={tile.index}
              square={SquareType.VERTICAL_SQUARE}
              tileData={getTileData(tile)}
              players={players}
              playerPositions={adjustedPositions}
              onClick={() => onTileClick(getTileData(tile))} // Use tile's own index for accurate positioning
              {...tile}
            />
          );
          })}
        </div>

      </div>
    </div>
    
  );
};

export default GameBoardLayout;

