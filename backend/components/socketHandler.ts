import { Server, Socket } from 'socket.io';
import { GameManager } from './gameLogic';
import { ServerPlayerData } from '../shared/types';

const gameManager = new GameManager();

export function setupSocketHandlers(io: Server) {
  // Subscribe to player changes and automatically emit the updated game state
  gameManager.onPlayerChange(() => {
    io.emit('gameState', gameManager.getGameState()); // Broadcast game state without using `currentPlayer`
  });

  io.on('connection', (socket: Socket) => {
    console.log('A user connected', socket.id);

    // Send the initial game state to the connected client
    socket.emit('gameState', gameManager.getGameState());

    // Handle player joining the game
    socket.on('joinGame', (playerData: { name: string }) => {
      try {
        const newPlayer: ServerPlayerData = gameManager.addPlayer(playerData.name);
        socket.emit('gameBoardData', gameManager.getBoardData()); // Send board data to the new player
        io.emit('gameState', gameManager.getGameState()); // Broadcast updated game state to all players
      } catch (error) {
        socket.emit('error', (error as Error).message); // Send error to the player if max players are reached
      }
    });

    // Handle player rolling the dice
    socket.on('rollDice', () => {
      const player = gameManager.getCurrentPlayer();
      if (player) {
        const diceRoll = gameManager.rollDice(player.id);
        io.emit('diceRolled', { playerId: socket.id, roll: diceRoll });
        io.emit('gameState', gameManager.getGameState()); // Emit updated game state
      }
    });

    // Handle player buying a property
    // In socketHandler.ts

socket.on('buyProperty', (propertyId) => {
  const player = gameManager.getCurrentPlayer();
  if (player) {
    const success = gameManager.buyProperty(player.id, propertyId);
    if (success) {
      io.emit('updateProperties', gameManager.getGameState().properties);
      io.emit('updatePlayers', gameManager.getGameState().players);
    } else {
      socket.emit('error', 'Cannot purchase property. Either owned or insufficient funds.');
    }
  }
});


    

    // Handle player disconnection
    socket.on('disconnect', () => {
      console.log('A user disconnected:', socket.id);
      gameManager.removePlayer(socket.id);
      // Implement player disconnect logic if needed, like removing from GameManager
      io.emit('gameState', gameManager.getGameState());
    });
  });
}
