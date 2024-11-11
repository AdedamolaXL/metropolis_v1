import { ClientPlayerData, ServerPlayerData, GameState, GameBoardSpace, Property } from '../../backend/shared/types'; 
import { Cycled } from '../../backend/utilities/cycled';
import { io, Socket} from 'socket.io-client';
import communityCards from '../../backend/shared/data/communityCards.json'
import chanceCards from '../../backend/shared/data/chanceCards.json'

interface Card {
  id: string;
  text: string;
}



class Monopoly {
  public socket: Socket;
  public players: Cycled<ClientPlayerData>;
  public gameState: GameState;
  public boardData: GameBoardSpace[] = [];
  public communityCards: Card[];
  public chanceCards: Card[];
  public logs: string[] = [];
  public removedPlayers: ClientPlayerData[] = [];
  private subscribers: (() => void)[] = [];
  public playerPositions: Record<string, number> = {};
  public properties: Property[];
  
  // public get lastDiceValue(): number {
  //   return this.gameState.currentPlayer?.lastDiceValue ?? 0;
  // }
  
  // public get currentPlayerName(): string {
  //   return this.gameState.currentPlayer?.name;
  // }

  private _currentPlayerId: string | null = null;
  

  constructor() {
    this.socket = io('http://localhost:4000', {
      withCredentials: true,
      extraHeaders: {
        "my-custom-header": "abcd"
      }
    });
    this.players = new Cycled<ClientPlayerData>([]);
    this.communityCards = communityCards.map(card => ({ id: card.id, text: card.text}));
    this.chanceCards = chanceCards.map(card => ({ id: card.id, text: card.text }));
    this.setupSocketListeners();
    this.playerPositions = {};
    this.properties = [];
    this.gameState = {
      players: [],
      properties: [],
      currentPlayer: {
        id: '',
        walletAddress: '',
        name: '',
        wealth: 0,
        color: '',
        currentIndex: 0,
        ownedProperties: [],
        playerTurn: 0,
        lastTurnBlockID: null,
        lastDiceValue: 0,
        balance: 0,
        getOutOfJailFree: 0
      }
    };

  }

  

