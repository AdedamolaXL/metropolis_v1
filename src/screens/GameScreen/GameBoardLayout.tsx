/* eslint-disable @typescript-eslint/no-explicit-any */
import data from "../../../backend/shared/data/gameBlocks.json";
import { SquareType } from "../../../backend/shared/constants";
import { GameBox } from "../../components";
import { BOX_TYPES } from "../../../backend/shared/constants";
import die1 from "../../assets/Die_1.png";
import die2 from "../../assets/Die_2.png";
import die3 from "../../assets/Die_3.png";
import die4 from "../../assets/Die_4.png";
import die5 from "../../assets/Die_5.png";
import die6 from "../../assets/Die_6.png";
import { monopolyInstance } from "../../models/Monopoly";
import { GameBoardSpace, BoxType, ClientPlayerData } from '../../../backend/shared/types';
import { showToast } from "../../utilities";

// Interface for the raw data from gameBlocks.json
interface RawBoxElement {
  name: string;
  pricetext?: string;
  price?: string | number;
  color?: string;
  groupNumber?: string | number;
  baserent?: string | number;
  rent1?: string | number;
  rent2?: string | number;
  rent3?: string | number;
  rent4?: string | number;
  rent5?: string | number;
  imageName?: string;
}

// processed box element for gameBlocks
interface BoxElement {
  name: string;
  pricetext?: string;
  price?: number;
  color?: string;
  groupNumber?: number;
  baserent?: number;
  rent1?: number;
  rent2?: number;
  rent3?: number;
  rent4?: number;
  rent5?: number;
  imageName?: string;
}

interface GameBoardLayoutProps {
  players: ClientPlayerData[];
  onDiceRoll: () => void;
  diceValues: { one: number; two: number };
  toggleLogs: () => void;
  showLogs: boolean;
  gameStatus: boolean;
  currentPlayer: ClientPlayerData;
  toggleCurrentTurn: () => void;
  removePlayerFromGame: (id: string) => void;
}


const convertToNumber = (value: string | number | undefined): number | undefined => {
  if (typeof value === 'undefined') return undefined;
  if (typeof value === 'number') return value;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? undefined : parsed;
};

const processBoxElement = (element: RawBoxElement): BoxElement => {
  return {
    ...element,
    price: convertToNumber(element.price),
    groupNumber: convertToNumber(element.groupNumber),
    baserent: convertToNumber(element.baserent),
    rent1: convertToNumber(element.rent1),
    rent2: convertToNumber(element.rent2),
    rent3: convertToNumber(element.rent3),
    rent4: convertToNumber(element.rent4),
    rent5: convertToNumber(element.rent5),
  };
};

