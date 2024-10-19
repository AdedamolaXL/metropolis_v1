export interface Player {
  id: string;
  name: string;
  wealth: number;
  color: string;
}

export interface Property {
  id: number;
  name: string;
  price: number;
  owner: string | null;
  rent: number;
}

export interface GameState {
  players: Player[];
  properties: Property[];
  currentPlayer: Player | null;
}