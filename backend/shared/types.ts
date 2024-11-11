import { BOX_TYPES } from "./constants";
import { GameEvents } from "./constants";

export interface BasePlayer {
  id: string;
  walletAddress: string;
  name: string;
  wealth: number;
  color: string;
}

export interface ServerPlayerData extends BasePlayer {
  currentIndex: number,
  ownedProperties: Property[];
  isInJail?: boolean;
  getOutOfJailFree: number;
  lastDiceValue: number;
}

export interface ClientPlayerData extends BasePlayer {
  currentIndex: number;
  ownedProperties: Property[];
  playerTurn: number;
  lastTurnBlockID: string | null;
  lastDiceValue: number;
  getOutOfJailFree: number;
  balance: number;
  isInJail?: boolean;
}

export interface Property {
  id: number;
  name: string;
  owner: string | null;
  color: string; 
  price: number;
  groupNumber?: number; 
  rent: number;
  imageName?: string;
  rentLevel?: number;
}

export interface GameState {
  players: ClientPlayerData[];
  properties: Property[];
  currentPlayer: ClientPlayerData | null;
}

export type BoxType = keyof typeof BOX_TYPES;

export interface GameBoardSpace {
  name: string;
  type: BoxType
  pricetext?: string;
  color: string;
  price: number;
  groupNumber?: number;
  baserent?: number;
  rent1?: number;
  rent2?: number;
  rent3?: number;
  rent4?: number;
  rent5?: number;
  imageName?: string;
  index: number;
  currentPlayer?: ServerPlayerData | null;
  propertyData?: Property;
}

export interface DiceRoll {
  one: number;
  two: number;
  total: number;
}

export interface GameAction {
  type: GameEvents;
  playerId: string;
  data?: any;
}