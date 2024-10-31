/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { BOX_TYPES, CARDS } from "../../../backend/shared/constants"
import { ClientPlayerData, GameBoardSpace, Property } from '../../../backend/shared/types'
import { showToast, curry } from '../../utilities'
import { monopolyInstance } from '../../models/Monopoly'
import { ActionPopup } from './ActionPopup'
import { GoBox, AvenueBox, SpecialBox } from './BoxTypes'
import './gameBox.scss'

interface GameBoxProps {
  type: string;
  name: string;
  id: number;
  players: ClientPlayerData[];
  currentPlayer: ClientPlayerData;
  toggleCurrentTurn: () => void;
  baserent: number;
  boxType: GameBoardSpace;
  rent1?: number;
  rent2?: number;
  rent3?: number;
  rent4?: number;
  rent5?: number;
}

export const GameBox: React.FC<GameBoxProps> = (props) => {
  const {
    type,
    name,
    id,
    players,
    currentPlayer,
    toggleCurrentTurn,
    baserent,
    boxType,
    rent1,
    rent2,
    rent3,
    rent4,
    rent5
  } = props;

  const [playerAction, setPlayerAction] = useState<'Buy' | 'Rent' | null>(null);

  console.log("boxType:", boxType.price);


  const getPropertyOwner = () => {
    return players.find((player) =>
      player.ownedProperties.some((property) => property.name === name)
    );
  };

  const getCurrentRentForProperty = () => {
    const currentOwner = getPropertyOwner();
    if (!currentOwner) return 0;

    const propertyDetails = currentOwner.ownedProperties.find((property: Property) => property.name === name);
    switch (propertyDetails?.rentLevel) {
      case 1:
        return rent1 || baserent;
      case 2:
        return rent2 || baserent;
      case 3:
        return rent3 || baserent;
      case 4:
        return rent4 || baserent;
      case 5:
        return rent5 || baserent;
      default:
        return baserent;
    }
  };

  const rentProperty = () => {
    const currentOwner = getPropertyOwner();
    if (!currentOwner) return;

    const currentRent = getCurrentRentForProperty();
    currentPlayer.balance -= currentRent;
    currentOwner.balance += currentRent;

    const message = `${currentPlayer.name} rented ${name} at $${currentRent} from ${currentOwner.name}`;
    showToast(message);
    monopolyInstance.logs.push(`Transaction - ${message}`);
    setPlayerAction(null);
    toggleCurrentTurn();
  };

  const buyProperty = () => {
    currentPlayer.ownedProperties.push({
      id,
      name,
      rent: baserent,
      owner: currentPlayer.id,
      color: boxType.color,
      price: boxType.price!,
      rentLevel: 0,
    });
    currentPlayer.balance -= boxType.price!;
    const message = `${currentPlayer.name} bought ${name} for $${boxType.price}`;
    showToast(message);
    monopolyInstance.logs.push(`Transaction - ${message}`);
    setPlayerAction(null);
    toggleCurrentTurn();
  };

  const handlePropertyTransaction = () => {
    if (playerAction === 'Buy') buyProperty();
    else if (playerAction === 'Rent') rentProperty();
  };

  const chanceAction = curry((action: string) => {
    const message = `${currentPlayer.name} - ${action}`;
    showToast(message);
    monopolyInstance.logs.push(`Chance Card Picked - ${message}`);

    switch (action) {
      case CARDS.CHANCE.GET_OUT_OF_JAIL_FREE:
        currentPlayer.getOutOfJailFree += 1;
        break;
      case CARDS.CHANCE.BANK_DIVIDEND:
        currentPlayer.balance += 50;
        break;
      case CARDS.CHANCE.PAY_POOR_TAX:
        currentPlayer.balance -= 15;
        break;
      // Additional cases...
      default:
        break;
    }
    toggleCurrentTurn();
  });

  const communityAction = curry((action: string) => {
    const message = `${currentPlayer.name} - ${action}`;
    showToast(message);
    monopolyInstance.logs.push(`Community Card Picked - ${message}`);

    switch (action) {
      case CARDS.COMMUNITY.GET_OUT_OF_JAIL_FREE:
        currentPlayer.getOutOfJailFree += 1;
        break;
      // Additional cases...
      default:
        break;
    }
    toggleCurrentTurn();
  });

  const getRandomElementFromArray = <T,>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  };

  useEffect(() => {
    if (currentPlayer && currentPlayer.currentIndex === id && currentPlayer.lastTurnBlockID !== id.toString())  {
      if (boxType.type === BOX_TYPES.COMMUNITY) {
        const communityCard = getRandomElementFromArray(monopolyInstance.communityCards);
        communityAction(communityCard);
        toggleCurrentTurn();
      } else if (boxType.type === BOX_TYPES.CHANCE) {
        const chanceCard = getRandomElementFromArray(monopolyInstance.chanceCards);
        chanceAction(chanceCard);
      } else if (boxType.type === BOX_TYPES.GO) {
        currentPlayer.balance += 200; // Passing Go bonus
      } else if (boxType.type === BOX_TYPES.JAIL) {
        if ('isInJail' in currentPlayer && currentPlayer.isInJail) {
          if (currentPlayer.getOutOfJailFree > 0) {
            currentPlayer.getOutOfJailFree -= 1;
            showToast(`${currentPlayer.name} used GET OUT OF JAIL FREE`);
          } else {
            currentPlayer.balance -= 50;
            showToast(`${currentPlayer.name} paid $50 to get out of Jail`);
          }
          currentPlayer.isInJail = false;
        }
      } else if (boxType.type === BOX_TYPES.TAX) {
        currentPlayer.balance -= boxType.price || 0;
        const message = `${currentPlayer.name} paid ${name} tax of $${boxType.price}`;
        showToast(message);
        monopolyInstance.logs.push(`Transaction - ${message}`);
      } else if (boxType.type === BOX_TYPES.RAILROADS || boxType.type === BOX_TYPES.UTILITIES) {
        handlePropertyTransaction();
      }
      toggleCurrentTurn();
    }
  }, [currentPlayer, boxType, id]);
  


  const getPopupContent = () => (
    <>
      <h5 className="popup-header">Please Choose Action</h5>
      <h6>
        Property
        {playerAction === 'Buy' ? ` Price : $${boxType.price}` : ` Rent : $${getCurrentRentForProperty()}`}
      </h6>
      <h6>Property Name: {name}</h6>
      <h6>Player Name: {currentPlayer.name}</h6>
      <button className="input" style={{ width: '100%', color: 'white', backgroundColor: 'green' }} onClick={handlePropertyTransaction}>
        {playerAction}
      </button>
    </>
  );

  return (
    <div className={type}>
      {boxType.type === BOX_TYPES.GO && <GoBox name={name} />}
      {boxType.type === BOX_TYPES.AVENUE && <AvenueBox {...props} />}
      {boxType.type === BOX_TYPES.CHANCE && <SpecialBox type={boxType.type} />}
      {boxType.type === BOX_TYPES.COMMUNITY && <SpecialBox type={boxType.type} />}
      {boxType.type === BOX_TYPES.RAILROADS && <SpecialBox {...props} type={boxType.type} />}
      {boxType.type === BOX_TYPES.TAX && <SpecialBox {...props} type={boxType.type} />}
      {boxType.type === BOX_TYPES.JAIL && <SpecialBox {...props} type={boxType.type} />}
      {boxType.type === BOX_TYPES.PARKING && <SpecialBox {...props} type={boxType.type} />}
      <div className="player-current-position">
        {[...players].filter(player => player.currentIndex === id).map(player => (
          <div key={player.id} style={{ backgroundColor: player.color }} className="player-box" />
        ))}
      </div>
      {/* <div className="main-box-text">{boxType.type}</div> */}
      {playerAction && <ActionPopup>{getPopupContent()}</ActionPopup>}
    </div>
  )
}
