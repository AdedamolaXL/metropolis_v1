import { Cycled } from '../utilities/cycled';
import { ServerPlayerData, Property, GameState, GameBoardSpace, ClientPlayerData } from '../shared/types';
import { COLORS, GAME_SETTINGS, CARDS } from '../shared/constants';
import fs from 'fs';
import path from 'path';

export class GameManager {
  private players: Cycled<ServerPlayerData>;
  private walletToPlayerMap: Map<string, ServerPlayerData> = new Map();
  private properties: Property[] = [];
  private boardData: GameBoardSpace[];

  constructor() {
    this.players = new Cycled<ServerPlayerData>([]);
    this.boardData = this.loadBoardData();
    this.initializeProperties();
  }

  

  private loadBoardData(): GameBoardSpace[] {
    try {
      const boardDataPath = path.join(__dirname, '../shared/data/gameBlocks.json');
      const boardData = JSON.parse(fs.readFileSync(boardDataPath, 'utf8'));
      return boardData as GameBoardSpace[];
    } catch (error) {
      throw new Error('Failed to load board data');
    }
  }

  getBoardData(): GameBoardSpace[] {
    return this.boardData;
  }

  private initializeProperties() {
    this.properties = this.boardData.map((block, index) =>
      block.price && block.baserent ? this.createProperty(block, index) : this.createSpecialBlock(block, index)
    );
  }

  private createProperty(block: GameBoardSpace, index: number): Property {
    return {
      id: index,
      name: block.name,
      price: Number(block.price),
      rent: Number(block.baserent),
      owner: null,
      groupNumber: block.groupNumber || undefined,
      color: block.color,
      imageName: block.imageName || undefined,
    };
  }

  private createSpecialBlock(block: GameBoardSpace, index: number): Property {
    return {
      id: index,
      name: block.name,
      price: 0,
      rent: 0,
      owner: null,
      groupNumber: undefined,
      color: block.color,
      imageName: block.imageName || undefined,
    };
  }

  addPlayer(name: string, walletAddress: string): ServerPlayerData {
    if (!name || !walletAddress) {
      throw new Error('Player name and wallet address are required');
    }
    console.log(`Attempting to add player: Name = ${name}, Wallet = ${walletAddress}`);
    
    if (this.players.getLength() >= GAME_SETTINGS.MAX_PLAYERS) {
      console.error('Maximum number of players reached');
      throw new Error('Maximum number of players reached');
    }

    if (this.walletToPlayerMap.has(walletAddress)) {
      const existingPlayer = this.walletToPlayerMap.get(walletAddress);
      console.log(`Player with wallet address ${walletAddress} already exists`);
      return existingPlayer!;
    }

    const assignedColors = new Set(Array.from(this.players).map(player => player.color));
    const availableColor = COLORS.find(color => !assignedColors.has(color));

    if (!availableColor) {
      console.error('No available colors left for new players');
      throw new Error('No available colors left for new players');
    }
      
       // Create new player
      const newPlayer: ServerPlayerData = {
        id: this.players.getLength().toString(),
        name,
        walletAddress,
        wealth: 1500,
        color: availableColor,
        currentIndex: 0,
        ownedProperties: [],
        getOutOfJailFree: 0,
        lastDiceValue: 0,
      };
  
      this.players.add(newPlayer);
      this.walletToPlayerMap.set(walletAddress, newPlayer)
      console.log(`Player ${name} added successfully with color ${availableColor}`);
      return newPlayer;
    }
  

  rollDice(playerId: string): number {
    const diceRoll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
    const player = this.players.find((p) => p.id === playerId);
    if (player) {
      // this.handlePlayerTurn(player, diceRoll);
      console.log(`Player ${player.name} rolled a ${diceRoll}`);
    } 
    return diceRoll;
  }