  private setupSocketListeners() {
    
    this.socket.on('gameState', (state: GameState) => {
      console.log('Received new game state:', state);
      
      // First update the local game state
      this.gameState = {
        ...state,
        players: state.players.map(player => this.convertToClientPlayerData(player))
      };

      this._currentPlayerId = this.gameState.currentPlayer?.id || null;
      
      // Then update players
      this.updatePlayers(this.gameState.players as ClientPlayerData[]);
      
       // Synchronize the cycled array with current player
       if (this._currentPlayerId) {
        const currentPlayerIndex = this.players.getArray().findIndex(
          player => player.id === this._currentPlayerId
        );
        if (currentPlayerIndex !== -1) {
          this.players.index = currentPlayerIndex;
        }
      }

      // Verify synchronization
      const syncCheck = {
        gameStatePlayer: this.gameState.currentPlayer?.name,
        currentPlayer: this.currentPlayer?.name,
        currentPlayerId: this._currentPlayerId
      };
      console.log('Synchronization check:', syncCheck);
      
      this.notifySubscribers();
    });

    this.socket.on('gameBoardData', (data: GameBoardSpace[]) => {
      this.boardData = data;  
      console.log("Board Data updated:", this.boardData);
      this.notifySubscribers();
    });

    // Update properties
    this.socket.on('updateProperties', (properties: Property[]) => {
      this.properties = properties;
      console.log('Updated properties:', this.properties);
      this.notifySubscribers();
    });

      this.socket.on('updatePlayers', (players: ServerPlayerData[]) => {
      const updatedPlayers = players.map(this.convertToClientPlayerData);
      this.updatePlayers(updatedPlayers);
      console.log('Updated players:', updatedPlayers);
      console.log('Updated playerPositions:', this.playerPositions);
      this.notifySubscribers();
    });

    // this.socket.on('gameState', (gameState) => {
    //   console.log('Updated game state:', gameState);
    //   console.log("Checking if it's the correct player's turn...");
    // console.log("Current Player:", this.gameState.currentPlayer?.name);
    // console.log("Attempting Player:", this.currentPlayer?.name);

    // if (this.gameState.currentPlayer?.name !== this.currentPlayer?.name) {
    //   console.log("It's not your turn!");
    //   return;
    // }

    // console.log("It's your turn, proceed with action...");
    // });

    this.socket.on('gameState', (state: GameState) => {
      const updatedPlayers = state.players.map(player => this.convertToClientPlayerData(player));
      this.gameState = {
        ...state,
        players: updatedPlayers
      };
      this.updatePlayers(updatedPlayers);
      this.notifySubscribers();
    });
    
    

    this.socket.on('diceRolled', ({ playerName, roll, currentIndex }) => {
      const currentPlayer = this.players.find(player => player.name === playerName);
      if (currentPlayer) {
        currentPlayer.lastDiceValue = roll;
        currentPlayer.currentIndex = currentIndex;
        
        this.playerPositions[currentPlayer.id] = currentIndex;
        console.log("Dice rolled:", roll, "Current index:", currentIndex);
        console.log("Updated playerPositions:", this.playerPositions);
        this.notifySubscribers();
      }
    });

    // Listen for turn changes from the server
    this.socket.on('turnChanged', (nextPlayerId: string) => {
      console.log('Turn changed event received for player:', nextPlayerId);
      this._currentPlayerId = nextPlayerId;
      this.setNextPlayer(nextPlayerId);
      this.addLog(`It's now ${this.currentPlayer?.name}'s turn.`);
      this.notifySubscribers();
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

  public subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback());
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
  private updatePlayerPositions(players: ClientPlayerData[]) {
    // Clear existing positions
    this.playerPositions = {};
    
    // Map using player names instead of IDs
    players.forEach(player => {
      if (player.name) {
        this.playerPositions[player.name] = player.currentIndex;
      }
    });
    console.log('Updated playerPositions:', this.playerPositions);
  }

  private updatePlayers(players: ClientPlayerData[]): void {
    console.log('Updating players:', players);
    this.players = new Cycled<ClientPlayerData>(players);
    this.updatePlayerPositions(players);
    
    // Maintain current player synchronization
    if (this._currentPlayerId) {
      const currentPlayerIndex = players.findIndex(
        player => player.id === this._currentPlayerId
      );
      if (currentPlayerIndex !== -1) {
        this.players.index = currentPlayerIndex;
      }
    }
  }

  
 // Updated joinGame to send both name and color as the server expects
//  public joinGame(name: string, color: string, walletAddress: string): void {
//   this.socket.emit('joinGame', { name, color, walletAddress });

//   this.socket.on('gameBoardData', (data: GameBoardSpace[]) => {
//     this.boardData = data;
//     this.playerPositions = {}; // Initialize player positions
//   });

//   this.socket.on('gameState', (state: GameState) => {
//     this.gameState = {
//       ...state,
//       players: state.players.map(player => this.convertToClientPlayerData(player)),
//     };
//     this.updatePlayers(this.gameState.players as ClientPlayerData[]);
//     this.playerPositions = {}; // Initialize player positions
//     state.players.forEach((player, index) => {
//       this.playerPositions[player.id] = player.currentIndex;
//     });
//   });

//   this.socket.on('error', (message: string) => {
//     console.error(`Error: ${message}`);
//     this.addLog(`Error: ${message}`);
//   });
// }


public joinGame(name: string, color: string, walletAddress: string): void {
  this.socket.emit('joinGame', { name, color, walletAddress });
  
  this.socket.on('gameState', (state: GameState) => {
    const updatedPlayers = state.players.map(player => this.convertToClientPlayerData(player));
    this.gameState = {
      ...state,
      players: updatedPlayers,
    };
    this.updatePlayers(updatedPlayers);
    this.notifySubscribers();
  });
}




public rollDice(): void {
  // Get current state snapshot
  const stateSnapshot = {
    gameStatePlayer: this.gameState.currentPlayer,
    currentPlayer: this.currentPlayer,
    currentPlayerId: this._currentPlayerId
  };
  
  console.log('State snapshot before roll:', stateSnapshot);

  const currentPlayer = this.currentPlayer;
  if (!currentPlayer) {
    console.log('No current player found');
    return;
  }

  // Check if it's the player's turn using currentPlayerId
  if (this._currentPlayerId !== currentPlayer.id) {
    console.log('Turn validation failed:');
    console.log('Expected player ID:', this._currentPlayerId);
    console.log('Attempting player ID:', currentPlayer.id);
    console.log('Expected player name:', this.gameState.currentPlayer?.name);
    console.log('Attempting player name:', currentPlayer.name);
    return;
  }

  console.log('Rolling dice for player:', currentPlayer.name);
  this.socket.emit('rollDice');
  
  this.socket.once('diceRolled', ({ playerName, roll, currentIndex }) => {
    console.log('Dice rolled event received:', { playerName, roll, currentIndex });
    if (playerName === currentPlayer.name) {
      currentPlayer.lastDiceValue = roll;
      currentPlayer.currentIndex = currentIndex;
      this.emitPlayerPosition(currentPlayer.id, currentIndex);
      console.log("Dice roll completed for player:", playerName, "Roll:", roll, "Position:", currentIndex);
      this.notifySubscribers();
    }
  });
}

  private emitGameState() {
    this.socket.emit('gameState', {
      players: this.players.getArray(),
      playerPositions: this.playerPositions,
      logs: this.logs,
    });
  }

  // getGameState(): GameState {
  //   return {
  //     players: this.players.getArray().map(player => this.convertToClientPlayerData(player)),
  //     properties: this.properties,
  //     currentPlayer: this.players.current() ? this.convertToClientPlayerData(this.players.current()!) : null
  //   };
  // }

  // private handleLandedSpace(player: ClientPlayerData, space: GameBoardSpace): void {
  //   switch (space.type) {
  //     case 'CHANCE':
  //       this.addLog(`${player.name} landed on Chance`);
  //       this.drawCard('CHANCE');
  //       break;
  //     case 'COMMUNITY':
  //       this.addLog(`${player.name} landed on Community Chest`);
  //       this.drawCard('COMMUNITY');
  //       break;
  //     case 'INCOME':
  //       player.balance -= 200;
  //       this.addLog(`${player.name} paid $200 income tax`);
  //       break;
  //     case 'LUXURY':
  //       player.balance -= 100;
  //       this.addLog(`${player.name} paid $100 luxury tax`);
  //       break;
  //     case 'JAIL':
  //       this.addLog(`${player.name} is just visiting jail`);
  //       break;
  //     // Add more cases as needed
  //   }
  //   this.emitGameState();
  // }



  public nextTurn(): void {
    const previousPlayer = this.players.current();
    const nextPlayer = this.players.next();
    
    if (previousPlayer && nextPlayer) {
      this.addLog(`Turn ended for ${previousPlayer.name}. ${nextPlayer.name}'s turn begins.`);
      
      // Emit turn change to server
      this.socket.emit('turnChanged', nextPlayer.id);
      
      // Update local game state
      this.updatePlayers(this.players.getArray());
    }
  }

  private setNextPlayer(nextPlayerId: string): void {
    console.log('Setting next player:', nextPlayerId);
    this._currentPlayerId = nextPlayerId;
    
    const nextPlayerIndex = this.players.indexOf(
      this.players.find(player => player.id === nextPlayerId)!
    );
    
    if (nextPlayerIndex >= 0) {
      console.log('Found next player at index:', nextPlayerIndex);
      this.players.index = nextPlayerIndex;
      this.addLog(`Turn changed to ${this.players.current()?.name}`);
      this.notifySubscribers();
    } else {
      console.log('Next player not found in players array');
  }
}


  public buyProperty(propertyId: number): void {
    this.socket.emit('buyProperty', propertyId);
    console.log('Attempting to buy property with ID:', propertyId);
  }

  public drawCard(cardType: 'CHANCE' | 'COMMUNITY'): void {
    this.socket.emit('drawCard', cardType);
  }

  // New rentProperty method
  public rentProperty(property: GameBoardSpace): void {
    this.socket.emit('rentProperty', this.boardData.indexOf(property));
  }

  public get currentPlayer(): ClientPlayerData | null {
    if (!this._currentPlayerId) return null;
    return this.players.find(player => player.id === this._currentPlayerId) || this.players.current() || null;
  }
  public emitPlayerPosition(playerId: string, position: number): void {
    const player = this.players.find(p => p.id === playerId);
    if (player && player.name) {
      this.playerPositions[player.name] = position; // Use name instead of ID
      this.notifySubscribers();
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