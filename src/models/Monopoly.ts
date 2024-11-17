import { ClientPlayerData, ServerPlayerData, GameState, GameBoardSpace, Property } from '../../backend/shared/types'; 
import { Cycled } from '../../backend/utilities/cycled';
import { io, Socket} from 'socket.io-client';
import communityCards from '../../backend/shared/data/communityCards.json'
import chanceCards from '../../backend/shared/data/chanceCards.json'
import { faLessThanEqual } from '@fortawesome/free-solid-svg-icons';

interface Card {
  id: string;
  text: string;
}



class Monopoly {
  public socket: Socket;
  public players: Cycled<ClientPlayerData>;
  public gameState: GameState;
  private _boardData: GameBoardSpace[] = []; 
  public communityCards: Card[];
  public chanceCards: Card[];
  public logs: string[] = [];
  public removedPlayers: ClientPlayerData[] = [];
  private subscribers: (() => void)[] = [];
  public playerPositions: Record<string, number> = {};
  public properties: Property[];
  private _lastBoardUpdate: number = Date.now();
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
        playerTurn: false,
        lastTurnBlockID: null,
        lastDiceValue: 0,
        balance: 0,
        getOutOfJailFree: 0
      }
    };


    const storedBoardData = localStorage.getItem('boardData');
    if (storedBoardData) {
      this._boardData = JSON.parse(storedBoardData);
      console.log('Loaded initial board data from local storage:', this._boardData);
    } else {
      // If no stored data, request the initial board data from the server
      this.requestBoardUpdate();
    }

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
    
    // Force sync the cycled array with current player
    if (this._currentPlayerId) {
      const currentPlayerIndex = this.players.getArray().findIndex(
        player => player.id === this._currentPlayerId
      );
      if (currentPlayerIndex !== -1) {
        this.players.index = currentPlayerIndex;
        console.log('Cycled array synced to player index:', currentPlayerIndex);
      }
    }

      // Verify synchronization
      const syncCheck = {
        gameStatePlayer: this.gameState.currentPlayer?.name,
        currentPlayer: this.currentPlayer?.name,
        currentPlayerId: this._currentPlayerId,
        playersArray: this.players.getArray().map(p => ({ id: p.id, name: p.name }))
      };
      console.log('Synchronization check:', syncCheck);
      
      this.notifySubscribers();
    });

    this.socket.on('gameBoardData', (data: GameBoardSpace[]) => {
      console.log('Received initial board data:', data);
      if (Array.isArray(data) && data.length > 0) {
        this._boardData = [...data];
        this._lastBoardUpdate = Date.now();

        localStorage.setItem('boardData', JSON.stringify(this._boardData));

        this.notifySubscribers();
      }
    });

    this.socket.on('updateBoardData', (updatedData: Partial<GameBoardSpace>[]) => {
      console.log('Received updateBoardData:', updatedData);
      
      if (Array.isArray(updatedData) && updatedData.length > 0) {
        const updatedBoard = [...this._boardData];

        updatedData.forEach(update => {
          if (update.index !== undefined) {
            const index = updatedBoard.findIndex(space => space.index === update.index);
            if (index !== -1) {
              updatedBoard[index] = {
                ...updatedBoard[index],
                ...update
              };
              console.log(`Board space updated at index ${update.index}:`, updatedBoard[index]);
            }
          }
        });

        this._boardData = updatedBoard;
        this._lastBoardUpdate = Date.now();
        localStorage.setItem('boardData', JSON.stringify(this._boardData));
        this.notifySubscribers();
      }
    });
  
  
    

    // Update properties
    this.socket.on('updateProperties', (properties: Property[]) => {
      this.properties = properties;
      console.log('Updated properties:', this.properties);
      this.notifySubscribers();
    });

      this.socket.on('updatePlayers', (players: ServerPlayerData[]) => {
      const updatedPlayers = players.map(this.convertToClientPlayerData);
      
      // Create a new positions object
      const newPositions: Record<string, number> = {};
      updatedPlayers.forEach(player => {
        if (player.name) {
          newPositions[player.name] = player.currentIndex;
        }
      });
      
      // Update positions with new reference
      this.playerPositions = newPositions;
      
      this.updatePlayers(updatedPlayers);
      console.log('Updated players and positions:', {
        players: updatedPlayers,
        positions: this.playerPositions
      });
      this.notifySubscribers();
    });

    // this.socket.on('gameState', (state: GameState) => {
    //   const updatedPlayers = state.players.map(player => this.convertToClientPlayerData(player));
    //   this.gameState = {
    //     ...state,
    //     players: updatedPlayers
    //   };
    //   this.updatePlayers(updatedPlayers);
    //   this.notifySubscribers();
    // });


    
    

    this.socket.on('diceRolled', ({ playerName, roll, currentIndex }) => {
      const currentPlayer = this.players.find(player => player.name === playerName);
      
      
      if (currentPlayer) {
        currentPlayer.lastDiceValue = roll;
        currentPlayer.currentIndex = currentIndex;
        
        this.playerPositions[playerName] = currentIndex;
        
        // Force a new reference for playerPositions
        this.playerPositions = { ...this.playerPositions };

        console.log("Updated playerPositions for", playerName, ":", {
          rawPosition: currentIndex,
          storedPosition: this.playerPositions[playerName]
        });
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

    this.socket.on('promptBuyProperty', ({ property, player }) => {
      // Prompt the player to buy the property
      this.promptBuyProperty(property, player);
    });

    this.socket.on('confirmPurchase', (propertyId: number) => {
      this.confirmPurchase(propertyId);
    });

    this.socket.on('skipPurchase', () => {
      this.skipPurchase();
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


  private promptBuyProperty(property: GameBoardSpace, player: ClientPlayerData) {
    console.log(`${player.name}, do you want to buy ${property.name}?`);

    // Prompt the player to buy property with a UI, such as a modal or alert
    // This can be implemented in the UI layer
}

public confirmPurchase(propertyId: number): void {
    this.socket.emit('confirmPurchase', { propertyId });
    console.log(`Property with ID ${propertyId} purchased.`);
}

public skipPurchase(): void {
    this.socket.emit('skipPurchase');
    console.log('Purchase skipped.');
    this.nextTurn();
}




  public get boardData(): GameBoardSpace[] {
    return this._boardData;
  }

  public get lastBoardUpdate(): number {
    return this._lastBoardUpdate;
  }


  public get updatedBoard(): GameBoardSpace[] {
    if (this._boardData.length === 0) {
      console.warn('Board data is empty');
      return [];
    }
    
    console.log('Returning updated board data:', this._boardData);
    return [...this._boardData];
  }

  public requestBoardUpdate(): void {
    this.socket.emit('requestBoardData');
  }

  public hasSpaceBeenUpdated(spaceIndex: number): boolean {
    const space = this._boardData.find(space => space.index === spaceIndex);
    return !!space;
  }

  public getBoardSpace(spaceIndex: number): GameBoardSpace | undefined {
    return this._boardData.find(space => space.index === spaceIndex);
  }

  public subscribeToBoardUpdates(callback: () => void): () => void {
    // Subscribe to board updates
    const unsubscribe = this.subscribe(callback);

    if (this.boardData.length > 0) {
      callback();
    }
  
    // Return the unsubscribe function to allow cleanup
    return unsubscribe;
  }



  public subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notifySubscribers(): void {
    if (this._boardData.length > 0) {
      console.log('Notifying subscribers of board update:', {
        boardLength: this._boardData.length,
        lastUpdate: this._lastBoardUpdate,
        sampleSpace: this._boardData[0]
      });
    }
    this.subscribers.forEach(callback => callback());
  }


  private convertToClientPlayerData(player: ServerPlayerData): ClientPlayerData {
    return {
      ...player,
      playerTurn: false,
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
    currentPlayerId: this._currentPlayerId,
    allPlayers: this.players.getArray().map(p => ({ id: p.id, name: p.name }))
  };
  
  console.log('State snapshot before roll:', stateSnapshot);

  const currentPlayer = this.currentPlayer || this.gameState.currentPlayer;
  if (!currentPlayer) {
    console.log('No current player found after resync attempt');
    return;
  }

  // Resync current player if needed
  if (!this.currentPlayer && this.gameState.currentPlayer) {
    this._currentPlayerId = this.gameState.currentPlayer.id;
    const playerIndex = this.players.getArray().findIndex(
      player => player.id === this._currentPlayerId
    );
    if (playerIndex !== -1) {
      this.players.index = playerIndex;
      console.log('Resynced current player:', this.currentPlayer);
    }
  }

  const isCurrentPlayerTurn = this._currentPlayerId === currentPlayer.id || 
                            this.gameState.currentPlayer?.id === currentPlayer.id;

  if (!isCurrentPlayerTurn) {
    console.log('Turn validation failed:', {
      expectedId: this._currentPlayerId,
      attemptingId: currentPlayer.id,
      gameStatePlayerId: this.gameState.currentPlayer?.id
    });
    this.addLog(`It's not your turn! Please wait for ${this.gameState.currentPlayer?.name}'s turn.`);
    return;
  }

  console.log('Rolling dice for player:', currentPlayer.name);
  this.socket.emit('rollDice');
  
  this.socket.once('diceRolled', ({ playerName, roll, currentIndex }) => {
    console.log('Dice rolled event received:', { playerName, roll, currentIndex });
    if (this.currentPlayer) {
      this.currentPlayer.lastDiceValue = roll;
      this.currentPlayer.currentIndex = currentIndex;
    }
    if (this.gameState.currentPlayer) {
      this.gameState.currentPlayer.lastDiceValue = roll;
      this.gameState.currentPlayer.currentIndex = currentIndex;
    }
    
    this.emitPlayerPosition(currentPlayer.id, currentIndex);
    console.log("Dice roll completed for player:", playerName, "Roll:", roll, "Position:", currentIndex);
    this.notifySubscribers();

    const currentBoardSpace = this.getBoardSpace(currentIndex);
    if (currentBoardSpace) {
      this.handleLandedSpace(this.currentPlayer!, currentBoardSpace);
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

  public handleLandedSpace(player: ClientPlayerData, space: GameBoardSpace): void {
    // Handle properties that can be owned (like avenues, utilities, railroads)
    if (['RAILROADS', 'AVENUE', 'ELECTRIC', 'WATER'].includes(space.type)) {
        if (space.propertyData?.owner && space.propertyData?.owner !== player.id) {
            // Space is owned by another player; pay rent
            const rent = space.propertyData?.rent;
            player.balance -= rent;
            const owner = this.players.find(p => p.id === space.propertyData?.owner);
            if (owner) {
                owner.balance += rent;
                this.addLog(`${player.name} paid $${rent} in rent to ${owner.name}`);
                this.rentProperty(space); // Use socket event to handle rent payment server-side if needed
            }
        } else if (space.propertyData?.owner === player.id) {
            this.addLog(`${player.name} landed on their own property, ${space.name}`);
        } else {
            // Unowned property; prompt to buy
            this.promptBuyProperty(space, player);
        }
    } else {
        // Handle other space types
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
            case 'VISITING':
                this.addLog(`${player.name} is just visiting jail`);
                break;
            case 'JAIL':
                this.addLog(`${player.name} has been sent to jail`);
                this.sendToJail(player); // Call sendToJail function to move player to jail space
                break;
            case 'GO':
                player.balance += 200;
                this.addLog(`${player.name} landed on GO and collected $200`);
                break;
            case 'PARKING':
                this.addLog(`${player.name} landed on Free Parking`);
                break;
            default:
                this.addLog(`${player.name} landed on an unknown space type.`);
        }
    }

    this.emitGameState();
    this.nextTurn();
}



  public nextTurn(): void {
    const previousPlayer = this.players.current();
    const nextPlayer = this.players.next();
    
    if (previousPlayer && nextPlayer) {
      this.addLog(`Turn ended for ${previousPlayer.name}. ${nextPlayer.name}'s turn begins.`);
      
      // Emit turn change to server
      this.socket.emit('turnChanged', nextPlayer.id);
      this._currentPlayerId = nextPlayer.id;

      // Update local game state
      this.updatePlayers(this.players.getArray());

     
      this.notifySubscribers();
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

  private sendToJail(player: ClientPlayerData): void {
    const jailIndex = this.boardData.findIndex((space) => space.name === 'Jail');
    if (jailIndex !== -1) {
      player.currentIndex = jailIndex;
      player.isInJail = true;
      this.addLog(`${player.name} has been sent to jail.`);
      this.emitPlayerPosition(player.id, jailIndex);
    } else {
      console.error('Jail space not found in the board data.');
    }
  }

  // New rentProperty method
  public rentProperty(property: GameBoardSpace): void {
    this.socket.emit('rentProperty', this.boardData.indexOf(property));
  }

  public get currentPlayer(): ClientPlayerData | null {
    // First try to get the current player from the cycled array
    const cycledPlayer = this.players.current();
    
    // If we have a currentPlayerId, try to find that player
    if (this._currentPlayerId) {
      const playerById = this.players.find(player => player.id === this._currentPlayerId);
      if (playerById) {
        return playerById;
      }
    }
    
    // If we have a gameState currentPlayer, use that
    if (this.gameState.currentPlayer) {
      const gameStatePlayer = this.players.find(player => player.id === this.gameState.currentPlayer?.id);
      if (gameStatePlayer) {
        return gameStatePlayer;
      }
    }
    
    // Fall back to the cycled player if we found one
    return cycledPlayer || null;
  }

  public emitPlayerPosition(playerId: string, position: number): void {
    const player = this.players.find(p => p.id === playerId);
    if (player && player.name) {
      // Create new reference for positions object
      this.playerPositions = {
        ...this.playerPositions,
        [player.name]: position
      };

      console.log(`Emitting position for ${player.name}:`, position);
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