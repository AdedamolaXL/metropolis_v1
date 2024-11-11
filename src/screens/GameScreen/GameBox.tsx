import React, { useState } from 'react';
import { GameBoardSpace, ClientPlayerData } from '../../../backend/shared/types';
import { BOX_TYPES, SquareType } from '../../../backend/shared/constants';
import './gameBoard.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLongArrowLeft, faQuestion, faSubway, faFrown, faCube, faLightbulb, faTint, faDiamond, faCar } from '@fortawesome/free-solid-svg-icons'

interface GameBoxProps {
  square: SquareType;
  onClick: (tileData: GameBoardSpace) => void;
  tileData: GameBoardSpace;
  players: ClientPlayerData[];
  id: number;
  playerPositions: Record<string, number>; 
}

const GameBox: React.FC<GameBoxProps> = ({ tileData, players, square, id, playerPositions, onClick }) => {
  const { name, pricetext, color, type } = tileData;
  const playersOnTile = Object.entries(playerPositions)
    .filter(([playerId, position]) => position === id) // Check if the player's position matches the tile ID
    .map(([playerId]) => players.find(player => player.name === playerId)) // Get the player data from the players array
    .filter((player): player is ClientPlayerData => player !== undefined); 
  

  //     const currentTileData = tileData.find(tile => tile.id === id);
  //     console.log(`Tile ${id} (${currentTileData?.type || 'unknown'}) has ${playersOnTile.length} player(s):`, {
  //         players: playersOnTile,
  //         tileData: currentTileData
  //     });
  // }
  // console.log(players)
  
  // console.log(playerPositions)
  // console.log(`Tile data for ID ${id}:`, tileData);
  // console.log(tileData)

  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState<{ playerName: string; tileName: string } | null>(null);

  const handleTileClick = () => {
    console.log(`Tile ${id} clicked`);
    console.log("Players on this tile:", playersOnTile);

    onClick(tileData);

    if (playersOnTile.length > 0) {
      const player = playersOnTile[0];
      setPopupContent({ playerName: player.name, tileName: tileData.name})
      setShowPopup(true);
      console.log("Popup content set:", popupContent);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupContent(null);
  }

  const renderContent = () => {
    switch (type) {

      case BOX_TYPES.GO:
        return (
          
            <div className="container">
              <div className="instructions">
              Collect $200 Salary as you pass
              </div>
              <div className="go-word">{name}</div>
              {/* <i className=''>
                <FontAwesomeIcon className='drawing' icon={faLongArrowLeft} />
              </i> */}
            </div>

          
        )

      case BOX_TYPES.AVENUE:
        return (
            <div className="space property">
              <div className="container">
                <div className={`color-bar ${color}`}></div>
                <div className="name">{name}</div>
                {pricetext && <div className="price">{pricetext}</div>}
              </div>
            </div>
        );
      case BOX_TYPES.RAILROADS:
        return (
            <div className='space railroad'>
              <div className='container'>
                <div className="name">{name}</div>
                <i className=''>
                  <FontAwesomeIcon className='drawing' icon={faSubway} />
                </i>
                {pricetext && <div className="price">{pricetext}</div>}
              </div>
              
            </div>
        );
      case BOX_TYPES.CHANCE:
        return (
        <div className='space chance'>
          <div className='container'>
            <div className='name'>{name}</div>
            <i className=''>
              <FontAwesomeIcon className='drawing' icon={faQuestion} />
            </i>
          </div>
        </div>
        )

      case BOX_TYPES.COMMUNITY:
        return (
            <div className='space community-chest'>
              <div className='container'>
                <div className='name'>{name}</div>
                <i className=''>
                  <FontAwesomeIcon className='drawing' icon={faCube} />
                </i>
                <div className='instructions'>Follow instructions on top card</div>
              </div>
            </div>
          )
      
      

        case BOX_TYPES.VISITING:
          return (
            <>
              
              <div className='drawing'>
                <div className='container'>
                  <div className="name">In</div>
                  <div className='window'>
                    <div className='bar'></div>
                    <div className='bar'></div>
                    <div className='bar'></div>
                    <i className=''>
                      <FontAwesomeIcon className='person' icon={faFrown} />
                    </i>
                  </div>
                  <div className='Jail'>Jail</div>
                </div>
              </div>
              <div className='visiting'>Visiting</div>
            </>
          )

        case BOX_TYPES.PARKING:
        return (
          <div className='container'>
            <div className='name'>{name}
            <i className=''>
              <FontAwesomeIcon className='drawing' icon={faCar} />
            </i>
            </div>
          </div>
        )

      case BOX_TYPES.INCOME:
        return (
          <div className='space fee income-tax'>
            <div className='container'>
              <div className="name">{name}</div>
              <div className='diamond'></div>
              <div className="instructions">Pay $200</div>
            </div>
          </div>
        )

      case BOX_TYPES.LUXURY:
        return (
          <div className='space fee income-tax'>
            <div className='container'>
              <div className="name">{name}</div>
              <i className=''>
                <FontAwesomeIcon className='drawing' icon={faDiamond} />
              </i>
              <div className="instructions">Pay $200</div>
            </div>
          </div>
        )

        case BOX_TYPES.ELECTRIC:
          return (
            <div className='space utility electric-company'>
              <div className='container'>
                <div className="name">{name}</div>
                <i className=''>
                  <FontAwesomeIcon className='drawing' icon={faLightbulb} />
                </i>
                <div className="instructions">Pay $200</div>
              </div>
            </div>
          )

          case BOX_TYPES.WATER:
            return (
              <div className='space utility waterworks'>
                <div className='container'>
                  <div className="name">{name}</div>
                  <i className=''>
                    <FontAwesomeIcon className='drawing' icon={faTint} />
                  </i>
                  <div className="instructions">Pay $200</div>
                </div>
              </div>
            )



      case BOX_TYPES.JAIL:
        return <div className="box-text">Jail</div>;
      default:
        // return <div className="box-text">{name}</div>;
    }
  };

 


  return (
    <div
      // className={`space space--${type.toLowerCase()} row--${square}`}
      onClick={() => onClick(tileData)}
      // id={id ? id.toString() : undefined}
    >
      <div onClick={handleTileClick}>
      {renderContent()}
      
      {playersOnTile.length >= 0 && (
        <div className="players-markers">
          {playersOnTile.map(player => (
            <div key={player.id} className="player-marker" style={{ backgroundColor: player.color }}>
              {player.name[0]}
            </div>
          ))}
        </div>
      )}

      {/* Pop-up when player lands on a tile */}
{/*       
      {showPopup && popupContent && (
        <div className="popup">
          <div className="popup-content">
            <h3>{popupContent.playerName} landed on {popupContent.tileName}</h3>
            <button onClick={closePopup}>Close</button>
          </div>
        </div>
      )} */}

      </div>
    </div>
  );
};

export default GameBox;
