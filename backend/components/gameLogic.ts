import { Cycled } from '../utilities/cycled';
import { ServerPlayerData, Property, GameState, GameBoardSpace, ClientPlayerData } from '../shared/types';
import { COLORS, GAME_SETTINGS, CARDS } from '../shared/constants';
import fs from 'fs';
import path from 'path';

export class GameManager {
  private players: Cycled<ServerPlayerData>;
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

  addPlayer(name: string): ServerPlayerData {
    if (this.players.getLength() >= GAME_SETTINGS.MAX_PLAYERS) {
      throw new Error('Maximum number of players reached');
    }
    const newPlayer: ServerPlayerData = {
      id: this.players.getLength().toString(),
      name,
      wealth: 1500,
      color: COLORS[this.players.getLength()],
      currentIndex: 0,
      ownedProperties: [],
      getOutOfJailFree: 0
    };
    this.players.add(newPlayer);
    return newPlayer;
  }

  rollDice(playerId: string): number {
    const diceRoll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
    const player = this.players.find((p) => p.id === playerId);
    if (player) this.handlePlayerMove(player, diceRoll);
    return diceRoll;
  }

  private handlePlayerMove(player: ServerPlayerData, diceRoll: number) {
    player.currentIndex = (player.currentIndex + diceRoll) % this.boardData.length;
    const currentBlock = this.boardData[player.currentIndex];

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

        case 'TAX':
          player.wealth -= 100;
          break;
    
        case 'UTILITIES':
          const utility = this.properties[player.currentIndex];
          if (utility.owner && utility.owner !== player.id) {
            const rentMultiplier = Math.floor(Math.random() * 6) + 1;
            this.payRent(player, utility, rentMultiplier);
          }
          break;

      case 'PARKING':
        break;

      case 'RAILROADS':
          const railroad = this.properties[player.currentIndex];
          if (railroad.owner && railroad.owner !== player.id) {
            this.payRent(player, railroad, 2);
          }
          break;
        
      default:
        break;
    }
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
    
    if (playerToRemove) {
      this.players.remove(playerToRemove);
    }
  
    this.properties.forEach((property) => {
      if (property.owner === playerId) {
        property.owner = null;
      }
    });
  }

  getGameState(): GameState {
    return {
      players: this.players.getArray() as ClientPlayerData[],
      properties: this.properties,
      currentPlayer: this.players.current() || null
    };
  }
  

  nextTurn() {
    return this.players.next();
  }

  getCurrentPlayer(): ServerPlayerData | null {
    return this.players.current() || null;
  }

  onPlayerChange(listener: (currentPlayer: ServerPlayerData) => void): () => void {
    return this.players.subscribe(listener);
  }
}
