import React, { useEffect, useState } from 'react';
import { monopolyInstance } from '../../models/Monopoly';
import { GameBoardSpace } from '../../../backend/shared/types';
import GameBox from './GameBox';
import './gameBoard.scss';
import data from '../../../backend/shared/data/gameBlocks.json'
import { BOX_TYPES, SquareType } from '../../../backend/shared/constants';
import DiceControls from './DiceControl';


interface GameBoardLayoutProps {
  onTileClick: (getTileData: GameBoardSpace) => void;
} 




const GameBoardLayout: React.FC<GameBoardLayoutProps> = ({ 
  onTileClick,
  }) => {
  const [boardData, setBoardData] = useState<GameBoardSpace[]>([]);
  const [players, setPlayers] = useState(monopolyInstance.players.getArray());
  const [positions, setPositions] = useState<Record<string, number>>({});



  console.log("Board Data:", boardData);
  console.log("Players:", monopolyInstance.players.getArray());
  console.log("Positions:", monopolyInstance.playerPositions);
  console.log(monopolyInstance)
  console.log(positions)
  

  useEffect(() => {
    // Load the board data from Monopoly instance and subscribe to changes
    setBoardData(monopolyInstance.boardData);

    


    const unsubscribe = monopolyInstance.subscribe(() => {
      setPlayers(monopolyInstance.players.getArray());
      setPositions(monopolyInstance.playerPositions);
    });

    
    

    // monopolyInstance.socket.on('diceRolled', ({ playerName, currentIndex }) => {
    //   setPositions((prevPositions) => ({
    //     ...prevPositions,
    //     [playerName]: currentIndex
    //   }));
    // });

    

    return () => {
      unsubscribe();
      monopolyInstance.socket.off('diceRolled');
    }
  }, []);


 
 




  const getTileData = (tileData: any): GameBoardSpace => {
    // map type to specific value in GameBoardSpace
    const boxType = getBoxType(tileData);
    return {
      ...tileData,
      type: (boxType?.type || tileData.type) as keyof typeof BOX_TYPES,
      price: boxType?.price || tileData.price || 0,
    } as GameBoardSpace;
  };

  // Helper functions to get board sides
  const getBottomSquare = () => data.slice(1, 10).reverse();
  const getLeftSquare = () => data.slice(11, 20).reverse();
  const getTopSquare = () => data.slice(21, 30);
  const getRightSquare = () => data.slice(31, 40);



  const getGoCorner = () => data.slice(0, 1).reverse();
  const getVisitingCorner = () => data.slice(10, 11).reverse();
  const getParkingCorner = () => data.slice(20, 21).reverse();
  const getJailCorner = () => data.slice(30, 31).reverse();

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
      return { type: BOX_TYPES.AVENUE, price: boxElement.price };
    }
    
    return null;
  };





  return (
    
      <div className='table'>
       
      <div className='board'>

      
      
        <div className='center'>
        
          
          {/* <div className='community-chest-deck'>
            <h2 className='label'>Community Chest</h2>
            <div className='deck'></div>
          </div> */}
        
          <h1 className='title'>METROPOLIS</h1>

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
              <div className="player-color">{player.color}</div>
              <div className="player-balance">Balance: ${player.balance}</div>
              {monopolyInstance.players.current()?.id === player.id && (
                  <div className="current-turn-indicator">Current Turn</div>
                )}
              </div>
            ))}
          </div>


          <DiceControls />
         
          


        </div>
        
        
        
        <div className='space corner go'>
          {getGoCorner().map((tile, index) => {
            return (
              <GameBox
                id={0}
                key={index}
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
        {getBottomSquare().map((tile, index) => {
            return (
              <GameBox
                id={index + 1}
                key={index}
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
        {getVisitingCorner().map((tile, index) => {
            return (
              <GameBox
                id={10}
                key={index}
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
        {getLeftSquare().map((tile, index) => {
            return (
              <GameBox
                id={index + 11}
                key={index}
                square={SquareType.VERTICAL_SQUARE}
                tileData={getTileData(tile)}
                players={players}
                playerPositions={positions}
                onClick={() => onTileClick(getTileData(tile))}
                {...tile}
              />
            );
          })}
        </div>


        <div className='space corner free-parking'>
        {getParkingCorner().map((tile, index) => {
            return (
              <GameBox
                id={20}
                key={index}
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
        {getTopSquare().map((tile, index) => {
            return (
              <GameBox
                id={index + 21}
                key={index}
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


        <div className='space corner go-to-jail'>
        {getJailCorner().map((tile, index) => {
            return (
              <GameBox
                id={30}
                key={index}
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
        {getRightSquare().map((tile, index) => {
            return (
              <GameBox
                id={index + 31}
                key={index}
                square={SquareType.VERTICAL_SQUARE}
                tileData={getTileData(tile)}
                players={players}
                playerPositions={positions}
                onClick={() => onTileClick(getTileData(tile))}
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
