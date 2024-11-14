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
    socket.on('joinGame', ({ name, walletAddress }) => {
      console.log('Received joinGame event:', { name, walletAddress }); // Add this line to check values
        if (!name || !walletAddress) {
      socket.emit('error', 'Player name and wallet address are required');
        return;
      }  
      try {
        const player = gameManager.addPlayer(name, walletAddress);
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
        const currentIndex = gameManager.handlePlayerTurn(player, diceRoll);
        io.emit('diceRolled', 
          {playerName: player.name, roll: diceRoll, currentIndex: currentIndex });
      
        // Emit the specific update for board data right after handlePlayerTurn
        io.emit('updateBoardData', gameManager.getBoardData());
        
       // Emit updated game state after handling the turn
       io.emit('gameState', gameManager.getGameState());

       gameManager.nextTurn();
       io.emit('gameState', gameManager.getGameState());
      }
    });

    socket.on('turnChanged', (nextPlayerId) => {
      // socket.emit('turnChanged', playerId);
      // console.log(`Emitted turnChanged for player ${playerId}`);

      console.log(`turnChanged received for player ${nextPlayerId}`);
      gameManager.nextTurn();
      io.emit('gameState', gameManager.getGameState());
      console.log('Game state updated:', gameManager.getGameState());
    });
  

    // Handle player buying a property
    // In socketHandler.ts

socket.on('buyProperty', (propertyId: number) => {
  console.log('Attempting to buy property with ID:', propertyId);
  const player = gameManager.getCurrentPlayer();
  console.log('Current player:', player); 
  if (player) {
    const success = gameManager.buyProperty(player.id, propertyId);
    if (success) {
      console.log('Property bought successfully, updating game state');
      io.emit('updateProperties', gameManager.getGameState().properties);
      io.emit('updatePlayers', gameManager.getGameState().players);
      io.emit('gameState', gameManager.getGameState());
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