 handlePlayerTurn(player: ServerPlayerData, diceRoll: number) {
    player.currentIndex = (player.currentIndex + diceRoll) % this.boardData.length;
    const currentBlock = this.boardData[player.currentIndex];
    console.log(player.currentIndex)
    console.log(`Board data length: ${this.boardData.length}`);
    console.log(`Current block: ${player.name} is on ${currentBlock.name}`);



    switch (currentBlock.type) {
      case 'GO':
      player.wealth += 200;
      break;

      case 'AVENUE':
        const property = this.properties[player.currentIndex];
        if (property.owner && property.owner !== player.id) this.payRent(player, property);
        break;

      case 'CHANCE':
      case 'COMMUNITY':
        const card = this.drawCard(player, currentBlock.type);
        break;

      case 'JAIL':
        this.sendToJail(player);
        break;

        case 'LUXURY':
          player.wealth -= 200;
          break;

          case 'INCOME':
            player.wealth -= 200;
            break;
    
        case 'ELECTRIC':
          const eUtility = this.properties[player.currentIndex];
          if (eUtility.owner && eUtility.owner !== player.id) {
            const rentMultiplier = diceRoll;
            this.payRent(player, eUtility, rentMultiplier);
          }
          break;

        case 'WATER':
          const wUtility = this.properties[player.currentIndex];
          if (wUtility.owner && wUtility.owner !== player.id) {
            const rentMultiplier = diceRoll
            this.payRent(player, wUtility, rentMultiplier);
          }
          break;

      case 'PARKING':
        break;

      case 'VISITING':
        break

      case 'RAILROADS':
          const railroad = this.properties[player.currentIndex];
          if (railroad.owner && railroad.owner !== player.id) {
            this.payRent(player, railroad, 2);
          }
          break;
        
      default:
        break;

      

    }
    this.boardData.forEach((block, index) => {
      if (!block.type) console.error(`Block at index ${index} is missing a type`);
    });
    return player.currentIndex
  }

  private sendToJail(player: ServerPlayerData) {
    player.currentIndex = this.boardData.findIndex((space) => space.name === 'Jail');
    player.isInJail = true;
  }

  private drawCard(player: ServerPlayerData, cardType: 'CHANCE' | 'COMMUNITY') {
    const cardList = cardType === 'CHANCE' ? Object.values(CARDS.CHANCE) : Object.values(CARDS.COMMUNITY);
    const card = cardList[Math.floor(Math.random() * cardList.length)];

    if (card === CARDS.COMMUNITY.BANK_DIVIDEND) {
      player.wealth += 200;
    } else if (card === CARDS.COMMUNITY.GO_TO_JAIL) {
      this.sendToJail(player);
    }

    return card;
  }

  buyProperty(playerId: string, propertyId: number): boolean {
    const player = this.players.find((p) => p.id === playerId);
    const property = this.properties[propertyId];

    if (!player || !property || property.owner) return false;
    if (player.wealth >= property.price) {
      player.wealth -= property.price;
      property.owner = player.id;
      return true;
    }
    return false;
  }

  private payRent(player: ServerPlayerData, property: Property,  multiplier: number = 1) {
    if (!property.owner) return;

    const owner = this.players.find((p) => p.id === property.owner);
    if (!owner) return;

    const rentAmount = property.rent * multiplier;
    player.wealth -= rentAmount;
    owner.wealth += rentAmount;
  }

  removePlayer(playerId: string): void {
    const playerToRemove = this.players.find(player => player.id === playerId);
    if (!playerToRemove) return;

    this.walletToPlayerMap.delete(playerToRemove.walletAddress); // Remove wallet mapping
    this.players.remove(playerToRemove);

    // Reset property ownership for removed player
    this.properties.forEach((property) => {
      if (property.owner === playerId) {
        property.owner = null;
      }
    });
  }

 // Update GameManager to include this method
private transformToClientPlayerData(serverPlayer: ServerPlayerData): ClientPlayerData {
  return {
    id: serverPlayer.id,
    walletAddress: serverPlayer.walletAddress,
    name: serverPlayer.name,
    wealth: serverPlayer.wealth,
    color: serverPlayer.color,
    currentIndex: serverPlayer.currentIndex,
    ownedProperties: serverPlayer.ownedProperties,
    playerTurn: 0, // or calculate/set this if required
    lastTurnBlockID: null, // or assign based on game logic if needed
    lastDiceValue: 0, // initialize or set accordingly
    getOutOfJailFree: serverPlayer.getOutOfJailFree,
    balance: serverPlayer.wealth // or use another logic if necessary
  };
}

// Update getGameState to use this transformation
getGameState(): GameState {
  return {
    players: this.players.getArray().map(player => this.transformToClientPlayerData(player)),
    properties: this.properties,
    currentPlayer: this.players.current() ? this.transformToClientPlayerData(this.players.current()!) : null
  };
}
  

  nextTurn() {
    const previousPlayer = this.players.current();
    const nextPlayer = this.players.next();
  
    if (previousPlayer && nextPlayer) {
      // Notify clients about the turn change
      this.onPlayerChange(() => this.getGameState());
    }
  }

  getCurrentPlayer(): ServerPlayerData | null {
    return this.players.current() || null;
  }

  onPlayerChange(listener: (currentPlayer: ServerPlayerData) => void): () => void {
    return this.players.subscribe(listener);
  }
}