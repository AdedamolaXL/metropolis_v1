import { Player, Property, GameState } from './types';
import { COLORS, GAME_SETTINGS } from './shared/Constants'

export class GameManager {
  private players: Player[] = [];
  private properties: Property[] = [];
  private currentPlayerIndex: number = 0;


  // constructor properties() {
    
  // }

  addPlayer(name: string): Player {
    if (this.players.length >= GAME_SETTINGS.MAX_PLAYERS) {
      throw new Error('Maximum number of players reacched');
    }
    const newPlayer: Player = {
      id: this.players.length.toString(),
      name,
      wealth: 1500,
      color: COLORS[this.players.length]
    };
    this.players.push(newPlayer);
    return newPlayer;
  }

  getGameState(): GameState {
    return {
      players: this.players,
      properties: this.properties,
      currentPlayer: this.players[this.currentPlayerIndex]
    };
  }

  nextTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
  }

}