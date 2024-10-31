import { ClientPlayerData, ServerPlayerData, GameState, GameBoardSpace } from '../../backend/shared/types'; 
import { Cycled } from '../../backend/utilities/cycled';
import { io, Socket} from 'socket.io-client';
import communityCards from '../../backend/shared/data/communityCards.json'
import chanceCards from '../../backend/shared/data/chanceCards.json'

interface Card {
  id: string;
  text: string;
}



class Monopoly {
  private socket: Socket;
  public players: Cycled<ClientPlayerData>;
  public gameState: GameState | null = null;
  public boardData: GameBoardSpace[] = [];
  public communityCards: Card[];
  public chanceCards: Card[];
  public logs: string[] = [];
  public removedPlayers: ClientPlayerData[] = [];

  constructor() {
    this.socket = io('http://localhost:4000');
    this.players = new Cycled<ClientPlayerData>([]);
    this.communityCards = communityCards.map(card => ({ id: card.id, text: card.text}));
    this.chanceCards = chanceCards.map(card => ({ id: card.id, text: card.text }));
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on('gameState', (state: GameState) => {
      this.gameState = {
        ...state,
        players: state.players.map(player => this.convertToClientPlayerData(player))
      };
      this.updatePlayers(this.gameState.players as ClientPlayerData[]);
    });

    this.socket.on('gameBoardData', (data: GameBoardSpace[]) => {
      this.boardData = data;  
    });

     // Error handling for socket events
     this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.addLog('Failed to connect to the server.');
    });

    this.socket.on('disconnect', () => {
      console.warn('Disconnected from server');
      this.addLog('Disconnected from the server. Please reconnect.');
    });

  }

 

  private convertToClientPlayerData(player: ServerPlayerData): ClientPlayerData {
    return {
      ...player,
      playerTurn: 0,
      lastTurnBlockID: null,
      lastDiceValue: 0,
      balance: player.wealth,
      ownedProperties: player.ownedProperties
    }
  }
  private updatePlayers(players: ClientPlayerData[]): void {
    this.players = new Cycled<ClientPlayerData>(players); // Specify type argument here
  }
  
 // Updated joinGame to send both name and color as the server expects
 public joinGame(name: string, color: string): void {
  this.socket.emit('joinGame', { name, color });
}

  public rollDice(): void {
    const one = Math.floor(Math.random() * 6) + 1;
    const two = Math.floor(Math.random() * 6) + 1;
  
    this.socket.emit('rollDice', { one, two });
    this.handlePlayerTurn(one, two);
  }

  public buyProperty(property: GameBoardSpace): void {
    this.socket.emit('buyProperty', property.name);
  }

  public drawCard(cardType: 'CHANCE' | 'COMMUNITY'): void {
    this.socket.emit('drawCard', cardType);
  }

  // New rentProperty method
  public rentProperty(property: GameBoardSpace): void {
    this.socket.emit('rentProperty', this.boardData.indexOf(property));
  }

  private handlePlayerTurn(one: number, two: number): void {
    const currentPlayer = this.players.current();
    if (currentPlayer) {
      const playerIndex = currentPlayer.currentIndex + one + two;
      currentPlayer.currentIndex = playerIndex > 40 ? playerIndex - 40 : playerIndex;

      if (playerIndex > 40) {
        currentPlayer.balance += 200;
        this.addLog(`${currentPlayer.name} passed Go and collected $200`);
      }
      
      // Update player turn and additional game logic can be added here
      this.toggleCurrentTurn();
    }
  }
  public removePlayer(playerId: string): void {
    const playerToRemove = this.players.find(player => player.id === playerId);
    if (playerToRemove) {
      const removedPlayer = this.players.remove(playerToRemove);
      if (removedPlayer) {
        this.removedPlayers.push(removedPlayer);
        this.addLog(`${removedPlayer.name} has been removed from the game.`);
        this.socket.emit('gameState', { players: this.players.getArray(), logs: this.logs });
      }
    }
}

  
  
  


  public addLog(message: string) {
    this.logs.push(message);
  }

  public toggleCurrentTurn() {
    this.players.next();
    this.addLog('Turn changed to the next player');
  }
}

const monopolyInstance = new Monopoly();

export { monopolyInstance };