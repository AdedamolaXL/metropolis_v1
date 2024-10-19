import { Server, Socket } from 'socket.io';
import { GameManager } from './gameLogic';

const gameManager = new GameManager();

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('A user connected', socket.id);

  socket.emit('gameState', gameManager.getGameState());

  socket.on('joinGame', (playerData) => {
    try {
      const newPlayer = gameManager.addPlayer(playerData.name);
      io.emit('gameState', gameManager.getGameState());
    } catch (error) {
      socket.emit('error', (error as Error).message);
    }
  });

  socket.on('rollDice', (roll) => {
    // Implement dice roll logic
    io.emit('diceRolled', { playerId: socket.id, roll});
  });

  socket.on('buyProperty', (propertyId) => {
    // property purchase logic
    io.emit('updateProperties', gameManager.getGameState().properties);
    io.emit('updatePlayers', gameManager.getGameState().players);
    gameManager.nextTurn();
    io.emit('gameState', gameManager.getGameState());
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    // player disconnect logic
    io.emit('gameState', gameManager.getGameState());
  });
  });
}