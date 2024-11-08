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
  public lastDiceValue: number = 0;

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
      this.gameState = {
        ...state,
        players: state.players.map(player => this.convertToClientPlayerData(player))
      };
      this.updatePlayers(this.gameState.players as ClientPlayerData[]);
    });

    this.socket.on('gameBoardData', (data: GameBoardSpace[]) => {
      this.boardData = data;  
    });

    // this.socket.on('diceRolled', ({ playerName, roll, currentIndex }) => {
    //   const currentPlayer = this.players.find(player => player.name === playerName);
    
    //   if (currentPlayer) {
    //     // Update the local game state
    //     currentPlayer.lastDiceValue = roll;
    //     currentPlayer.currentIndex = currentIndex;
    
    //     // Emit an event to update the dice values in the UI
    //     this.emitDiceRoll(Math.floor(roll / 2), roll % 6 || 6);
    
    //     // Emit the updated player position
    //     this.emitPlayerPosition(currentPlayer.id, currentIndex);
    //   }
    // });
    

    // this.socket.on('rejoinGame', (player: ServerPlayerData) => {
    //   this.addLog(`${player.name} has rejoined the game`);
    //   this.players.add(this.convertToClientPlayerData(player));
    //   this.gameState = { ...this.gameState, players: this.players.getArray()}
    // })

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

 
  // private emitDiceRoll(dieOne: number, dieTwo: number) {
  //   // Emit to React component via socket or some other event system
  //   this.lastDiceValue = dieOne + dieTwo;
  //   this.socket.emit('updateDiceValues', { dieOne, dieTwo });
  //   this.notifySubscribers();
  // }

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
  private updatePlayers(players: ClientPlayerData[]): void {
    this.players = new Cycled<ClientPlayerData>(players); // Specify type argument here
  }
  
 // Updated joinGame to send both name and color as the server expects
 public joinGame(name: string, color: string, walletAddress: string): void {
  this.socket.emit('joinGame', { name, color, walletAddress });

  this.socket.on('gameBoardData', (data: GameBoardSpace[]) => {
    this.boardData = data;
    this.playerPositions = {}; // Initialize player positions
  });

  this.socket.on('gameState', (state: GameState) => {
    this.gameState = {
      ...state,
      players: state.players.map(player => this.convertToClientPlayerData(player)),
    };
    this.updatePlayers(this.gameState.players as ClientPlayerData[]);
    this.playerPositions = {}; // Initialize player positions
    state.players.forEach((player, index) => {
      this.playerPositions[player.id] = player.currentIndex;
    });
  });


  this.socket.on('error', (message: string) => {
    console.error(`Error: ${message}`);
    this.addLog(`Error: ${message}`);
  });
}

public rollDice(): void {
  const currentPlayer = this.players.current();
  if (!currentPlayer) return;

  this.socket.emit('rollDice');

  this.socket.once('diceRolled', ({ playerName, roll, currentIndex }) => {
    if (playerName === currentPlayer.name) {
      // Update the local game state

      

      

     
      this.emitPlayerPosition(currentPlayer.name, currentIndex);
      this.toggleCurrentTurn();

      console.log("lastDiceValue:", currentPlayer.lastDiceValue, roll, currentPlayer.name, currentPlayer.currentIndex);
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

  getGameState(): GameState {
    return {
      players: this.players.getArray().map(player => this.convertToClientPlayerData(player)),
      properties: this.properties,
      currentPlayer: this.players.current() ? this.convertToClientPlayerData(this.players.current()!) : null
    };
  }




  private handleLandedSpace(player: ClientPlayerData, space: GameBoardSpace): void {
    switch (space.type) {
      case 'CHANCE':
        this.addLog(`${player.name} landed on Chance`);
        this.drawCard('CHANCE');
        break;
      case 'COMMUNITY':
        this.addLog(`${player.name} landed on Community Chest`);
        this.drawCard('COMMUNITY');
        break;
      case 'INCOME':
        player.balance -= 200;
        this.addLog(`${player.name} paid $200 income tax`);
        break;
      case 'LUXURY':
        player.balance -= 100;
        this.addLog(`${player.name} paid $100 luxury tax`);
        break;
      case 'JAIL':
        this.addLog(`${player.name} is just visiting jail`);
        break;
      // Add more cases as needed
    }
    this.emitGameState();
  }


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

  // private handlePlayerTurn(): void {
  //   const currentPlayer = this.players.current();
  //   if (currentPlayer) {
  //     // Calculate new position using lastDiceValue
  //     const newPosition = currentPlayer.currentIndex + currentPlayer.lastDiceValue;

  //     // Update the position, handling board wrap-around and Go bonus
  //     if (newPosition >= 40) {
  //       currentPlayer.currentIndex = newPosition - 40; // Wrap around the board
  //       currentPlayer.balance += 200; // Collect $200 for passing Go
  //       this.addLog(`${currentPlayer.name} passed Go and collected $200`);
  //     } else {
  //       currentPlayer.currentIndex = newPosition;
  //     }

  //     // Update players array and advance the turn
  //     this.updatePlayers(this.players.getArray());
  //     this.emitPlayerPosition(currentPlayer.id, currentPlayer.currentIndex);
  //     this.toggleCurrentTurn(); // Move to next player
  //   }
  // }

  public get currentPlayer(): ClientPlayerData | null {
    return this.players.current() ?? null;
  }

  public emitPlayerPosition(playerId: string, position: number): void {
    this.playerPositions[playerId] = position;
    this.notifySubscribers();
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