export const GameBoardLayout: React.FC<GameBoardLayoutProps> = (props) => {
  const {
    onDiceRoll,
    diceValues,
    toggleLogs,
    showLogs,
    gameStatus,
    currentPlayer,
    players,
    toggleCurrentTurn,
    removePlayerFromGame
  } = props;

  const handleRemovePlayer = (id: string) => {
    // Call removePlayerFromGame prop function to update player state
    removePlayerFromGame(id);

     // Find the player object from the players array using the ID
  const playerToRemove = players.find(player => player.id === id);
  if (playerToRemove) {
    monopolyInstance.removePlayer(id);  // Assuming monopolyInstance has removePlayer functionality
    showToast(`${playerToRemove.name} has been removed from the game`, 3000);
  }
  };

  const getGameBottomSide = () => (data as RawBoxElement[]).slice(0, 11).reverse();

  const getGameLeftSide = () => [...(data as RawBoxElement[]).slice(11, 20).reverse()];

  const getGameRightSide = () => (data as RawBoxElement[]).slice(31, 40);

  const getGameTopSide = () => (data as RawBoxElement[]).slice(20, 31).reverse();

  
  
  const getBoxType = (rawElement: RawBoxElement): GameBoardSpace => {
    const boxElement = processBoxElement(rawElement);
    const { 
      name, 
      pricetext, 
      price = 0, 
      color = "#ffffff", 
      groupNumber = 0,
      baserent,
      rent1,
      rent2,
      rent3,
      rent4,
      rent5,
      imageName
    } = boxElement;
    
    const nameInLowerCase = name.toLowerCase();
    
    const baseSpace: GameBoardSpace = {
      name,
      color,
      groupNumber,
      type: BOX_TYPES.AVENUE as BoxType,
      pricetext,
      price,
      baserent,
      rent1,
      rent2,
      rent3,
      rent4,
      rent5,
      imageName
    };
    
    if (nameInLowerCase === "go") {
      return { ...baseSpace, type: BOX_TYPES.GO as BoxType, price: 200 };
    } else if (nameInLowerCase.includes("tax")) {
      return { ...baseSpace, type: BOX_TYPES.TAX as BoxType, price: parseInt(pricetext?.replace(/^\D+/g, "") || "0") };
    } else if (nameInLowerCase === "just visiting") {
      return { ...baseSpace, type: BOX_TYPES.JAIL as BoxType };
    } else if (nameInLowerCase === "free parking") {
      return { ...baseSpace, type: BOX_TYPES.PARKING as BoxType };
    } else if (nameInLowerCase === "chance") {
      return { ...baseSpace, type: BOX_TYPES.CHANCE as BoxType };
    } else if (nameInLowerCase === "community chest") {
      return { ...baseSpace, type: BOX_TYPES.COMMUNITY as BoxType };
    } else if (nameInLowerCase === "go to jail") {
      return { ...baseSpace, type: BOX_TYPES.JAIL as BoxType };
    } else if (nameInLowerCase.includes("railroad")) {
      return { ...baseSpace, type: BOX_TYPES.RAILROADS as BoxType };
    } else if (typeof price === "number") {
      return { ...baseSpace, type: BOX_TYPES.AVENUE as BoxType };
    }

    // Fallback case to ensure we always return a valid GameBoardSpace
    return {
      ...baseSpace,
      // type: BOX_TYPES.AVENUE as BoxType
    }
  };
  
  const getDiceImage = (diceValue: number) => {
    if (diceValue === 1) return die1;
    if (diceValue === 2) return die2;
    if (diceValue === 3) return die3;
    if (diceValue === 4) return die4;
    if (diceValue === 5) return die5;
    if (diceValue === 6) return die6;
  };

  return (
    <div className="mainSquare">
         {/* Top row */}
         <div className="row top">
        {getGameTopSide().map((element, index) => (
          <GameBox
            type={index === 0 || index === 10 ? SquareType.CORNER : SquareType.VERTICAL}
            id={20 + index + 1}
            key={index}
            boxType={getBoxType(element)}
            players={players}
            currentPlayer={currentPlayer}
            toggleCurrentTurn={toggleCurrentTurn}
            baserent={convertToNumber(element.baserent) || 0}
            name={element.name}
            rent1={convertToNumber(element.rent1)}
            rent2={convertToNumber(element.rent2)}
            rent3={convertToNumber(element.rent3)}
            rent4={convertToNumber(element.rent4)}
            rent5={convertToNumber(element.rent5)}
          />
        ))}
      </div>


       <div className="row center">
      <div className="corner-square">
        {getGameLeftSide().map((element, index) => (
          <GameBox
            type={index === 0 || index === 10 ? SquareType.CORNER : SquareType.VERTICAL}
            id={20 + index + 1}
            key={index}
            boxType={getBoxType(element)}
            players={players}
            currentPlayer={currentPlayer}
            toggleCurrentTurn={toggleCurrentTurn}
            baserent={convertToNumber(element.baserent) || 0}
            name={element.name}
            rent1={convertToNumber(element.rent1)}
            rent2={convertToNumber(element.rent2)}
            rent3={convertToNumber(element.rent3)}
            rent4={convertToNumber(element.rent4)}
            rent5={convertToNumber(element.rent5)}
          />
        ))}
      </div>

      
        <div className="center-square">
          <div className="center-square-container">
          <div className="balance-wrap">
  <div className="player-balance"><b>Balances</b></div>
  <button onClick={() => handleRemovePlayer(currentPlayer.id)}>Remove Current Player</button>
  {[...props.players].map(({ balance, color, name }, index) => (
    <div className="player-balance" key={index}>
      <div style={{ border: `2px solid ${color}` }} className="player-balance-item">
        <span>
          {name}: ${balance}
          {index === 0 ? <span style={{ color: "red" }}>*</span> : ""}
        </span>
      </div>
    </div>
  ))}
</div>


<div className="dices">
          {getDiceImage(diceValues.one) && <img src={getDiceImage(diceValues.one)} alt="Dice 1" />}
          {getDiceImage(diceValues.two) && <img src={getDiceImage(diceValues.two)} alt="Dice 2" />}
        </div>


           {showLogs && (
          <div className="logs">
            <button onClick={toggleLogs}>✗</button>
            <ul>{monopolyInstance.logs.map((log, i) => <li key={i}>{log}</li>)}</ul>
          </div>
        )}


            <div style={{ marginTop: "3rem" }}>
              {gameStatus ? (
                <button
                  type="button"
                  onClick={onDiceRoll}
                  className="roll-dice-1"
                >
                  Roll Dices
                </button>
              ) : (
                <div className="game-over">
                  Game Over {currentPlayer.name} Wins{" "}
                </div>
              )}

              <button type="button" onClick={toggleLogs} className="show-logs">
                {showLogs ? "Hide" : "Show"} Logs
              </button>
            </div>
          </div>
        </div>


          <div className="corner-square">
        {getGameRightSide().map((element, index) => (
          <GameBox
            type={index === 0 || index === 10 ? SquareType.CORNER : SquareType.VERTICAL}
            id={20 + index + 1}
            key={index}
            boxType={getBoxType(element)}
            players={players}
            currentPlayer={currentPlayer}
            toggleCurrentTurn={toggleCurrentTurn}
            baserent={convertToNumber(element.baserent) || 0}
            name={element.name}
            rent1={convertToNumber(element.rent1)}
            rent2={convertToNumber(element.rent2)}
            rent3={convertToNumber(element.rent3)}
            rent4={convertToNumber(element.rent4)}
            rent5={convertToNumber(element.rent5)}
          />
        ))}
      </div>
    </div>


      {/* Bottom row */}
    <div className="row bottom">
      {getGameBottomSide().map((element, index) => (
        <GameBox
        type={index === 0 || index === 10 ? SquareType.CORNER : SquareType.VERTICAL}
        id={20 + index + 1}
        key={index}
        boxType={getBoxType(element)}
        players={players}
        currentPlayer={currentPlayer}
        toggleCurrentTurn={toggleCurrentTurn}
        baserent={convertToNumber(element.baserent) || 0}
        name={element.name}
        rent1={convertToNumber(element.rent1)}
        rent2={convertToNumber(element.rent2)}
        rent3={convertToNumber(element.rent3)}
        rent4={convertToNumber(element.rent4)}
        rent5={convertToNumber(element.rent5)}
      />
      ))}
    </div>
  </div>
  );
};
